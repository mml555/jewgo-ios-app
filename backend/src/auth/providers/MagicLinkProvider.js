const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class MagicLinkProvider {
  constructor(config) {
    this.secretKey = config.secretKey;
    this.expirationTime = config.expirationTime || 15 * 60 * 1000; // 15 minutes default
    this.baseUrl = config.baseUrl;
    this.frontendUrl = config.frontendUrl;
    
    if (!this.secretKey) {
      throw new Error('Magic link secret key is required');
    }
  }

  /**
   * Generate a magic link token for email
   */
  generateMagicLink(email, purpose = 'login') {
    try {
      const payload = {
        email: email,
        purpose: purpose,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + this.expirationTime) / 1000),
        nonce: crypto.randomBytes(16).toString('hex'),
      };

      const token = jwt.sign(payload, this.secretKey, { algorithm: 'HS256' });
      
      return {
        success: true,
        token,
        expiresAt: new Date(Date.now() + this.expirationTime),
      };
    } catch (error) {
      console.error('Error generating magic link:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify magic link token
   */
  verifyMagicLink(token) {
    try {
      const payload = jwt.verify(token, this.secretKey, { algorithms: ['HS256'] });
      
      // Check if token is expired (additional check)
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return {
          success: false,
          error: 'Magic link has expired',
          code: 'TOKEN_EXPIRED',
        };
      }

      return {
        success: true,
        email: payload.email,
        purpose: payload.purpose,
        nonce: payload.nonce,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
      };
    } catch (error) {
      console.error('Error verifying magic link:', error);
      
      if (error.name === 'TokenExpiredError') {
        return {
          success: false,
          error: 'Magic link has expired',
          code: 'TOKEN_EXPIRED',
        };
      }
      
      if (error.name === 'JsonWebTokenError') {
        return {
          success: false,
          error: 'Invalid magic link',
          code: 'INVALID_TOKEN',
        };
      }

      return {
        success: false,
        error: 'Magic link verification failed',
        code: 'VERIFICATION_FAILED',
      };
    }
  }

  /**
   * Generate magic link URL
   */
  generateMagicLinkUrl(email, purpose = 'login') {
    const result = this.generateMagicLink(email, purpose);
    
    if (!result.success) {
      return result;
    }

    const url = `${this.baseUrl}/auth/magic-link/verify?token=${result.token}`;
    
    return {
      success: true,
      url,
      token: result.token,
      expiresAt: result.expiresAt,
    };
  }

  /**
   * Generate mobile deep link URL
   */
  generateMobileMagicLinkUrl(email, purpose = 'login') {
    const result = this.generateMagicLink(email, purpose);
    
    if (!result.success) {
      return result;
    }

    const url = `${this.frontendUrl}/auth/magic-link?token=${result.token}`;
    
    return {
      success: true,
      url,
      token: result.token,
      expiresAt: result.expiresAt,
    };
  }

  /**
   * Create magic link email template
   */
  createMagicLinkEmail(email, magicLinkUrl, purpose = 'login') {
    const subject = purpose === 'login' 
      ? 'Sign in to Jewgo' 
      : purpose === 'register'
      ? 'Complete your Jewgo registration'
      : 'Access your Jewgo account';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #dee2e6; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🕍 Jewgo</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>Hello!</p>
            <p>Click the button below to ${purpose === 'login' ? 'sign in to' : purpose === 'register' ? 'complete your registration for' : 'access'} your Jewgo account:</p>
            <p style="text-align: center;">
              <a href="${magicLinkUrl}" class="button">${purpose === 'login' ? 'Sign In' : purpose === 'register' ? 'Complete Registration' : 'Access Account'}</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${magicLinkUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 15 minutes for your security. If you didn't request this link, please ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© 2024 Jewgo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${subject}
      
      Hello!
      
      Click the link below to ${purpose === 'login' ? 'sign in to' : purpose === 'register' ? 'complete your registration for' : 'access'} your Jewgo account:
      
      ${magicLinkUrl}
      
      ⚠️ Security Notice: This link will expire in 15 minutes for your security. If you didn't request this link, please ignore this email.
      
      This email was sent to ${email}
      © 2024 Jewgo. All rights reserved.
    `;

    return {
      subject,
      html,
      text,
    };
  }

  /**
   * Validate magic link configuration
   */
  validateConfig() {
    const errors = [];
    
    if (!this.secretKey) {
      errors.push('Magic link secret key is required');
    }
    
    if (!this.baseUrl) {
      errors.push('Magic link base URL is required');
    }
    
    if (!this.frontendUrl) {
      errors.push('Frontend URL is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = MagicLinkProvider;
