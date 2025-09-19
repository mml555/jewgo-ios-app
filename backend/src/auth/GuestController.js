class GuestController {
  constructor(guestService, authService) {
    this.guestService = guestService;
    this.authService = authService;
  }

  // ==============================================
  // GUEST SESSION MANAGEMENT
  // ==============================================

  async createGuestSession(req, res) {
    try {
      const { deviceInfo } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const guestSession = await this.guestService.createGuestSession(
        deviceInfo || {},
        ipAddress,
        userAgent
      );

      res.status(201).json({
        success: true,
        message: 'Guest session created successfully',
        data: {
          sessionToken: guestSession.sessionToken,
          expiresAt: guestSession.expiresAt,
          guestUser: guestSession.guestUser,
          permissions: await this.guestService.getGuestPermissions()
        }
      });

    } catch (error) {
      console.error('Create guest session error:', error);
      res.status(500).json({
        error: 'Failed to create guest session',
        code: 'GUEST_SESSION_CREATE_ERROR'
      });
    }
  }

  async validateGuestSession(req, res) {
    try {
      const guestToken = req.headers['x-guest-token'] || req.body.sessionToken;

      if (!guestToken) {
        return res.status(400).json({
          error: 'Guest session token is required',
          code: 'MISSING_GUEST_TOKEN'
        });
      }

      const guestSession = await this.guestService.validateGuestSession(guestToken);

      if (!guestSession || !guestSession.isValid) {
        return res.status(401).json({
          error: 'Invalid or expired guest session',
          code: 'INVALID_GUEST_SESSION'
        });
      }

      res.json({
        success: true,
        data: {
          sessionId: guestSession.sessionId,
          expiresAt: guestSession.expiresAt,
          guestUser: guestSession.guestUser,
          permissions: await this.guestService.getGuestPermissions()
        }
      });

    } catch (error) {
      console.error('Validate guest session error:', error);
      res.status(500).json({
        error: 'Failed to validate guest session',
        code: 'GUEST_SESSION_VALIDATE_ERROR'
      });
    }
  }

  async extendGuestSession(req, res) {
    try {
      const guestToken = req.headers['x-guest-token'];
      const { additionalHours = 24 } = req.body;

      if (!guestToken) {
        return res.status(400).json({
          error: 'Guest session token is required',
          code: 'MISSING_GUEST_TOKEN'
        });
      }

      const success = await this.guestService.extendGuestSession(guestToken, additionalHours);

      if (!success) {
        return res.status(404).json({
          error: 'Guest session not found or expired',
          code: 'GUEST_SESSION_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: `Guest session extended by ${additionalHours} hours`
      });

    } catch (error) {
      console.error('Extend guest session error:', error);
      res.status(500).json({
        error: 'Failed to extend guest session',
        code: 'GUEST_SESSION_EXTEND_ERROR'
      });
    }
  }

  async revokeGuestSession(req, res) {
    try {
      const guestToken = req.headers['x-guest-token'];

      if (!guestToken) {
        return res.status(400).json({
          error: 'Guest session token is required',
          code: 'MISSING_GUEST_TOKEN'
        });
      }

      const success = await this.guestService.revokeGuestSession(guestToken);

      if (!success) {
        return res.status(404).json({
          error: 'Guest session not found',
          code: 'GUEST_SESSION_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Guest session revoked successfully'
      });

    } catch (error) {
      console.error('Revoke guest session error:', error);
      res.status(500).json({
        error: 'Failed to revoke guest session',
        code: 'GUEST_SESSION_REVOKE_ERROR'
      });
    }
  }

  // ==============================================
  // GUEST PERMISSIONS
  // ==============================================

  async getGuestPermissions(req, res) {
    try {
      const permissions = await this.guestService.getGuestPermissions();

      res.json({
        success: true,
        data: {
          permissions,
          role: 'guest',
          description: 'Limited access permissions for guest users'
        }
      });

    } catch (error) {
      console.error('Get guest permissions error:', error);
      res.status(500).json({
        error: 'Failed to get guest permissions',
        code: 'GUEST_PERMISSIONS_ERROR'
      });
    }
  }

  // ==============================================
  // GUEST TO USER CONVERSION
  // ==============================================

  async convertToUser(req, res) {
    try {
      const guestToken = req.headers['x-guest-token'];
      const { email, password, firstName, lastName } = req.body;

      if (!guestToken) {
        return res.status(400).json({
          error: 'Guest session token is required',
          code: 'MISSING_GUEST_TOKEN'
        });
      }

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Check if user already exists
      const existingUser = await this.authService.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists with this email',
          code: 'USER_EXISTS'
        });
      }

      // Create user account
      const userData = {
        email,
        firstName,
        lastName,
        password
      };

      const result = await this.authService.createUser(userData);

      // Convert guest session
      await this.guestService.convertGuestToUser(guestToken, userData);

      res.status(201).json({
        success: true,
        message: 'Guest account converted to user account successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          status: result.user.status
        }
      });

    } catch (error) {
      console.error('Convert guest to user error:', error);
      res.status(500).json({
        error: 'Failed to convert guest to user',
        code: 'GUEST_CONVERT_ERROR'
      });
    }
  }

  // ==============================================
  // GUEST SESSION STATS (ADMIN)
  // ==============================================

  async getGuestStats(req, res) {
    try {
      const stats = await this.guestService.getGuestSessionStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get guest stats error:', error);
      res.status(500).json({
        error: 'Failed to get guest statistics',
        code: 'GUEST_STATS_ERROR'
      });
    }
  }

  async cleanupExpiredSessions(req, res) {
    try {
      const deletedCount = await this.guestService.cleanupExpiredSessions();

      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} expired guest sessions`,
        deletedCount
      });

    } catch (error) {
      console.error('Cleanup guest sessions error:', error);
      res.status(500).json({
        error: 'Failed to cleanup expired sessions',
        code: 'GUEST_CLEANUP_ERROR'
      });
    }
  }

  // ==============================================
  // GUEST USER INFO
  // ==============================================

  async getGuestInfo(req, res) {
    try {
      if (!req.user || req.user.type !== 'guest') {
        return res.status(400).json({
          error: 'Only guest users can access this endpoint',
          code: 'NOT_GUEST_USER'
        });
      }

      const permissions = await this.guestService.getGuestPermissions();

      res.json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            type: req.user.type,
            sessionId: req.user.sessionId
          },
          permissions,
          limitations: {
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            readOnly: true
          },
          upgradeOptions: {
            createAccount: '/api/v5/auth/guest/convert',
            benefits: [
              'Create and manage business listings',
              'Write and edit reviews',
              'Save favorites',
              'Personalized recommendations'
            ]
          }
        }
      });

    } catch (error) {
      console.error('Get guest info error:', error);
      res.status(500).json({
        error: 'Failed to get guest information',
        code: 'GUEST_INFO_ERROR'
      });
    }
  }
}

module.exports = GuestController;
