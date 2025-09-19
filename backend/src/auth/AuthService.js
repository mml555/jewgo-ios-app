const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Pool } = require('pg');
const { promisify } = require('util');

class AuthService {
  constructor(dbPool, keyRotationService = null) {
    this.db = dbPool;
    this.keyRotationService = keyRotationService;
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenTTL = process.env.JWT_ACCESS_TTL || '15m';
    this.refreshTokenTTL = process.env.JWT_REFRESH_TTL || '7d';
    
    if (!this.keyRotationService && (!this.jwtSecret || !this.jwtRefreshSecret)) {
      throw new Error('JWT secrets or key rotation service must be configured');
    }
  }

  // ==============================================
  // USER MANAGEMENT
  // ==============================================

  async createUser(userData) {
    const { email, firstName, lastName, password, deviceInfo } = userData;
    
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
      // Hash password if provided
      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 12);
      }
      
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, primary_email, status, first_name, last_name, password_hash) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, primary_email, status, created_at`,
        [email, email, 'pending', firstName || '', lastName || '', passwordHash]
      );
      
      const user = userResult.rows[0];
      
      // Create password identity if provided
      if (password) {
        const identityResult = await client.query(
          `INSERT INTO identities (user_id, type) 
           VALUES ($1, $2) 
           RETURNING id`,
          [user.id, 'password']
        );
        
        await client.query(
          `INSERT INTO credentials (identity_id, cred_type, cred_hash) 
           VALUES ($1, $2, $3)`,
          [identityResult.rows[0].id, 'password_hash', passwordHash]
        );
      }
      
      // Create device if provided
      let deviceId = null;
      if (deviceInfo) {
        deviceId = await this.createOrUpdateDevice(user.id, deviceInfo, client);
      }
      
      await client.query('COMMIT');
      
      // Log registration event
      await this.logAuthEvent(user.id, 'register', true, { 
        method: password ? 'password' : 'oauth',
        device_id: deviceId 
      });
      
      return {
        user: {
          id: user.id,
          email: user.primary_email,
          status: user.status,
          createdAt: user.created_at
        },
        deviceId
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserById(userId) {
    const result = await this.db.query(
      `SELECT id, primary_email, status, created_at, updated_at 
       FROM users 
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    
    return result.rows[0] || null;
  }

  async getUserByEmail(email) {
    const result = await this.db.query(
      `SELECT id, primary_email, status, created_at, updated_at 
       FROM users 
       WHERE primary_email = $1 AND deleted_at IS NULL`,
      [email]
    );
    
    return result.rows[0] || null;
  }

  // ==============================================
  // PASSWORD AUTHENTICATION
  // ==============================================

  async authenticatePassword(email, password, deviceInfo, ipAddress, userAgent) {
    const client = await this.db.connect();
    try {
      // Get user and password credential
      const result = await client.query(`
        SELECT u.id, u.primary_email, u.status, c.cred_hash
        FROM users u
        JOIN identities i ON u.id = i.user_id AND i.type = 'password'
        JOIN credentials c ON i.id = c.identity_id AND c.cred_type = 'password_hash'
        WHERE u.primary_email = $1 AND u.deleted_at IS NULL
      `, [email]);
      
      if (result.rows.length === 0) {
        await this.logAuthEvent(null, 'login', false, { 
          email, 
          reason: 'user_not_found',
          ip: ipAddress 
        });
        throw new Error('Invalid credentials');
      }
      
      const user = result.rows[0];
      
      if (user.status !== 'active') {
        await this.logAuthEvent(user.id, 'login', false, { 
          email, 
          reason: 'account_inactive',
          status: user.status,
          ip: ipAddress 
        });
        throw new Error('Account is not active');
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.cred_hash);
      if (!isValidPassword) {
        await this.logAuthEvent(user.id, 'login', false, { 
          email, 
          reason: 'invalid_password',
          ip: ipAddress 
        });
        throw new Error('Invalid credentials');
      }
      
      // Create or update device
      let deviceId = null;
      if (deviceInfo) {
        deviceId = await this.createOrUpdateDevice(user.id, deviceInfo, client);
      }
      
      // Create session and tokens
      const session = await this.createSession(user.id, deviceId, ipAddress, userAgent, client);
      const tokens = await this.generateTokens(user.id, session);
      
      // Log successful login
      await this.logAuthEvent(user.id, 'login', true, { 
        email, 
        device_id: deviceId,
        session_id: session.id,
        ip: ipAddress 
      });
      
      return {
        user: {
          id: user.id,
          email: user.primary_email,
          status: user.status
        },
        tokens,
        session: {
          id: session.id,
          expiresAt: session.expires_at
        }
      };
      
    } finally {
      client.release();
    }
  }

  // ==============================================
  // TOKEN MANAGEMENT
  // ==============================================

  async generateTokens(userId, session) {
    const now = Math.floor(Date.now() / 1000);
    
    // Access token
    let accessToken;
    if (this.keyRotationService) {
      accessToken = this.keyRotationService.signToken({
        sub: userId,
        sid: session.id
      }, {
        expiresIn: this.accessTokenTTL,
        issuer: process.env.JWT_ISSUER || 'jewgo-auth',
        audience: process.env.JWT_AUDIENCE || 'jewgo-api'
      });
    } else {
      accessToken = jwt.sign(
        {
          sub: userId,
          sid: session.id,
          iat: now,
          exp: now + this.parseTTL(this.accessTokenTTL),
          iss: process.env.JWT_ISSUER || 'jewgo-auth',
          aud: process.env.JWT_AUDIENCE || 'jewgo-api'
        },
        this.jwtSecret,
        { 
          algorithm: 'HS256',
          keyid: 'default'
        }
      );
    }
    
    // Refresh token (opaque)
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // Store refresh token hash in session
    await this.db.query(
      `UPDATE sessions 
       SET refresh_hash = $1, current_jti = $2
       WHERE id = $3`,
      [refreshHash, session.current_jti, session.id]
    );
    
    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseTTL(this.accessTokenTTL),
      tokenType: 'Bearer'
    };
  }

  async refreshTokens(refreshToken, ipAddress, userAgent) {
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
      // Find session by refresh token hash
      const sessionResult = await client.query(`
        SELECT s.*, u.id as user_id, u.primary_email, u.status
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.refresh_hash = $1 
          AND s.revoked_at IS NULL 
          AND s.expires_at > NOW()
      `, [refreshHash]);
      
      if (sessionResult.rows.length === 0) {
        await this.logAuthEvent(null, 'refresh', false, { 
          reason: 'invalid_token',
          ip: ipAddress 
        });
        throw new Error('Invalid refresh token');
      }
      
      const session = sessionResult.rows[0];
      
      // Check for token reuse (security)
      if (session.reused_jti_of) {
        // Token reuse detected - revoke entire family
        await this.revokeSessionFamily(session.family_jti, 'token_reuse_detected', client);
        await this.logAuthEvent(session.user_id, 'refresh', false, { 
          reason: 'token_reuse',
          family_jti: session.family_jti,
          ip: ipAddress 
        });
        throw new Error('Token reuse detected');
      }
      
      // Generate new tokens
      const newJti = crypto.randomUUID();
      const newRefreshToken = crypto.randomBytes(32).toString('hex');
      const newRefreshHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      
      // Update session with new tokens
      await client.query(`
        UPDATE sessions 
        SET current_jti = $1, 
            refresh_hash = $2,
            last_used_at = NOW()
        WHERE id = $3
      `, [newJti, newRefreshHash, session.id]);
      
      await client.query('COMMIT');
      
      // Generate new access token
      const tokens = await this.generateTokens(session.user_id, { ...session, current_jti: newJti });
      
      // Log refresh event
      await this.logAuthEvent(session.user_id, 'refresh', true, { 
        session_id: session.id,
        ip: ipAddress 
      });
      
      return {
        user: {
          id: session.user_id,
          email: session.primary_email,
          status: session.status
        },
        tokens,
        session: {
          id: session.id,
          expiresAt: session.expires_at
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async revokeSession(sessionId, reason = 'manual_revoke') {
    const result = await this.db.query(
      `UPDATE sessions 
       SET revoked_at = NOW() 
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING user_id`,
      [sessionId]
    );
    
    if (result.rows.length > 0) {
      await this.logAuthEvent(result.rows[0].user_id, 'logout', true, { 
        session_id: sessionId,
        reason 
      });
    }
    
    return result.rows.length > 0;
  }

  async revokeSessionFamily(familyJti, reason = 'family_revoke') {
    const result = await this.db.query(
      `UPDATE sessions 
       SET revoked_at = NOW() 
       WHERE family_jti = $1 AND revoked_at IS NULL
       RETURNING user_id, id`,
      [familyJti]
    );
    
    if (result.rows.length > 0) {
      const userId = result.rows[0].user_id;
      await this.logAuthEvent(userId, 'session_revoke_family', true, { 
        family_jti: familyJti,
        reason,
        count: result.rows.length 
      });
    }
    
    return result.rows.length;
  }

  // ==============================================
  // SESSION MANAGEMENT
  // ==============================================

  async createSession(userId, deviceId, ipAddress, userAgent, client = null) {
    const dbClient = client || await this.db.connect();
    
    try {
      const familyJti = crypto.randomUUID();
      const currentJti = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + this.parseTTL(this.refreshTokenTTL) * 1000);
      
      const result = await dbClient.query(`
        INSERT INTO sessions (user_id, family_jti, current_jti, refresh_hash, device_id, ip_address, user_agent, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, family_jti, current_jti, expires_at, created_at
      `, [userId, familyJti, currentJti, 'placeholder', deviceId, ipAddress, userAgent, expiresAt]);
      
      return result.rows[0];
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  async getActiveSessions(userId) {
    const result = await this.db.query(`
      SELECT s.id, s.created_at, s.last_used_at, s.expires_at, s.ip_address, s.user_agent,
             d.platform, d.device_handle
      FROM sessions s
      LEFT JOIN devices d ON s.device_id = d.id
      WHERE s.user_id = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()
      ORDER BY s.last_used_at DESC
    `, [userId]);
    
    return result.rows;
  }

  // ==============================================
  // DEVICE MANAGEMENT
  // ==============================================

  async createOrUpdateDevice(userId, deviceInfo, client = null) {
    const dbClient = client || await this.db.connect();
    
    try {
      const deviceHandle = this.generateDeviceHandle(deviceInfo);
      
      // Try to find existing device
      const existingResult = await dbClient.query(
        `SELECT id FROM devices WHERE user_id = $1 AND device_handle = $2`,
        [userId, deviceHandle]
      );
      
      if (existingResult.rows.length > 0) {
        // Update existing device
        await dbClient.query(
          `UPDATE devices 
           SET last_seen_at = NOW(), signals = $1
           WHERE id = $2`,
          [JSON.stringify(deviceInfo), existingResult.rows[0].id]
        );
        return existingResult.rows[0].id;
      } else {
        // Create new device with ON CONFLICT handling
        const result = await dbClient.query(`
          INSERT INTO devices (user_id, platform, device_handle, signals)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (device_handle) DO UPDATE SET
            last_seen_at = NOW(),
            signals = EXCLUDED.signals
          RETURNING id
        `, [userId, deviceInfo.platform, deviceHandle, JSON.stringify(deviceInfo)]);
        
        return result.rows[0].id;
      }
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  generateDeviceHandle(deviceInfo) {
    // Create a stable device fingerprint
    const fingerprint = [
      deviceInfo.platform,
      deviceInfo.model || 'unknown',
      deviceInfo.osVersion || 'unknown',
      deviceInfo.appVersion || 'unknown'
    ].join('|');
    
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  // ==============================================
  // AUDIT LOGGING
  // ==============================================

  async logAuthEvent(userId, event, success, details = {}) {
    try {
      await this.db.query(`
        INSERT INTO auth_events (user_id, event, success, details)
        VALUES ($1, $2, $3, $4)
      `, [userId, event, success, JSON.stringify(details)]);
    } catch (error) {
      // Don't throw - logging should never break auth flow
      console.error('Failed to log auth event:', error);
    }
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  parseTTL(ttl) {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid TTL format: ${ttl}`);
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: throw new Error(`Invalid TTL unit: ${unit}`);
    }
  }

  async cleanupExpiredData() {
    const result = await this.db.query('SELECT * FROM cleanup_expired_auth_data()');
    return result.rows[0];
  }
}

module.exports = AuthService;
