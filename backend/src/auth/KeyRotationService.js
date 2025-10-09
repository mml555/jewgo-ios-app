/* global Buffer */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class KeyRotationService {
  constructor(dbPool) {
    this.db = dbPool;
    this.keys = new Map();
    this.currentKeyId = null;
    this.rotationInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.keyLifetime = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.rotationTimer = null; // Track timer for cleanup

    this.initializeKeys();
    this.startRotationTimer();
  }

  // ==============================================
  // KEY INITIALIZATION
  // ==============================================

  async initializeKeys() {
    try {
      // Load existing keys from database
      const result = await this.db.query(`
        SELECT key_id, key_data, created_at, expires_at, is_active
        FROM jwt_keys
        WHERE expires_at > NOW()
        ORDER BY created_at DESC
      `);

      if (result.rows.length === 0) {
        // No valid keys found, generate initial key
        await this.generateNewKey();
      } else {
        // Load existing keys
        for (const row of result.rows) {
          this.keys.set(row.key_id, {
            id: row.key_id,
            secret: row.key_data,
            createdAt: new Date(row.created_at),
            expiresAt: new Date(row.expires_at),
            isActive: row.is_active,
          });

          if (row.is_active) {
            this.currentKeyId = row.key_id;
          }
        }
      }
    } catch (error) {
      logger.error('Failed to initialize JWT keys:', error);
      // Fallback to environment variable
      await this.initializeFallbackKey();
    }
  }

  async initializeFallbackKey() {
    const fallbackSecret = process.env.JWT_SECRET;
    if (!fallbackSecret) {
      throw new Error('No JWT secret available');
    }

    const keyId = 'fallback';
    this.keys.set(keyId, {
      id: keyId,
      secret: fallbackSecret,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.keyLifetime),
      isActive: true,
    });
    this.currentKeyId = keyId;
  }

  // ==============================================
  // KEY GENERATION
  // ==============================================

  async generateNewKey() {
    const keyId = this.generateKeyId();
    const secret = this.generateSecret();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.keyLifetime);

    try {
      // Store key in database
      await this.db.query(
        `
        INSERT INTO jwt_keys (key_id, key_data, created_at, expires_at, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [keyId, secret, now, expiresAt, true],
      );

      // Deactivate old keys
      if (this.currentKeyId) {
        await this.db.query(
          `
          UPDATE jwt_keys 
          SET is_active = false 
          WHERE key_id = $1
        `,
          [this.currentKeyId],
        );
      }

      // Update in-memory keys
      this.keys.set(keyId, {
        id: keyId,
        secret: secret,
        createdAt: now,
        expiresAt: expiresAt,
        isActive: true,
      });

      this.currentKeyId = keyId;

      logger.info(`Generated new JWT key: ${keyId}`);
      return keyId;
    } catch (error) {
      logger.error('Failed to generate new JWT key:', error);
      throw error;
    }
  }

  generateKeyId() {
    return crypto.randomBytes(8).toString('hex');
  }

  generateSecret() {
    return crypto.randomBytes(64).toString('base64url');
  }

  // ==============================================
  // KEY ROTATION
  // ==============================================

  startRotationTimer() {
    // Clear any existing timer
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }

    // Check for rotation every hour
    this.rotationTimer = setInterval(async () => {
      try {
        await this.checkAndRotateKeys();
      } catch (error) {
        logger.error('Key rotation check failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  // Stop rotation timer (for graceful shutdown)
  stopRotationTimer() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      logger.info('Key rotation timer stopped');
    }
  }

  // Cleanup method for graceful shutdown
  async shutdown() {
    this.stopRotationTimer();
    logger.info('KeyRotationService shut down gracefully');
  }

  async checkAndRotateKeys() {
    const now = new Date();
    const currentKey = this.keys.get(this.currentKeyId);

    if (!currentKey) {
      logger.info('No current key found, generating new one');
      await this.generateNewKey();
      return;
    }

    // Check if current key needs rotation
    const timeUntilExpiry = currentKey.expiresAt.getTime() - now.getTime();
    const rotationThreshold = this.rotationInterval;

    if (timeUntilExpiry <= rotationThreshold) {
      logger.info('Current key approaching expiry, generating new key');
      await this.generateNewKey();
    }

    // Clean up expired keys
    await this.cleanupExpiredKeys();
  }

  async cleanupExpiredKeys() {
    try {
      const result = await this.db.query(`
        DELETE FROM jwt_keys 
        WHERE expires_at < NOW() - INTERVAL '1 day'
        RETURNING key_id
      `);

      if (result.rows.length > 0) {
        logger.info(`Cleaned up ${result.rows.length} expired JWT keys`);

        // Remove from in-memory cache
        for (const row of result.rows) {
          this.keys.delete(row.key_id);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup expired keys:', error);
    }
  }

  // ==============================================
  // TOKEN OPERATIONS
  // ==============================================

  signToken(payload, options = {}) {
    const key = this.keys.get(this.currentKeyId);
    if (!key) {
      throw new Error('No active JWT key available');
    }

    const signOptions = {
      algorithm: 'HS256',
      keyid: this.currentKeyId,
      expiresIn: options.expiresIn || '1h',
      issuer: options.issuer || process.env.JWT_ISSUER,
      audience: options.audience || process.env.JWT_AUDIENCE,
      ...options,
    };

    return jwt.sign(payload, key.secret, signOptions);
  }

  verifyToken(token, options = {}) {
    const verifyOptions = {
      algorithms: ['HS256'],
      issuer: options.issuer || process.env.JWT_ISSUER,
      audience: options.audience || process.env.JWT_AUDIENCE,
      ...options,
    };

    // Try to decode the token to get the key ID
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      throw new Error('Token missing key ID');
    }

    const keyId = decoded.header.kid;
    const key = this.keys.get(keyId);

    if (!key) {
      throw new Error(`JWT key not found: ${keyId}`);
    }

    if (key.expiresAt < new Date()) {
      throw new Error(`JWT key has expired: ${keyId}`);
    }

    return jwt.verify(token, key.secret, verifyOptions);
  }

  // ==============================================
  // JWKS ENDPOINT
  // ==============================================

  getJWKS() {
    const keys = [];

    for (const [keyId, key] of this.keys) {
      if (key.expiresAt > new Date()) {
        keys.push({
          kty: 'oct',
          kid: keyId,
          use: 'sig',
          alg: 'HS256',
          k: Buffer.from(key.secret).toString('base64url'),
          created_at: Math.floor(key.createdAt.getTime() / 1000),
          expires_at: Math.floor(key.expiresAt.getTime() / 1000),
        });
      }
    }

    return {
      keys: keys,
    };
  }

  // ==============================================
  // KEY MANAGEMENT
  // ==============================================

  async getKeyInfo(keyId) {
    const key = this.keys.get(keyId);
    if (!key) {
      return null;
    }

    return {
      id: key.id,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      isActive: key.isActive,
      isExpired: key.expiresAt < new Date(),
    };
  }

  async getAllKeys() {
    const keyInfos = [];

    for (const [, key] of this.keys) {
      keyInfos.push({
        id: key.id,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        isActive: key.isActive,
        isExpired: key.expiresAt < new Date(),
      });
    }

    return keyInfos.sort((a, b) => b.createdAt - a.createdAt);
  }

  async forceRotation() {
    logger.info('Forcing JWT key rotation');
    return await this.generateNewKey();
  }

  // ==============================================
  // HEALTH CHECK
  // ==============================================

  getHealthStatus() {
    const currentKey = this.keys.get(this.currentKeyId);
    const now = new Date();

    if (!currentKey) {
      return {
        status: 'unhealthy',
        error: 'No active JWT key available',
      };
    }

    const timeUntilExpiry = currentKey.expiresAt.getTime() - now.getTime();
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

    let status = 'healthy';
    if (hoursUntilExpiry < 1) {
      status = 'critical';
    } else if (hoursUntilExpiry < 24) {
      status = 'warning';
    }

    return {
      status: status,
      currentKeyId: this.currentKeyId,
      hoursUntilExpiry: Math.round(hoursUntilExpiry * 100) / 100,
      totalKeys: this.keys.size,
      nextRotation: new Date(now.getTime() + this.rotationInterval),
    };
  }

  // ==============================================
  // MIGRATION SUPPORT
  // ==============================================

  async migrateFromEnvironmentSecret() {
    const envSecret = process.env.JWT_SECRET;
    if (!envSecret) {
      return false;
    }

    // Check if we already have keys in the database
    const result = await this.db.query(`
      SELECT COUNT(*) as count FROM jwt_keys
    `);

    if (parseInt(result.rows[0].count, 10) > 0) {
      return false; // Already migrated
    }

    // Create initial key from environment secret
    const keyId = 'migrated';
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.keyLifetime);

    await this.db.query(
      `
      INSERT INTO jwt_keys (key_id, key_data, created_at, expires_at, is_active)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [keyId, envSecret, now, expiresAt, true],
    );

    this.keys.set(keyId, {
      id: keyId,
      secret: envSecret,
      createdAt: now,
      expiresAt: expiresAt,
      isActive: true,
    });

    this.currentKeyId = keyId;

    logger.info('Migrated JWT secret from environment to key rotation system');
    return true;
  }
}

module.exports = KeyRotationService;
