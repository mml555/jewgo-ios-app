const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class AuthMiddleware {
  constructor(
    authService,
    rbacService,
    mfaService,
    keyRotationService,
    guestService = null,
  ) {
    this.authService = authService;
    this.rbacService = rbacService;
    this.mfaService = mfaService;
    this.keyRotationService = keyRotationService;
    this.guestService = guestService;
    this.jwtSecret = process.env.JWT_SECRET; // Fallback for backward compatibility

    if (!this.keyRotationService && !this.jwtSecret) {
      throw new Error('JWT secret or key rotation service must be configured');
    }
  }

  // ==============================================
  // TOKEN VERIFICATION
  // ==============================================

  async verifyToken(token) {
    try {
      let decoded;

      if (this.keyRotationService) {
        // Use key rotation service for token verification
        decoded = await this.keyRotationService.verifyToken(token, {
          issuer: process.env.JWT_ISSUER || 'jewgo-auth',
          audience: process.env.JWT_AUDIENCE || 'jewgo-api',
        });
      } else {
        // Fallback to static JWT secret
        decoded = jwt.verify(token, this.jwtSecret, {
          issuer: process.env.JWT_ISSUER || 'jewgo-auth',
          audience: process.env.JWT_AUDIENCE || 'jewgo-api',
        });
      }

      // Check if session is still valid
      const sessionValid = await this.checkSessionValidity(decoded.sid);
      if (!sessionValid) {
        throw new Error('Session has been revoked');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw error;
      }
    }
  }

  async checkSessionValidity(sessionId) {
    const result = await this.authService.db.query(
      `
      SELECT id FROM sessions 
      WHERE id = $1 
        AND revoked_at IS NULL 
        AND expires_at > NOW()
    `,
      [sessionId],
    );

    return result.rows.length > 0;
  }

  // ==============================================
  // MIDDLEWARE FUNCTIONS
  // ==============================================

  authenticate() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'MISSING_TOKEN',
          });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = await this.verifyToken(token);

        // Get user information
        const user = await this.authService.getUserById(decoded.sub);
        if (!user || user.status !== 'active') {
          return res.status(401).json({
            error: 'Invalid user',
            code: 'INVALID_USER',
          });
        }

        // Attach user and session info to request
        req.user = {
          id: user.id,
          email: user.primary_email,
          status: user.status,
        };
        req.session = {
          id: decoded.sid,
        };

        next();
      } catch (error) {
        logger.error('Authentication middleware error:', error);
        return res.status(401).json({
          error: error.message,
          code: 'AUTH_FAILED',
        });
      }
    };
  }

  requireRole(roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];

    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'MISSING_AUTH',
          });
        }

        const userRoles = await this.rbacService.getUserRoles(req.user.id);
        const userRoleNames = userRoles.map(r => r.name);

        const hasRequiredRole = roleArray.some(role =>
          userRoleNames.includes(role),
        );

        if (!hasRequiredRole) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_ROLE',
            required: roleArray,
            current: userRoleNames,
          });
        }

        req.userRoles = userRoles;
        next();
      } catch (error) {
        logger.error('Role middleware error:', error);
        return res.status(500).json({
          error: 'Role check failed',
          code: 'ROLE_CHECK_ERROR',
        });
      }
    };
  }

  requirePermission(permissions, resource = null) {
    const permissionArray = Array.isArray(permissions)
      ? permissions
      : [permissions];

    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'MISSING_AUTH',
          });
        }

        // Check each required permission
        for (const permission of permissionArray) {
          const hasPermission = await this.rbacService.userHasPermission(
            req.user.id,
            permission,
            resource,
          );

          if (!hasPermission) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSION',
              required: permission,
              resource: resource,
            });
          }
        }

        next();
      } catch (error) {
        logger.error('Permission middleware error:', error);
        return res.status(500).json({
          error: 'Permission check failed',
          code: 'PERMISSION_CHECK_ERROR',
        });
      }
    };
  }

  // ==============================================
  // RESOURCE-SPECIFIC PERMISSIONS
  // ==============================================

  requireEntityPermission(permission) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'MISSING_AUTH',
          });
        }

        const entityId = req.params.entityId || req.body.entityId;
        const hasPermission = await this.rbacService.checkEntityPermission(
          req.user.id,
          permission,
          entityId,
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions for entity',
            code: 'ENTITY_PERMISSION_DENIED',
            entityId: entityId,
            permission: permission,
          });
        }

        next();
      } catch (error) {
        logger.error('Entity permission middleware error:', error);
        return res.status(500).json({
          error: 'Entity permission check failed',
          code: 'ENTITY_PERMISSION_CHECK_ERROR',
        });
      }
    };
  }

  requireReviewPermission(permission) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'MISSING_AUTH',
          });
        }

        const reviewId = req.params.reviewId || req.body.reviewId;
        const hasPermission = await this.rbacService.checkReviewPermission(
          req.user.id,
          permission,
          reviewId,
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions for review',
            code: 'REVIEW_PERMISSION_DENIED',
            reviewId: reviewId,
            permission: permission,
          });
        }

        next();
      } catch (error) {
        logger.error('Review permission middleware error:', error);
        return res.status(500).json({
          error: 'Review permission check failed',
          code: 'REVIEW_PERMISSION_CHECK_ERROR',
        });
      }
    };
  }

  // ==============================================
  // GUEST AND MIXED AUTHENTICATION
  // ==============================================

  requireAuthOrGuest() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        const guestToken = req.headers['x-guest-token'];

        // Try regular authentication first
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.substring(7);
            const decoded = await this.verifyToken(token);

            const user = await this.authService.getUserById(decoded.sub);
            if (user && user.status === 'active') {
              req.user = {
                id: user.id,
                email: user.primary_email,
                status: user.status,
                type: 'user',
              };
              req.session = {
                id: decoded.sid,
              };
              return next();
            }
          } catch (error) {
            // Continue to guest authentication
            logger.warn('User auth failed, trying guest auth:', error.message);
          }
        }

        // Try guest authentication
        if (this.guestService && guestToken) {
          try {
            const guestSession = await this.guestService.validateGuestSession(
              guestToken,
            );
            if (guestSession && guestSession.isValid) {
              req.user = {
                id: guestSession.guestUser.id,
                type: 'guest',
                sessionId: guestSession.sessionId,
              };
              req.session = {
                id: guestSession.sessionId,
                type: 'guest',
              };
              return next();
            }
          } catch (error) {
            logger.warn('Guest auth failed:', error.message);
          }
        }

        // Neither authentication method worked
        return res.status(401).json({
          error:
            'Authentication required - please login or create a guest session',
          code: 'AUTH_REQUIRED',
          options: {
            login: '/api/v5/auth/login',
            guest: '/api/v5/auth/guest/create',
          },
        });
      } catch (error) {
        logger.error('Authentication middleware error:', error);
        return res.status(401).json({
          error: 'Authentication failed',
          code: 'AUTH_FAILED',
        });
      }
    };
  }

  requireGuestPermission(permissions, resource = null) {
    const permissionArray = Array.isArray(permissions)
      ? permissions
      : [permissions];

    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'MISSING_AUTH',
          });
        }

        // For regular users, use existing RBAC
        if (req.user.type === 'user') {
          for (const permission of permissionArray) {
            const hasPermission = await this.rbacService.userHasPermission(
              req.user.id,
              permission,
              resource,
            );

            if (!hasPermission) {
              return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSION',
                required: permission,
                resource: resource,
              });
            }
          }
        }
        // For guest users, check guest permissions
        else if (req.user.type === 'guest' && this.guestService) {
          for (const permission of permissionArray) {
            const hasPermission = await this.guestService.hasGuestPermission(
              permission,
              resource,
            );

            if (!hasPermission) {
              return res.status(403).json({
                error: 'Insufficient permissions for guest user',
                code: 'INSUFFICIENT_GUEST_PERMISSION',
                required: permission,
                resource: resource,
                upgrade: 'Consider creating an account for full access',
              });
            }
          }
        } else {
          return res.status(403).json({
            error: 'Invalid user type',
            code: 'INVALID_USER_TYPE',
          });
        }

        next();
      } catch (error) {
        logger.error('Permission middleware error:', error);
        return res.status(500).json({
          error: 'Permission check failed',
          code: 'PERMISSION_CHECK_ERROR',
        });
      }
    };
  }

  // ==============================================
  // OPTIONAL AUTHENTICATION
  // ==============================================

  optionalAuth() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          // No token provided, continue without authentication
          return next();
        }

        const token = authHeader.substring(7);
        const decoded = await this.verifyToken(token);

        const user = await this.authService.getUserById(decoded.sub);
        if (user && user.status === 'active') {
          req.user = {
            id: user.id,
            email: user.primary_email,
            status: user.status,
          };
          req.session = {
            id: decoded.sid,
          };
        }

        next();
      } catch (error) {
        // Authentication failed, but continue without user
        logger.warn('Optional auth failed:', error.message);
        next();
      }
    };
  }

  // ==============================================
  // RATE LIMITING HELPERS
  // ==============================================

  extractClientIdentifier(req) {
    // Try to get user ID first, then fall back to IP
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }

    // Get IP address (considering proxies)
    const ip =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim();

    return `ip:${ip}`;
  }

  // ==============================================
  // MFA MIDDLEWARE
  // ==============================================

  requireMFA(operation = 'login') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'MISSING_AUTH',
          });
        }

        const mfaRequired = await this.mfaService.requireMFA(
          req.user.id,
          operation,
        );

        if (!mfaRequired) {
          return next();
        }

        // Check if MFA has been completed in this session
        if (req.session && req.session.mfaVerified) {
          return next();
        }

        return res.status(403).json({
          error: 'Multi-factor authentication required',
          code: 'MFA_REQUIRED',
          operation: operation,
        });
      } catch (error) {
        logger.error('MFA middleware error:', error);
        return res.status(500).json({
          error: 'MFA check failed',
          code: 'MFA_CHECK_ERROR',
        });
      }
    };
  }

  verifyMFA() {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            code: 'MISSING_AUTH',
          });
        }

        const { mfaData } = req.body;

        if (!mfaData) {
          return res.status(400).json({
            error: 'MFA data is required',
            code: 'MISSING_MFA_DATA',
          });
        }

        const isValid = await this.mfaService.verifyMFA(req.user.id, mfaData);

        if (isValid) {
          // Mark MFA as verified in session
          if (req.session) {
            req.session.mfaVerified = true;
          }
          next();
        } else {
          return res.status(400).json({
            error: 'MFA verification failed',
            code: 'MFA_VERIFICATION_FAILED',
          });
        }
      } catch (error) {
        logger.error('MFA verification middleware error:', error);
        return res.status(500).json({
          error: 'MFA verification failed',
          code: 'MFA_VERIFICATION_ERROR',
        });
      }
    };
  }

  // ==============================================
  // AUDIT LOGGING
  // ==============================================

  logAccess(req, action, success, details = {}) {
    const logData = {
      user_id: req.user?.id || null,
      session_id: req.session?.id || null,
      action: action,
      success: success,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
      ...details,
    };

    // This would integrate with your logging system
    logger.info('Access log:', logData);
  }
}

module.exports = AuthMiddleware;
