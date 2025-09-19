const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { Pool } = require('pg');

class MFAService {
  constructor(dbPool) {
    this.db = dbPool;
  }

  // ==============================================
  // TOTP (Time-based One-Time Password) METHODS
  // ==============================================

  async setupTOTP(userId) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Check if user already has TOTP setup
      const existingResult = await client.query(`
        SELECT c.id, c.meta
        FROM credentials c
        JOIN identities i ON c.identity_id = i.id
        WHERE i.user_id = $1 AND i.type = 'password' AND c.cred_type = 'totp_secret'
      `, [userId]);

      let secret, qrCodeUrl;

      if (existingResult.rows.length > 0) {
        // User already has TOTP, return existing secret
        const existing = existingResult.rows[0];
        secret = existing.meta.secret;
        qrCodeUrl = existing.meta.qr_code_url;
      } else {
        // Generate new TOTP secret
        secret = speakeasy.generateSecret({
          name: 'Jewgo App',
          issuer: 'Jewgo',
          length: 32
        });

        // Generate QR code URL
        qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Store the secret in database
        const identityResult = await client.query(`
          SELECT id FROM identities 
          WHERE user_id = $1 AND type = 'password'
        `, [userId]);

        if (identityResult.rows.length === 0) {
          throw new Error('User does not have password identity');
        }

        await client.query(`
          INSERT INTO credentials (identity_id, cred_type, meta)
          VALUES ($1, 'totp_secret', $2)
        `, [identityResult.rows[0].id, JSON.stringify({
          secret: secret.base32,
          qr_code_url: qrCodeUrl,
          setup_at: new Date().toISOString()
        })]);

        await client.query('COMMIT');
      }

