const express = require('express');
const rateLimit = require('express-rate-limit');

function createGuestRoutes(guestController, authMiddleware) {
  const router = express.Router();

  // ==============================================
  // RATE LIMITING
  // ==============================================

  const guestCreateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 guest sessions per hour per IP
    message: {
      error: 'Too many guest sessions created',
      code: 'GUEST_CREATE_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  const guestGeneralLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window
    message: {
      error: 'Too many guest requests',
      code: 'GUEST_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // ==============================================
  // GUEST SESSION ROUTES
  // ==============================================

  // Create guest session
  router.post('/create',
    guestCreateLimiter,
    guestController.createGuestSession.bind(guestController)
  );

  // Validate guest session
  router.post('/validate',
    guestGeneralLimiter,
    guestController.validateGuestSession.bind(guestController)
  );

  // Extend guest session
  router.post('/extend',
    guestGeneralLimiter,
    guestController.extendGuestSession.bind(guestController)
  );

  // Revoke guest session
  router.delete('/revoke',
    guestGeneralLimiter,
    guestController.revokeGuestSession.bind(guestController)
  );

  // ==============================================
  // GUEST PERMISSIONS
  // ==============================================

  // Get guest permissions
  router.get('/permissions',
    guestController.getGuestPermissions.bind(guestController)
  );

  // ==============================================
  // GUEST USER INFO
  // ==============================================

  // Get guest user info (requires guest authentication)
  router.get('/me',
    authMiddleware.requireAuthOrGuest(),
    guestController.getGuestInfo.bind(guestController)
  );

  // ==============================================
  // GUEST TO USER CONVERSION
  // ==============================================

  // Convert guest to user
  router.post('/convert',
    guestGeneralLimiter,
    guestController.convertToUser.bind(guestController)
  );

  // ==============================================
  // ADMIN ROUTES
  // ==============================================

  // Get guest statistics (admin only)
  router.get('/stats',
    authMiddleware.authenticate(),
    authMiddleware.requireRole('admin'),
    guestController.getGuestStats.bind(guestController)
  );

  // Cleanup expired sessions (admin only)
  router.post('/cleanup',
    authMiddleware.authenticate(),
    authMiddleware.requireRole('admin'),
    guestController.cleanupExpiredSessions.bind(guestController)
  );

  // ==============================================
  // ERROR HANDLING
  // ==============================================

  // 404 handler for guest routes
  router.use('*', (req, res) => {
    res.status(404).json({
      error: 'Guest endpoint not found',
      code: 'GUEST_ENDPOINT_NOT_FOUND',
      path: req.originalUrl
    });
  });

  // Error handler
  router.use((error, req, res, next) => {
    console.error('Guest route error:', error);
    
    // Handle specific error types
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      });
    }

    if (error.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'Request body too large',
        code: 'REQUEST_TOO_LARGE'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  });

  return router;
}

module.exports = createGuestRoutes;
