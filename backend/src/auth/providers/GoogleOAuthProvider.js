const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

class GoogleOAuthProvider {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Google OAuth client ID and secret are required');
    }

    this.client = new OAuth2Client(this.clientId, this.clientSecret, this.redirectUri);
  }

  /**
   * Verify Google ID token and extract user information
   */
  async verifyIdToken(idToken) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: idToken,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid Google ID token');
      }

      // Extract user information
      const userInfo = {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        firstName: payload.given_name,
        lastName: payload.family_name,
        name: payload.name,
        picture: payload.picture,
        locale: payload.locale,
        hd: payload.hd, // Hosted domain (for G Suite users)
      };

      return {
        success: true,
        userInfo,
      };
    } catch (error) {
      console.error('Google OAuth verification error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl(state = null) {
    const authUrl = this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      state: state,
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code) {
    try {
      const { tokens } = await this.client.getToken(code);
      return {
        success: true,
        tokens,
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user info using access token
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        success: true,
        userInfo: response.data,
      };
    } catch (error) {
      console.error('Error getting user info from Google:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate Google OAuth configuration
   */
  validateConfig() {
    const errors = [];
    
    if (!this.clientId) {
      errors.push('Google OAuth client ID is required');
    }
    
    if (!this.clientSecret) {
      errors.push('Google OAuth client secret is required');
    }
    
    if (!this.redirectUri) {
      errors.push('Google OAuth redirect URI is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = GoogleOAuthProvider;
