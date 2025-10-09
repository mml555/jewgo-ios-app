const express = require('express');
const rateLimit = require('express-rate-limit');

function createAuthRoutes(authController, authMiddleware) {
  const router = express.Router();

  // ==============================================
  // RATE LIMITING
  // ==============================================

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      error: 'Too many authentication attempts',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: req => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
  });

  const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 signups per hour per IP
    message: {
      error: 'Too many signup attempts',
      code: 'SIGNUP_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour per email
    keyGenerator: req => {
      // Rate limit by email if provided, otherwise by IP
      return req.body?.email || req.ip;
    },
    message: {
      error: 'Too many password reset attempts',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ==============================================
  // AUTHENTICATION ROUTES
  // ==============================================

  // Health check (no rate limiting)
  router.get('/health', authController.healthCheck.bind(authController));

  // Registration
  router.post(
    '/register',
    signupLimiter,
    authController.register.bind(authController),
  );

  // Login
  router.post('/login', authLimiter, authController.login.bind(authController));

  // Google OAuth authentication
  router.post(
    '/google',
    authLimiter,
    authController.googleOAuth.bind(authController),
  );

  // Magic link authentication
  router.post(
    '/magic-link/send',
    passwordResetLimiter,
    authController.sendMagicLink.bind(authController),
  );

  router.post(
    '/magic-link/verify',
    authLimiter,
    authController.verifyMagicLink.bind(authController),
  );

  // Token refresh
  router.post(
    '/refresh',
    authLimiter,
    authController.refreshToken.bind(authController),
  );

  // Logout (requires authentication)
  router.post(
    '/logout',
    authMiddleware.authenticate(),
    authController.logout.bind(authController),
  );

  // ==============================================
  // USER PROFILE ROUTES
  // ==============================================

  // Get user profile
  router.get(
    '/me',
    authMiddleware.authenticate(),
    authController.getProfile.bind(authController),
  );

  // ==============================================
  // SESSION MANAGEMENT ROUTES
  // ==============================================

  // Get active sessions
  router.get(
    '/sessions',
    authMiddleware.authenticate(),
    authController.getSessions.bind(authController),
  );

  // Revoke specific session
  router.delete(
    '/sessions/:sessionId',
    authMiddleware.authenticate(),
    authController.revokeSession.bind(authController),
  );

  // ==============================================
  // PASSWORD RESET ROUTES
  // ==============================================

  // Request password reset
  router.post(
    '/password/forgot',
    passwordResetLimiter,
    authController.requestPasswordReset.bind(authController),
  );

  // Reset password
  router.post(
    '/password/reset',
    authController.resetPassword.bind(authController),
  );

  // ==============================================
  // EMAIL VERIFICATION ROUTES
  // ==============================================

  // Verify email
  router.post('/verify-email', authController.verifyEmail.bind(authController));

  // Resend verification email
  router.post(
    '/resend-verification',
    authController.resendVerificationEmail.bind(authController),
  );

  // ==============================================
  // MFA ROUTES
  // ==============================================

  // Get MFA status
  router.get(
    '/mfa/status',
    authMiddleware.authenticate(),
    authController.getMFAStatus.bind(authController),
  );

  // Setup TOTP
  router.post(
    '/mfa/totp/setup',
    authMiddleware.authenticate(),
    authController.setupTOTP.bind(authController),
  );

  // Verify TOTP
  router.post(
    '/mfa/totp/verify',
    authMiddleware.authenticate(),
    authController.verifyTOTP.bind(authController),
  );

  // Disable TOTP
  router.delete(
    '/mfa/totp',
    authMiddleware.authenticate(),
    authController.disableTOTP.bind(authController),
  );

  // ==============================================
  // WEBAUTHN ROUTES
  // ==============================================

  // Generate WebAuthn challenge
  router.post(
    '/webauthn/challenge',
    authMiddleware.authenticate(),
    authController.generateWebAuthnChallenge.bind(authController),
  );

  // WebAuthn registration
  router.post(
    '/webauthn/register',
    authMiddleware.authenticate(),
    authController.registerWebAuthnCredential.bind(authController),
  );

  // WebAuthn authentication
  router.post(
    '/webauthn/authenticate',
    authMiddleware.authenticate(),
    authController.authenticateWebAuthn.bind(authController),
  );

  // Get WebAuthn credentials
  router.get(
    '/webauthn/credentials',
    authMiddleware.authenticate(),
    authController.getWebAuthnCredentials.bind(authController),
  );

  // Remove WebAuthn credential
  router.delete(
    '/webauthn/credentials/:credentialId',
    authMiddleware.authenticate(),
    authController.removeWebAuthnCredential.bind(authController),
  );

  // ==============================================
  // RECOVERY CODES
  // ==============================================

  // Generate recovery codes
  router.post(
    '/mfa/recovery-codes',
    authMiddleware.authenticate(),
    authController.generateRecoveryCodes.bind(authController),
  );

  // Verify recovery code
  router.post(
    '/mfa/recovery-codes/verify',
    authController.verifyRecoveryCode.bind(authController),
  );

  // ==============================================
  // OIDC/OAuth2.1 ENDPOINTS
  // ==============================================

  // OIDC Configuration
  router.get(
    '/.well-known/openid-configuration',
    authController.getOIDCConfiguration.bind(authController),
  );

  // Authorization endpoint
  router.get(
    '/authorize',
    authMiddleware.optionalAuth(),
    authController.authorize.bind(authController),
  );

  // Token endpoint
  router.post('/token', authController.token.bind(authController));

  // UserInfo endpoint
  router.get('/userinfo', authController.userinfo.bind(authController));

  // JWKS endpoint
  router.get('/jwks.json', authController.getJWKS.bind(authController));

  // Token introspection endpoint
  router.post('/introspect', authController.introspect.bind(authController));

  // Token revocation endpoint
  router.post('/revoke', authController.revoke.bind(authController));

  // ==============================================
  // KEY ROTATION ENDPOINTS
  // ==============================================

  // Get key rotation status
  router.get(
    '/keys/status',
    authMiddleware.authenticate(),
    authMiddleware.requireRole('admin'),
    authController.getKeyRotationStatus.bind(authController),
  );

  // Force key rotation
  router.post(
    '/keys/rotate',
    authMiddleware.authenticate(),
    authMiddleware.requireRole('admin'),
    authController.forceKeyRotation.bind(authController),
  );

  // ==============================================
  // ERROR HANDLING
  // ==============================================

  // 404 handler for auth routes
  router.use('*', (req, res) => {
    res.status(404).json({
      error: 'Authentication endpoint not found',
      code: 'ENDPOINT_NOT_FOUND',
      path: req.originalUrl,
    });
  });

  // Error handler
  router.use((error, req, res, next) => {
    console.error('Auth route error:', error);

    // Handle specific error types
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
      });
    }

    if (error.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'Request body too large',
        code: 'REQUEST_TOO_LARGE',
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  return router;
}

module.exports = createAuthRoutes;
