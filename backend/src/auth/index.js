const { Pool } = require('pg');
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
    this.authMiddleware = new AuthMiddleware(this.authService, this.rbacService, this.mfaService, this.keyRotationService, this.guestService);
    this.authController = new AuthController(this.authService, this.rbacService, this.captchaService, this.mfaService, this.emailService, this.oidcService, this.keyRotationService);
    this.guestController = new GuestController(this.guestService, this.authService);
    
    this.initializeCaptchaProviders();
  }

  initializeCaptchaProviders() {
    // Initialize reCAPTCHA providers
    if (process.env.RECAPTCHA_V2_SECRET_KEY) {
      const recaptchaV2Provider = new ReCaptchaProvider({
        secretKey: process.env.RECAPTCHA_V2_SECRET_KEY,
        siteKey: process.env.RECAPTCHA_V2_SITE_KEY,
        version: 'v2'
      });
      this.captchaService.registerProvider('recaptcha_v2', recaptchaV2Provider);
    }

    if (process.env.RECAPTCHA_V3_SECRET_KEY) {
      const recaptchaV3Provider = new ReCaptchaProvider({
        secretKey: process.env.RECAPTCHA_V3_SECRET_KEY,
        siteKey: process.env.RECAPTCHA_V3_SITE_KEY,
        version: 'v3',
        threshold: parseFloat(process.env.RECAPTCHA_V3_THRESHOLD) || 0.5
      });
      this.captchaService.registerProvider('recaptcha_v3', recaptchaV3Provider);
    }

    // Initialize hCaptcha provider
    if (process.env.HCAPTCHA_SECRET_KEY) {
      const hcaptchaProvider = new HCaptchaProvider({
        secretKey: process.env.HCAPTCHA_SECRET_KEY,
        siteKey: process.env.HCAPTCHA_SITE_KEY
      });
      this.captchaService.registerProvider('hcaptcha', hcaptchaProvider);
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
      const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingEnvVars.length > 0) {
        return {
          status: 'unhealthy',
          error: `Missing required environment variables: ${missingEnvVars.join(', ')}`
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
          keyRotation: 'operational'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
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
      
      console.log('Auth system cleanup completed');
    } catch (error) {
      console.error('Auth system cleanup error:', error);
    }
  }
}

module.exports = AuthSystem;