      return {
        secret: secret.base32,
        qrCodeUrl,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async verifyTOTP(userId, token) {
    const client = await this.db.connect();
    try {
      // Get user's TOTP secret
      const result = await client.query(`
        SELECT c.meta
        FROM credentials c
        JOIN identities i ON c.identity_id = i.id
        WHERE i.user_id = $1 AND i.type = 'password' AND c.cred_type = 'totp_secret'
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('TOTP not set up for user');
      }

      const secret = result.rows[0].meta.secret;
      
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps (60 seconds) of tolerance
      });

      if (verified) {
        // Log successful MFA verification
        await this.logMFAEvent(userId, 'totp_verify', true, { method: 'totp' });
        return true;
      } else {
        // Log failed MFA verification
        await this.logMFAEvent(userId, 'totp_verify', false, { method: 'totp', reason: 'invalid_token' });
        return false;
      }

    } finally {
      client.release();
    }
  }

  async disableTOTP(userId) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        DELETE FROM credentials 
        WHERE identity_id IN (
          SELECT i.id FROM identities i 
          WHERE i.user_id = $1 AND i.type = 'password'
        ) AND cred_type = 'totp_secret'
        RETURNING id
      `, [userId]);

      await client.query('COMMIT');

      // Log MFA disable event
      await this.logMFAEvent(userId, 'totp_disable', true, { method: 'totp' });

      return result.rows.length > 0;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async isTOTPEnabled(userId) {
    const result = await this.db.query(`
      SELECT 1 FROM credentials c
      JOIN identities i ON c.identity_id = i.id
      WHERE i.user_id = $1 AND i.type = 'password' AND c.cred_type = 'totp_secret'
    `, [userId]);

    return result.rows.length > 0;
  }

  // ==============================================
  // WEBAUTHN (Passkeys) METHODS
  // ==============================================

  async generateWebAuthnChallenge(userId, operation = 'registration') {
    const challenge = crypto.randomBytes(32).toString('base64url');
    
    // Store challenge temporarily (expires in 5 minutes)
    await this.db.query(`
      INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')
    `, [userId, crypto.createHash('sha256').update(challenge).digest('hex'), `webauthn_${operation}`]);

    return challenge;
  }

  async verifyWebAuthnChallenge(userId, challenge, operation = 'registration') {
    const challengeHash = crypto.createHash('sha256').update(challenge).digest('hex');
    
    const result = await this.db.query(`
      SELECT id FROM verification_tokens
      WHERE user_id = $1 AND token_hash = $2 AND purpose = $3 
        AND expires_at > NOW() AND used_at IS NULL
    `, [userId, challengeHash, `webauthn_${operation}`]);

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired WebAuthn challenge');
    }

    // Mark challenge as used
    await this.db.query(`
      UPDATE verification_tokens SET used_at = NOW() WHERE id = $1
    `, [result.rows[0].id]);

    return true;
  }

  async registerWebAuthnCredential(userId, credentialData) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Create or get WebAuthn identity
      let identityResult = await client.query(`
        SELECT id FROM identities 
        WHERE user_id = $1 AND type = 'webauthn'
      `, [userId]);

      let identityId;
      if (identityResult.rows.length === 0) {
        const newIdentityResult = await client.query(`
          INSERT INTO identities (user_id, type)
          VALUES ($1, 'webauthn')
          RETURNING id
        `, [userId]);
        identityId = newIdentityResult.rows[0].id;
      } else {
        identityId = identityResult.rows[0].id;
      }

      // Store WebAuthn credential
      await client.query(`
        INSERT INTO credentials (identity_id, cred_type, public_key, meta)
        VALUES ($1, 'webauthn_public_key', $2, $3)
      `, [identityId, credentialData.publicKey, JSON.stringify({
        credentialId: credentialData.credentialId,
        counter: credentialData.counter || 0,
        registered_at: new Date().toISOString(),
        device_info: credentialData.deviceInfo || {}
      })]);

      await client.query('COMMIT');

      // Log WebAuthn registration
      await this.logMFAEvent(userId, 'webauthn_register', true, { 
        method: 'webauthn',
        credential_id: credentialData.credentialId 
      });

      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async authenticateWebAuthn(userId, credentialData) {
    const client = await this.db.connect();
    try {
      // Find the credential
      const result = await client.query(`
        SELECT c.public_key, c.meta
        FROM credentials c
        JOIN identities i ON c.identity_id = i.id
        WHERE i.user_id = $1 AND i.type = 'webauthn' 
          AND c.cred_type = 'webauthn_public_key'
          AND c.meta->>'credentialId' = $2
      `, [userId, credentialData.credentialId]);

      if (result.rows.length === 0) {
        await this.logMFAEvent(userId, 'webauthn_authenticate', false, { 
          method: 'webauthn',
          reason: 'credential_not_found' 
        });
        return false;
      }

      const credential = result.rows[0];
      const meta = credential.meta;

      // Verify the signature (simplified - in production, use proper WebAuthn library)
      // This is a placeholder - you'd use a proper WebAuthn verification library
      const isValid = await this.verifyWebAuthnSignature(credentialData, credential.public_key);

      if (isValid) {
        // Update counter
        await client.query(`
          UPDATE credentials 
          SET meta = jsonb_set(meta, '{counter}', $1)
          WHERE identity_id IN (
            SELECT i.id FROM identities i 
            WHERE i.user_id = $2 AND i.type = 'webauthn'
          ) AND meta->>'credentialId' = $3
        `, [credentialData.counter || (parseInt(meta.counter) + 1), userId, credentialData.credentialId]);

        // Log successful authentication
        await this.logMFAEvent(userId, 'webauthn_authenticate', true, { 
          method: 'webauthn',
          credential_id: credentialData.credentialId 
        });

        return true;
      } else {
        // Log failed authentication
        await this.logMFAEvent(userId, 'webauthn_authenticate', false, { 
          method: 'webauthn',
          reason: 'invalid_signature' 
        });
        return false;
      }

    } finally {
      client.release();
    }
  }

  async getWebAuthnCredentials(userId) {
    const result = await this.db.query(`
      SELECT c.meta
      FROM credentials c
      JOIN identities i ON c.identity_id = i.id
      WHERE i.user_id = $1 AND i.type = 'webauthn' AND c.cred_type = 'webauthn_public_key'
    `, [userId]);

    return result.rows.map(row => ({
      credentialId: row.meta.credentialId,
      registeredAt: row.meta.registered_at,
      deviceInfo: row.meta.device_info
    }));
  }

  async removeWebAuthnCredential(userId, credentialId) {
    const result = await this.db.query(`
      DELETE FROM credentials 
      WHERE identity_id IN (
        SELECT i.id FROM identities i 
        WHERE i.user_id = $1 AND i.type = 'webauthn'
      ) AND cred_type = 'webauthn_public_key' 
      AND meta->>'credentialId' = $2
      RETURNING id
    `, [userId, credentialId]);

    if (result.rows.length > 0) {
      await this.logMFAEvent(userId, 'webauthn_remove', true, { 
        method: 'webauthn',
        credential_id: credentialId 
      });
    }

    return result.rows.length > 0;
  }

  // ==============================================
  // MFA POLICY AND ENFORCEMENT
  // ==============================================

  async getMFAStatus(userId) {
    const [totpEnabled, webauthnCredentials] = await Promise.all([
      this.isTOTPEnabled(userId),
      this.getWebAuthnCredentials(userId)
    ]);

    return {
      totpEnabled,
      webauthnEnabled: webauthnCredentials.length > 0,
      webauthnCredentials,
      mfaRequired: totpEnabled || webauthnCredentials.length > 0
    };
  }

  async requireMFA(userId, operation = 'login') {
    // Check if user has any MFA methods enabled
    const mfaStatus = await this.getMFAStatus(userId);
    
    if (!mfaStatus.mfaRequired) {
      return false; // MFA not required
    }

    // Check if operation requires MFA
    const mfaRequiredOperations = ['login', 'sensitive_operation', 'admin_action'];
    return mfaRequiredOperations.includes(operation);
  }

  async verifyMFA(userId, mfaData) {
    const { method, token, credentialData } = mfaData;

    switch (method) {
      case 'totp':
        return await this.verifyTOTP(userId, token);
      case 'webauthn':
        return await this.authenticateWebAuthn(userId, credentialData);
      default:
        throw new Error(`Unsupported MFA method: ${method}`);
    }
  }

  // ==============================================
  // RECOVERY CODES
  // ==============================================

  async generateRecoveryCodes(userId) {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    const hashedCodes = codes.map(code => crypto.createHash('sha256').update(code).digest('hex'));

    await this.db.query(`
      INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
      VALUES ${hashedCodes.map((_, index) => `($1, $${index + 2}, 'mfa_recovery', NOW() + INTERVAL '1 year')`).join(', ')}
    `, [userId, ...hashedCodes]);

    return codes;
  }

  async verifyRecoveryCode(userId, code) {
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    const result = await this.db.query(`
      SELECT id FROM verification_tokens
      WHERE user_id = $1 AND token_hash = $2 AND purpose = 'mfa_recovery'
        AND expires_at > NOW() AND used_at IS NULL
    `, [userId, codeHash]);

    if (result.rows.length > 0) {
      // Mark code as used
      await this.db.query(`
        UPDATE verification_tokens SET used_at = NOW() WHERE id = $1
      `, [result.rows[0].id]);

      // Log recovery code use
      await this.logMFAEvent(userId, 'recovery_code_used', true, { method: 'recovery_code' });
      return true;
    }

    return false;
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  async verifyWebAuthnSignature(credentialData, publicKey) {
    // This is a simplified placeholder
    // In production, you would use a proper WebAuthn library like @simplewebauthn/server
    // For now, we'll just return true for demonstration
    return true;
  }

  async logMFAEvent(userId, event, success, details = {}) {
    try {
      await this.db.query(`
        INSERT INTO auth_events (user_id, event, success, details)
        VALUES ($1, $2, $3, $4)
      `, [userId, event, success, JSON.stringify(details)]);
    } catch (error) {
      console.error('Failed to log MFA event:', error);
    }
  }

  async cleanupExpiredChallenges() {
    const result = await this.db.query(`
      DELETE FROM verification_tokens 
      WHERE expires_at < NOW() AND used_at IS NULL
      RETURNING COUNT(*) as deleted_count
    `);
    
    return result.rows[0]?.deleted_count || 0;
  }
}

module.exports = MFAService;
