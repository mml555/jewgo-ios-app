/* global Buffer */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class OIDCService {
  constructor(dbPool) {
    this.db = dbPool;
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.issuer = process.env.JWT_ISSUER || 'jewgo-auth';
    this.audience = process.env.JWT_AUDIENCE || 'jewgo-api';
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets must be configured');
    }
  }

  // ==============================================
  // OIDC CONFIGURATION
  // ==============================================

  getConfiguration() {
    return {
      issuer: this.issuer,
      authorization_endpoint: `${this.baseUrl}/api/v5/auth/authorize`,
      token_endpoint: `${this.baseUrl}/api/v5/auth/token`,
      userinfo_endpoint: `${this.baseUrl}/api/v5/auth/userinfo`,
      jwks_uri: `${this.baseUrl}/api/v5/auth/jwks.json`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['HS256', 'RS256'],
      scopes_supported: ['openid', 'profile', 'email'],
      claims_supported: [
        'sub',
        'iss',
        'aud',
        'exp',
        'iat',
        'email',
        'email_verified',
      ],
      code_challenge_methods_supported: ['S256'],
    };
  }

  // ==============================================
  // AUTHORIZATION CODE FLOW
  // ==============================================

  async generateAuthorizationCode(
    userId,
    clientId,
    redirectUri,
    scopes,
    codeChallenge,
    codeChallengeMethod,
  ) {
    const code = crypto.randomBytes(32).toString('hex');
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    // Store authorization code (expires in 10 minutes)
    await this.db.query(
      `
      INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
      VALUES ($1, $2, 'authorization_code', NOW() + INTERVAL '10 minutes')
    `,
      [userId, codeHash],
    );

    // Store additional code metadata
    await this.db.query(
      `
      INSERT INTO auth_events (user_id, event, success, details)
      VALUES ($1, 'authorization_code_generated', true, $2)
    `,
      [
        userId,
        JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          scopes: scopes,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
        }),
      ],
    );

    return code;
  }

  async exchangeCodeForTokens(code, clientId, redirectUri, codeVerifier) {
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Find and validate authorization code
      const codeResult = await client.query(
        `
        SELECT vt.user_id, vt.expires_at, ae.details
        FROM verification_tokens vt
        LEFT JOIN auth_events ae ON vt.user_id = ae.user_id 
          AND ae.event = 'authorization_code_generated'
          AND ae.created_at > NOW() - INTERVAL '10 minutes'
        WHERE vt.token_hash = $1 
          AND vt.purpose = 'authorization_code'
          AND vt.expires_at > NOW() 
          AND vt.used_at IS NULL
        ORDER BY ae.created_at DESC
        LIMIT 1
      `,
        [codeHash],
      );

      if (codeResult.rows.length === 0) {
        throw new Error('Invalid or expired authorization code');
      }

      const { user_id, details } = codeResult.rows[0];
      const codeDetails = details ? JSON.parse(details) : {};

      // Validate PKCE
      if (codeDetails.code_challenge) {
        const expectedChallenge = crypto
          .createHash('sha256')
          .update(codeVerifier)
          .digest('base64url');

        if (codeDetails.code_challenge !== expectedChallenge) {
          throw new Error('Invalid code verifier');
        }
      }

      // Mark code as used
      await client.query(
        `
        UPDATE verification_tokens 
        SET used_at = NOW() 
        WHERE token_hash = $1
      `,
        [codeHash],
      );

      // Get user information
      const userResult = await client.query(
        `
        SELECT id, primary_email, status, created_at
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL
      `,
        [user_id],
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Generate tokens
      const tokens = await this.generateTokens(
        user,
        codeDetails.scopes || ['openid'],
      );

      await client.query('COMMIT');

      // Log token exchange
      await this.logAuthEvent(user_id, 'token_exchange', true, {
        client_id: clientId,
        scopes: codeDetails.scopes,
      });

      return tokens;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==============================================
  // TOKEN GENERATION
  // ==============================================

  async generateTokens(user, scopes = ['openid']) {
    const now = Math.floor(Date.now() / 1000);

    // Access token (JWT)
    const accessTokenPayload = {
      sub: user.id,
      iss: this.issuer,
      aud: this.audience,
      iat: now,
      exp: now + 3600, // 1 hour
      scope: scopes.join(' '),
      email: user.primary_email,
      email_verified: user.status === 'active',
    };

    const accessToken = jwt.sign(accessTokenPayload, this.jwtSecret, {
      algorithm: 'HS256',
      keyid: 'default',
    });

    // ID token (JWT) - only if openid scope is requested
    let idToken = null;
    if (scopes.includes('openid')) {
      const idTokenPayload = {
        sub: user.id,
        iss: this.issuer,
        aud: this.audience,
        iat: now,
        exp: now + 3600, // 1 hour
        email: user.primary_email,
        email_verified: user.status === 'active',
      };

      idToken = jwt.sign(idTokenPayload, this.jwtSecret, {
        algorithm: 'HS256',
        keyid: 'default',
      });
    }

    // Refresh token (opaque)
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Store refresh token (expires in 30 days)
    await this.db.query(
      `
      INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
      VALUES ($1, $2, 'refresh_token', NOW() + INTERVAL '30 days')
    `,
      [user.id, refreshHash],
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: scopes.join(' '),
      ...(idToken && { id_token: idToken }),
    };
  }

  async refreshAccessToken(refreshToken, scopes = ['openid']) {
    const refreshHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Find and validate refresh token
      const tokenResult = await client.query(
        `
        SELECT vt.user_id, vt.expires_at
        FROM verification_tokens vt
        WHERE vt.token_hash = $1 
          AND vt.purpose = 'refresh_token'
          AND vt.expires_at > NOW() 
          AND vt.used_at IS NULL
      `,
        [refreshHash],
      );

      if (tokenResult.rows.length === 0) {
        throw new Error('Invalid or expired refresh token');
      }

      const { user_id } = tokenResult.rows[0];

      // Get user information
      const userResult = await client.query(
        `
        SELECT id, primary_email, status, created_at
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL
      `,
        [user_id],
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Mark old refresh token as used
      await client.query(
        `
        UPDATE verification_tokens 
        SET used_at = NOW() 
        WHERE token_hash = $1
      `,
        [refreshHash],
      );

      // Generate new tokens
      const tokens = await this.generateTokens(user, scopes);

      await client.query('COMMIT');

      // Log token refresh
      await this.logAuthEvent(user_id, 'token_refresh', true, {
        scopes: scopes,
      });

      return tokens;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==============================================
  // USERINFO ENDPOINT
  // ==============================================

  async getUserInfo(accessToken) {
    try {
      // Verify and decode access token
      const decoded = jwt.verify(accessToken, this.jwtSecret, {
        issuer: this.issuer,
        audience: this.audience,
      });

      // Get user information
      const userResult = await this.db.query(
        `
        SELECT id, primary_email, status, created_at
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL
      `,
        [decoded.sub],
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Return user info based on scopes
      const scopes = decoded.scope ? decoded.scope.split(' ') : ['openid'];
      const userInfo = {
        sub: user.id,
      };

      if (scopes.includes('profile')) {
        userInfo.email = user.primary_email;
        userInfo.email_verified = user.status === 'active';
      }

      if (scopes.includes('email')) {
        userInfo.email = user.primary_email;
        userInfo.email_verified = user.status === 'active';
      }

      return userInfo;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      } else {
        throw error;
      }
    }
  }

  // ==============================================
  // JWKS ENDPOINT
  // ==============================================

  getJWKS() {
    // For now, return a simple JWKS with the default key
    // In production, you would implement proper key rotation
    return {
      keys: [
        {
          kty: 'oct',
          kid: 'default',
          use: 'sig',
          alg: 'HS256',
          k: Buffer.from(this.jwtSecret).toString('base64url'),
        },
      ],
    };
  }

  // ==============================================
  // TOKEN INTROSPECTION
  // ==============================================

  async introspectToken(token) {
    try {
      // Try to verify as access token first
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: this.issuer,
        audience: this.audience,
      });

      return {
        active: true,
        sub: decoded.sub,
        iss: decoded.iss,
        aud: decoded.aud,
        exp: decoded.exp,
        iat: decoded.iat,
        scope: decoded.scope,
        token_type: 'Bearer',
      };
    } catch (error) {
      // Check if it's a refresh token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const result = await this.db.query(
        `
        SELECT vt.user_id, vt.expires_at
        FROM verification_tokens vt
        WHERE vt.token_hash = $1 
          AND vt.purpose = 'refresh_token'
          AND vt.expires_at > NOW() 
          AND vt.used_at IS NULL
      `,
        [tokenHash],
      );

      if (result.rows.length > 0) {
        return {
          active: true,
          sub: result.rows[0].user_id,
          token_type: 'refresh_token',
        };
      }

      return {
        active: false,
      };
    }
  }

  // ==============================================
  // TOKEN REVOCATION
  // ==============================================

  async revokeToken(token) {
    try {
      // Try to decode as JWT first
      const decoded = jwt.decode(token);

      if (decoded && decoded.sub) {
        // For JWT tokens, we can't revoke them individually
        // In production, you might maintain a blacklist
        return { success: true, message: 'Token will expire naturally' };
      }
    } catch (error) {
      // Not a JWT, might be a refresh token
    }

    // Try to revoke as refresh token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await this.db.query(
      `
      UPDATE verification_tokens 
      SET used_at = NOW() 
      WHERE token_hash = $1 AND used_at IS NULL
      RETURNING user_id
    `,
      [tokenHash],
    );

    if (result.rows.length > 0) {
      await this.logAuthEvent(result.rows[0].user_id, 'token_revoked', true, {
        token_type: 'refresh_token',
      });
    }

    return { success: true };
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  async logAuthEvent(userId, event, success, details = {}) {
    try {
      await this.db.query(
        `
        INSERT INTO auth_events (user_id, event, success, details)
        VALUES ($1, $2, $3, $4)
      `,
        [userId, event, success, JSON.stringify(details)],
      );
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  validateRedirectUri(redirectUri, allowedUris) {
    // Simple validation - in production, implement proper URI validation
    return allowedUris.includes(redirectUri);
  }

  validateScopes(requestedScopes, allowedScopes) {
    const scopes = requestedScopes.split(' ');
    return scopes.every(scope => allowedScopes.includes(scope));
  }

  generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  generateNonce() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = OIDCService;
