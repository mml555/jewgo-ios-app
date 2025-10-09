const logger = require('../utils/logger');
const AuthService = require('./AuthService');
const RBACService = require('./RBACService');
const CaptchaService = require('./CaptchaService');
const MFAService = require('./MFAService');
const EmailService = require('./EmailService');
const OIDCService = require('./OIDCService');
const KeyRotationService = require('./KeyRotationService');
const GuestService = require('./GuestService');
const AuthMiddleware = require('./AuthMiddleware');
const AuthController = require('./AuthController');
const GuestController = require('./GuestController');
const ReCaptchaProvider = require('./providers/ReCaptchaProvider');
const HCaptchaProvider = require('./providers/HCaptchaProvider');
const GoogleOAuthProvider = require('./providers/GoogleOAuthProvider');
const MagicLinkProvider = require('./providers/MagicLinkProvider');

class AuthSystem {
  constructor(dbPool) {
    this.db = dbPool;
    this.keyRotationService = new KeyRotationService(dbPool);
    this.authService = new AuthService(dbPool, this.keyRotationService);
    this.rbacService = new RBACService(dbPool);
    this.captchaService = new CaptchaService(dbPool);
    this.mfaService = new MFAService(dbPool);
    this.emailService = new EmailService(dbPool);
    this.oidcService = new OIDCService(dbPool);
    this.guestService = new GuestService(dbPool);
    this.authMiddleware = new AuthMiddleware(
      this.authService,
      this.rbacService,
      this.mfaService,
      this.keyRotationService,
      this.guestService,
    );
    this.initializeProviders();
    this.authController = new AuthController(
      this.authService,
      this.rbacService,
      this.captchaService,
      this.mfaService,
      this.emailService,
      this.oidcService,
      this.keyRotationService,
      this.googleOAuthProvider,
      this.magicLinkProvider,
    );
    this.guestController = new GuestController(
      this.guestService,
      this.authService,
    );
  }

  initializeProviders() {
    // Initialize reCAPTCHA providers
    if (process.env.RECAPTCHA_V2_SECRET_KEY) {
      const recaptchaV2Provider = new ReCaptchaProvider({
        secretKey: process.env.RECAPTCHA_V2_SECRET_KEY,
        siteKey: process.env.RECAPTCHA_V2_SITE_KEY,
        version: 'v2',
      });
      this.captchaService.registerProvider('recaptcha_v2', recaptchaV2Provider);
    }

    if (process.env.RECAPTCHA_V3_SECRET_KEY) {
      const recaptchaV3Provider = new ReCaptchaProvider({
        secretKey: process.env.RECAPTCHA_V3_SECRET_KEY,
        siteKey: process.env.RECAPTCHA_V3_SITE_KEY,
        version: 'v3',
        threshold: parseFloat(process.env.RECAPTCHA_V3_THRESHOLD) || 0.5,
      });
      this.captchaService.registerProvider('recaptcha_v3', recaptchaV3Provider);
    }

    // Initialize hCaptcha provider
    if (process.env.HCAPTCHA_SECRET_KEY) {
      const hcaptchaProvider = new HCaptchaProvider({
        secretKey: process.env.HCAPTCHA_SECRET_KEY,
        siteKey: process.env.HCAPTCHA_SITE_KEY,
      });
      this.captchaService.registerProvider('hcaptcha', hcaptchaProvider);
    }

    // Initialize Google OAuth provider
    if (
      process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    ) {
      this.googleOAuthProvider = new GoogleOAuthProvider({
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirectUri:
          process.env.GOOGLE_OAUTH_REDIRECT_URI ||
          'http://localhost:3001/auth/google/callback',
      });
      logger.info('✅ Google OAuth provider initialized');
    } else {
      logger.info(
        '⚠️ Google OAuth provider not initialized - missing environment variables',
      );
    }

    // Initialize Magic Link provider
    if (process.env.MAGIC_LINK_SECRET && process.env.MAGIC_LINK_BASE_URL) {
      this.magicLinkProvider = new MagicLinkProvider({
        secretKey: process.env.MAGIC_LINK_SECRET,
        baseUrl: process.env.MAGIC_LINK_BASE_URL,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8081',
        expirationTime:
          parseInt(process.env.MAGIC_LINK_EXPIRATION, 10) || 15 * 60 * 1000, // 15 minutes
      });
      logger.info('✅ Magic Link provider initialized');
    } else {
      logger.info(
        '⚠️ Magic Link provider not initialized - missing environment variables',
      );
    }
  }

  // Getter methods for services
  getAuthService() {
    return this.authService;
  }

  getRBACService() {
    return this.rbacService;
  }

  getCaptchaService() {
    return this.captchaService;
  }

  getMFAService() {
    return this.mfaService;
  }

  getEmailService() {
    return this.emailService;
  }

  getOIDCService() {
    return this.oidcService;
  }

  getKeyRotationService() {
    return this.keyRotationService;
  }

  getAuthMiddleware() {
    return this.authMiddleware;
  }

  getAuthController() {
    return this.authController;
  }

  getGuestService() {
    return this.guestService;
  }

  getGuestController() {
    return this.guestController;
  }

  // Health check method
  async healthCheck() {
    try {
      // Check database connection
      await this.db.query('SELECT 1');

      // Check if required environment variables are set
      const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
      const missingEnvVars = requiredEnvVars.filter(
        varName => !process.env[varName],
      );

      if (missingEnvVars.length > 0) {
        return {
          status: 'unhealthy',
          error: `Missing required environment variables: ${missingEnvVars.join(
            ', ',
          )}`,
        };
      }

      return {
        status: 'healthy',
        services: {
          database: 'connected',
          auth: 'operational',
          rbac: 'operational',
          captcha: 'operational',
          mfa: 'operational',
          email: 'operational',
          oidc: 'operational',
          keyRotation: 'operational',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  // Cleanup method for graceful shutdown
  async cleanup() {
    try {
      // Clean up expired auth data
      await this.authService.cleanupExpiredData();

      // Close database connection
      await this.db.end();

      logger.info('Auth system cleanup completed');
    } catch (error) {
      logger.error('Auth system cleanup error:', error);
    }
  }
}

module.exports = AuthSystem;
