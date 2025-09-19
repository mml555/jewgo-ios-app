const crypto = require('crypto');

class GuestService {
  constructor(dbPool) {
    this.db = dbPool;
    this.defaultSessionDuration = 24; // hours
  }

  // ==============================================
  // GUEST SESSION MANAGEMENT
  // ==============================================

  async createGuestSession(deviceInfo = {}, ipAddress = null, userAgent = null) {
    try {
      const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
      
      const result = await this.db.query(`
        SELECT session_id, session_token, expires_at 
        FROM create_guest_session($1, $2, $3, $4)
      `, [deviceFingerprint, ipAddress, userAgent, this.defaultSessionDuration]);

      if (result.rows.length === 0) {
        throw new Error('Failed to create guest session');
      }

      const session = result.rows[0];
      
      // Log guest session creation
      await this.logGuestEvent(session.session_id, 'guest_session_created', true, {
        device_fingerprint: deviceFingerprint,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      return {
        sessionId: session.session_id,
        sessionToken: session.session_token,
        expiresAt: session.expires_at,
        guestUser: {
          id: `guest_${session.session_id}`,
          type: 'guest',
          sessionId: session.session_id
        }
      };

    } catch (error) {
      console.error('Error creating guest session:', error);
      throw error;
    }
  }

  async validateGuestSession(sessionToken) {
    try {
      const result = await this.db.query(`
        SELECT session_id, device_fingerprint, is_valid, expires_at
        FROM validate_guest_session($1)
      `, [sessionToken]);

      if (result.rows.length === 0) {
        return null;
      }

      const session = result.rows[0];
      
      if (!session.is_valid) {
        return null;
      }

      return {
        sessionId: session.session_id,
        deviceFingerprint: session.device_fingerprint,
        expiresAt: session.expires_at,
        isValid: session.is_valid,
        guestUser: {
          id: `guest_${session.session_id}`,
          type: 'guest',
          sessionId: session.session_id
        }
      };

    } catch (error) {
      console.error('Error validating guest session:', error);
      return null;
    }
  }

  async extendGuestSession(sessionToken, additionalHours = 24) {
    try {
      const result = await this.db.query(`
        UPDATE guest_sessions 
        SET expires_at = expires_at + INTERVAL '${additionalHours} hours',
            last_used_at = NOW()
        WHERE session_token = $1 AND expires_at > NOW()
        RETURNING id, expires_at
      `, [sessionToken]);

      if (result.rows.length === 0) {
        return false;
      }

      await this.logGuestEvent(result.rows[0].id, 'guest_session_extended', true, {
        additional_hours: additionalHours,
        new_expires_at: result.rows[0].expires_at
      });

      return true;
    } catch (error) {
      console.error('Error extending guest session:', error);
      return false;
    }
  }

  async revokeGuestSession(sessionToken) {
    try {
      const result = await this.db.query(`
        DELETE FROM guest_sessions 
        WHERE session_token = $1
        RETURNING id
      `, [sessionToken]);

      if (result.rows.length > 0) {
        await this.logGuestEvent(result.rows[0].id, 'guest_session_revoked', true, {
          revocation_reason: 'manual'
        });
      }

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error revoking guest session:', error);
      return false;
    }
  }

  // ==============================================
  // GUEST PERMISSIONS
  // ==============================================

  async getGuestPermissions() {
    try {
      const result = await this.db.query(`
        SELECT p.name, p.resource
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN roles r ON rp.role_id = r.id
        WHERE r.name = 'guest'
      `);

      return result.rows;
    } catch (error) {
      console.error('Error getting guest permissions:', error);
      return [];
    }
  }

  async hasGuestPermission(permission, resource = null) {
    try {
      let query, params;
      
      if (resource === null) {
        query = `
          SELECT 1 FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          JOIN roles r ON rp.role_id = r.id
          WHERE r.name = 'guest' AND p.name = $1
        `;
        params = [permission];
      } else {
        query = `
          SELECT 1 FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          JOIN roles r ON rp.role_id = r.id
          WHERE r.name = 'guest' AND p.name = $1 AND p.resource = $2
        `;
        params = [permission, resource];
      }

      const result = await this.db.query(query, params);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking guest permission:', error);
      return false;
    }
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  generateDeviceFingerprint(deviceInfo) {
    const fingerprint = [
      deviceInfo.platform || 'unknown',
      deviceInfo.model || 'unknown',
      deviceInfo.osVersion || 'unknown',
      deviceInfo.screenResolution || 'unknown',
      deviceInfo.timezone || 'unknown',
      deviceInfo.language || 'unknown'
    ].join('|');

    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  generateGuestToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async cleanupExpiredSessions() {
    try {
      const result = await this.db.query('SELECT deleted_count FROM cleanup_expired_guest_sessions()');
      const deletedCount = result.rows[0]?.deleted_count || 0;
      
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired guest sessions`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired guest sessions:', error);
      return 0;
    }
  }

  async getGuestSessionStats() {
    try {
      const result = await this.db.query(`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(*) FILTER (WHERE expires_at > NOW()) as active_sessions,
          COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_sessions,
          AVG(EXTRACT(EPOCH FROM (last_used_at - created_at))) as avg_session_duration_seconds
        FROM guest_sessions
      `);

      return result.rows[0] || {
        total_sessions: 0,
        active_sessions: 0,
        expired_sessions: 0,
        avg_session_duration_seconds: 0
      };
    } catch (error) {
      console.error('Error getting guest session stats:', error);
      return null;
    }
  }

  async logGuestEvent(sessionId, event, success, details = {}) {
    try {
      // Use NULL for user_id since guest sessions don't have user IDs
      await this.db.query(`
        INSERT INTO auth_events (user_id, event, success, details)
        VALUES ($1, $2, $3, $4)
      `, [null, event, success, JSON.stringify({
        ...details,
        guest_session_id: sessionId,
        user_type: 'guest'
      })]);
    } catch (error) {
      console.error('Failed to log guest event:', error);
    }
  }

  // ==============================================
  // GUEST USER CONVERSION
  // ==============================================

  async convertGuestToUser(sessionToken, userData) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Validate guest session
      const guestSession = await this.validateGuestSession(sessionToken);
      if (!guestSession) {
        throw new Error('Invalid guest session');
      }

      // Create user account (using existing AuthService logic)
      // This would integrate with the existing user creation flow
      // For now, we'll just revoke the guest session
      await this.revokeGuestSession(sessionToken);

      await client.query('COMMIT');

      await this.logGuestEvent(guestSession.sessionId, 'guest_converted_to_user', true, {
        new_user_email: userData.email
      });

      return {
        success: true,
        message: 'Guest session converted to user account'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error converting guest to user:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = GuestService;
