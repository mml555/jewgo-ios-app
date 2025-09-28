const crypto = require('crypto');

class AuthController {
  constructor(authService, rbacService, captchaService, mfaService, emailService, oidcService, keyRotationService, googleOAuthProvider, magicLinkProvider) {
    this.authService = authService;
    this.rbacService = rbacService;
    this.captchaService = captchaService;
    this.mfaService = mfaService;
    this.emailService = emailService;
    this.oidcService = oidcService;
    this.keyRotationService = keyRotationService;
    this.googleOAuthProvider = googleOAuthProvider;
    this.magicLinkProvider = magicLinkProvider;
  }

  // ==============================================
  // REGISTRATION
  // ==============================================

  async register(req, res) {
    try {
      const { email, password, firstName, lastName, captchaToken, deviceInfo } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Verify CAPTCHA if provided
      if (captchaToken) {
        const captchaResult = await this.captchaService.verifyWithRiskAssessment(
          'signup',
          captchaToken,
          'recaptcha_v2',
          null,
          ipAddress,
          userAgent
        );

        if (!captchaResult.success) {
          return res.status(400).json({
            error: 'CAPTCHA verification failed',
            code: 'CAPTCHA_FAILED',
            details: captchaResult
          });
        }
      }

      // Check if user already exists
      const existingUser = await this.authService.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      // Create user
      const userData = {
        email,
        firstName,
        lastName,
        password,
        deviceInfo: {
          platform: deviceInfo?.platform || 'unknown',
          model: deviceInfo?.model,
          osVersion: deviceInfo?.osVersion,
          appVersion: deviceInfo?.appVersion,
          ...deviceInfo
        }
      };

      const result = await this.authService.createUser(userData);

      // Assign default role
      await this.rbacService.assignRoleToUser(result.user.id, 'user');

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(result.user.id, email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully. Please check your email for verification.',
        user: {
          id: result.user.id,
          email: result.user.email,
          status: result.user.status
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  }

  // ==============================================
  // LOGIN
  // ==============================================

  async login(req, res) {
    try {
      const { email, password, captchaToken, deviceInfo } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Check if CAPTCHA is needed based on risk assessment
      const shouldTriggerCaptcha = await this.captchaService.shouldTriggerCaptcha(
        'login',
        null, // userId not available yet
        ipAddress,
        userAgent
      );

      if (shouldTriggerCaptcha) {
        if (!captchaToken) {
          return res.status(400).json({
            error: 'CAPTCHA verification required',
            code: 'CAPTCHA_REQUIRED',
            captchaRequired: true
          });
        }

        const captchaResult = await this.captchaService.verifyCaptcha(
          'recaptcha_v2',
          captchaToken,
          'login',
          ipAddress,
          userAgent
        );

        if (!captchaResult.success) {
          return res.status(400).json({
            error: 'CAPTCHA verification failed',
            code: 'CAPTCHA_FAILED',
            details: captchaResult
          });
        }
      }

      // Authenticate user
      const authResult = await this.authService.authenticatePassword(
        email,
        password,
        deviceInfo,
        ipAddress,
        userAgent
      );

      // Get user permissions for response
      const permissions = await this.rbacService.getUserPermissions(authResult.user.id);
      const roles = await this.rbacService.getUserRoles(authResult.user.id);

      res.json({
        success: true,
        user: {
          ...authResult.user,
          roles: roles.map(r => r.name),
          permissions: permissions.map(p => p.name)
        },
        tokens: authResult.tokens,
        session: authResult.session
      });

    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message === 'Invalid credentials' || error.message === 'Account is not active') {
        return res.status(401).json({
          error: error.message,
          code: 'AUTH_FAILED'
        });
      }

      res.status(500).json({
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  }

  // ==============================================
  // TOKEN REFRESH
  // ==============================================

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      const authResult = await this.authService.refreshTokens(
        refreshToken,
        ipAddress,
        userAgent
      );

      // Get updated permissions
      const permissions = await this.rbacService.getUserPermissions(authResult.user.id);
      const roles = await this.rbacService.getUserRoles(authResult.user.id);

      res.json({
        success: true,
        user: {
          ...authResult.user,
          roles: roles.map(r => r.name),
          permissions: permissions.map(p => p.name)
        },
        tokens: authResult.tokens,
        session: authResult.session
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      
      if (error.message === 'Invalid refresh token' || error.message === 'Token reuse detected') {
        return res.status(401).json({
          error: error.message,
          code: 'REFRESH_FAILED'
        });
      }

      res.status(500).json({
        error: 'Token refresh failed',
        code: 'REFRESH_ERROR'
      });
    }
  }

  // ==============================================
  // LOGOUT
  // ==============================================

  async logout(req, res) {
    try {
      const sessionId = req.session?.id;
      const userId = req.user?.id;

      if (sessionId) {
        await this.authService.revokeSession(sessionId, 'user_logout');
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  }

  // ==============================================
  // USER PROFILE
  // ==============================================

  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      // Get user details
      const user = await this.authService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Get user roles and permissions
      const roles = await this.rbacService.getUserRoles(userId);
      const permissions = await this.rbacService.getUserPermissions(userId);

      // Get active sessions
      const sessions = await this.authService.getActiveSessions(userId);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.primary_email,
          status: user.status,
          createdAt: user.created_at,
          roles: roles.map(r => ({
            name: r.name,
            description: r.description,
            scope: r.scope,
            expiresAt: r.expires_at
          })),
          permissions: permissions.map(p => ({
            name: p.name,
            resource: p.resource
          })),
          sessions: sessions.map(s => ({
            id: s.id,
            platform: s.platform,
            deviceHandle: s.device_handle,
            lastUsedAt: s.last_used_at,
            createdAt: s.created_at,
            current: s.id === req.session.id
          }))
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to get profile',
        code: 'PROFILE_ERROR'
      });
    }
  }

  // ==============================================
  // SESSION MANAGEMENT
  // ==============================================

  async getSessions(req, res) {
    try {
      const userId = req.user.id;
      const sessions = await this.authService.getActiveSessions(userId);

      res.json({
        success: true,
        sessions: sessions.map(s => ({
          id: s.id,
          platform: s.platform,
          deviceHandle: s.device_handle,
          ipAddress: s.ip_address,
          userAgent: s.user_agent,
          lastUsedAt: s.last_used_at,
          createdAt: s.created_at,
          expiresAt: s.expires_at,
          current: s.id === req.session.id
        }))
      });

    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        error: 'Failed to get sessions',
        code: 'SESSIONS_ERROR'
      });
    }
  }

  async revokeSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Verify the session belongs to the user
      const sessions = await this.authService.getActiveSessions(userId);
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      await this.authService.revokeSession(sessionId, 'manual_revoke');

      res.json({
        success: true,
        message: 'Session revoked successfully'
      });

    } catch (error) {
      console.error('Revoke session error:', error);
      res.status(500).json({
        error: 'Failed to revoke session',
        code: 'REVOKE_SESSION_ERROR'
      });
    }
  }

  // ==============================================
  // PASSWORD RESET
  // ==============================================

  async requestPasswordReset(req, res) {
    try {
      const { email, captchaToken } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        });
      }

      // Verify CAPTCHA
      if (captchaToken) {
        const captchaResult = await this.captchaService.verifyCaptcha(
          'recaptcha_v2',
          captchaToken,
          'password_reset',
          ipAddress,
          userAgent
        );

        if (!captchaResult.success) {
          return res.status(400).json({
            error: 'CAPTCHA verification failed',
            code: 'CAPTCHA_FAILED'
          });
        }
      }

      // Check if user exists (don't reveal if they don't)
      const user = await this.authService.getUserByEmail(email);
      if (user) {
        // Generate reset token and send email
        try {
          await this.emailService.sendPasswordResetEmail(user.id, email);
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError);
          // Don't reveal that email sending failed
        }
      }

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        error: 'Password reset request failed',
        code: 'PASSWORD_RESET_ERROR'
      });
    }
  }

  // ==============================================
  // MFA ENDPOINTS
  // ==============================================

  async setupTOTP(req, res) {
    try {
      const userId = req.user.id;
      const result = await this.mfaService.setupTOTP(userId);

      res.json({
        success: true,
        data: {
          secret: result.secret,
          qrCodeUrl: result.qrCodeUrl,
          manualEntryKey: result.manualEntryKey
        }
      });

    } catch (error) {
      console.error('TOTP setup error:', error);
      res.status(500).json({
        error: 'Failed to setup TOTP',
        code: 'TOTP_SETUP_ERROR'
      });
    }
  }

  async verifyTOTP(req, res) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'TOTP token is required',
          code: 'MISSING_TOTP_TOKEN'
        });
      }

      const isValid = await this.mfaService.verifyTOTP(userId, token);

      if (isValid) {
        res.json({
          success: true,
          message: 'TOTP verified successfully'
        });
      } else {
        res.status(400).json({
          error: 'Invalid TOTP token',
          code: 'INVALID_TOTP_TOKEN'
        });
      }

    } catch (error) {
      console.error('TOTP verification error:', error);
      res.status(500).json({
        error: 'TOTP verification failed',
        code: 'TOTP_VERIFY_ERROR'
      });
    }
  }

  async disableTOTP(req, res) {
    try {
      const userId = req.user.id;
      const success = await this.mfaService.disableTOTP(userId);

      if (success) {
        res.json({
          success: true,
          message: 'TOTP disabled successfully'
        });
      } else {
        res.status(404).json({
          error: 'TOTP not found',
          code: 'TOTP_NOT_FOUND'
        });
      }

    } catch (error) {
      console.error('TOTP disable error:', error);
      res.status(500).json({
        error: 'Failed to disable TOTP',
        code: 'TOTP_DISABLE_ERROR'
      });
    }
  }

  async getMFAStatus(req, res) {
    try {
      const userId = req.user.id;
      const status = await this.mfaService.getMFAStatus(userId);

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('Get MFA status error:', error);
      res.status(500).json({
        error: 'Failed to get MFA status',
        code: 'MFA_STATUS_ERROR'
      });
    }
  }

  async generateWebAuthnChallenge(req, res) {
    try {
      const userId = req.user.id;
      const { operation = 'registration' } = req.body;

      const challenge = await this.mfaService.generateWebAuthnChallenge(userId, operation);

      res.json({
        success: true,
        data: {
          challenge,
          operation
        }
      });

    } catch (error) {
      console.error('WebAuthn challenge generation error:', error);
      res.status(500).json({
        error: 'Failed to generate WebAuthn challenge',
        code: 'WEBAUTHN_CHALLENGE_ERROR'
      });
    }
  }

  async registerWebAuthnCredential(req, res) {
    try {
      const userId = req.user.id;
      const { challenge, credentialData } = req.body;

      if (!challenge || !credentialData) {
        return res.status(400).json({
          error: 'Challenge and credential data are required',
          code: 'MISSING_WEBAUTHN_DATA'
        });
      }

      // Verify challenge
      await this.mfaService.verifyWebAuthnChallenge(userId, challenge, 'registration');

      // Register credential
      await this.mfaService.registerWebAuthnCredential(userId, credentialData);

      res.json({
        success: true,
        message: 'WebAuthn credential registered successfully'
      });

    } catch (error) {
      console.error('WebAuthn registration error:', error);
      res.status(500).json({
        error: 'WebAuthn registration failed',
        code: 'WEBAUTHN_REGISTER_ERROR'
      });
    }
  }

  async authenticateWebAuthn(req, res) {
    try {
      const userId = req.user.id;
      const { challenge, credentialData } = req.body;

      if (!challenge || !credentialData) {
        return res.status(400).json({
          error: 'Challenge and credential data are required',
          code: 'MISSING_WEBAUTHN_DATA'
        });
      }

      // Verify challenge
      await this.mfaService.verifyWebAuthnChallenge(userId, challenge, 'authentication');

      // Authenticate credential
      const isValid = await this.mfaService.authenticateWebAuthn(userId, credentialData);

      if (isValid) {
        res.json({
          success: true,
          message: 'WebAuthn authentication successful'
        });
      } else {
        res.status(400).json({
          error: 'WebAuthn authentication failed',
          code: 'WEBAUTHN_AUTH_FAILED'
        });
      }

    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      res.status(500).json({
        error: 'WebAuthn authentication failed',
        code: 'WEBAUTHN_AUTH_ERROR'
      });
    }
  }

  async getWebAuthnCredentials(req, res) {
    try {
      const userId = req.user.id;
      const credentials = await this.mfaService.getWebAuthnCredentials(userId);

      res.json({
        success: true,
        data: {
          credentials
        }
      });

    } catch (error) {
      console.error('Get WebAuthn credentials error:', error);
      res.status(500).json({
        error: 'Failed to get WebAuthn credentials',
        code: 'WEBAUTHN_GET_CREDENTIALS_ERROR'
      });
    }
  }

  async removeWebAuthnCredential(req, res) {
    try {
      const userId = req.user.id;
      const { credentialId } = req.params;

      const success = await this.mfaService.removeWebAuthnCredential(userId, credentialId);

      if (success) {
        res.json({
          success: true,
          message: 'WebAuthn credential removed successfully'
        });
      } else {
        res.status(404).json({
          error: 'WebAuthn credential not found',
          code: 'WEBAUTHN_CREDENTIAL_NOT_FOUND'
        });
      }

    } catch (error) {
      console.error('Remove WebAuthn credential error:', error);
      res.status(500).json({
        error: 'Failed to remove WebAuthn credential',
        code: 'WEBAUTHN_REMOVE_ERROR'
      });
    }
  }

  async generateRecoveryCodes(req, res) {
    try {
      const userId = req.user.id;
      const codes = await this.mfaService.generateRecoveryCodes(userId);

      res.json({
        success: true,
        data: {
          recoveryCodes: codes
        }
      });

    } catch (error) {
      console.error('Generate recovery codes error:', error);
      res.status(500).json({
        error: 'Failed to generate recovery codes',
        code: 'RECOVERY_CODES_ERROR'
      });
    }
  }

  async verifyRecoveryCode(req, res) {
    try {
      const userId = req.user.id;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          error: 'Recovery code is required',
          code: 'MISSING_RECOVERY_CODE'
        });
      }

      const isValid = await this.mfaService.verifyRecoveryCode(userId, code);

      if (isValid) {
        res.json({
          success: true,
          message: 'Recovery code verified successfully'
        });
      } else {
        res.status(400).json({
          error: 'Invalid recovery code',
          code: 'INVALID_RECOVERY_CODE'
        });
      }

    } catch (error) {
      console.error('Recovery code verification error:', error);
      res.status(500).json({
        error: 'Recovery code verification failed',
        code: 'RECOVERY_CODE_VERIFY_ERROR'
      });
    }
  }

  // ==============================================
  // EMAIL VERIFICATION ENDPOINTS
  // ==============================================

  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Verification token is required',
          code: 'MISSING_VERIFICATION_TOKEN'
        });
      }

      const result = await this.emailService.verifyEmailToken(token);

      res.json({
        success: true,
        message: 'Email verified successfully',
        user: {
          id: result.userId,
          email: result.email
        }
      });

    } catch (error) {
      console.error('Email verification error:', error);
      
      if (error.message === 'Invalid or expired verification token') {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_VERIFICATION_TOKEN'
        });
      }

      res.status(500).json({
        error: 'Email verification failed',
        code: 'EMAIL_VERIFICATION_ERROR'
      });
    }
  }

  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        });
      }

      // Check if user exists and is not already verified
      const user = await this.authService.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user doesn't exist
        return res.json({
          success: true,
          message: 'If the email exists and is not verified, a verification email has been sent'
        });
      }

      if (user.status === 'active') {
        return res.status(400).json({
          error: 'Email is already verified',
          code: 'EMAIL_ALREADY_VERIFIED'
        });
      }

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(user.id, email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't reveal that email sending failed
      }

      res.json({
        success: true,
        message: 'If the email exists and is not verified, a verification email has been sent'
      });

    } catch (error) {
      console.error('Resend verification email error:', error);
      res.status(500).json({
        error: 'Failed to resend verification email',
        code: 'RESEND_VERIFICATION_ERROR'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          error: 'Token and new password are required',
          code: 'MISSING_RESET_DATA'
        });
      }

      // Verify reset token
      const tokenResult = await this.emailService.verifyPasswordResetToken(token);

      // Update password
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(newPassword, 12);

      await this.authService.db.query(`
        UPDATE credentials 
        SET cred_hash = $1, updated_at = NOW()
        WHERE identity_id IN (
          SELECT i.id FROM identities i 
          WHERE i.user_id = $2 AND i.type = 'password'
        ) AND cred_type = 'password_hash'
      `, [passwordHash, tokenResult.userId]);

      // Mark token as used
      await this.emailService.markPasswordResetTokenUsed(token);

      // Revoke all sessions for security
      await this.authService.revokeSessionFamily(null, 'password_reset');

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.message === 'Invalid or expired password reset token') {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_RESET_TOKEN'
        });
      }

      res.status(500).json({
        error: 'Password reset failed',
        code: 'PASSWORD_RESET_ERROR'
      });
    }
  }

  // ==============================================
  // OIDC ENDPOINTS
  // ==============================================

  async getOIDCConfiguration(req, res) {
    try {
      const config = this.oidcService.getConfiguration();
      res.json(config);
    } catch (error) {
      console.error('OIDC configuration error:', error);
      res.status(500).json({
        error: 'Failed to get OIDC configuration',
        code: 'OIDC_CONFIG_ERROR'
      });
    }
  }

  async authorize(req, res) {
    try {
      const {
        response_type,
        client_id,
        redirect_uri,
        scope,
        state,
        code_challenge,
        code_challenge_method
      } = req.query;

      // Validate required parameters
      if (response_type !== 'code') {
        return res.status(400).json({
          error: 'unsupported_response_type',
          error_description: 'Only authorization code flow is supported'
        });
      }

      if (!client_id || !redirect_uri || !scope) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing required parameters'
        });
      }

      // Validate PKCE parameters
      if (!code_challenge || !code_challenge_method) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'PKCE parameters are required'
        });
      }

      if (code_challenge_method !== 'S256') {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Only S256 code challenge method is supported'
        });
      }

      // Check if user is authenticated
      if (!req.user) {
        // Redirect to login with OIDC parameters preserved
        const loginUrl = `/login?${new URLSearchParams({
          client_id,
          redirect_uri,
          scope,
          state,
          code_challenge,
          code_challenge_method
        }).toString()}`;
        
        return res.redirect(loginUrl);
      }

      // Validate scopes
      const allowedScopes = ['openid', 'profile', 'email'];
      if (!this.oidcService.validateScopes(scope, allowedScopes)) {
        return res.status(400).json({
          error: 'invalid_scope',
          error_description: 'Invalid scope requested'
        });
      }

      // Generate authorization code
      const code = await this.oidcService.generateAuthorizationCode(
        req.user.id,
        client_id,
        redirect_uri,
        scope.split(' '),
        code_challenge,
        code_challenge_method
      );

      // Redirect back to client with authorization code
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set('code', code);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      res.redirect(redirectUrl.toString());

    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  async token(req, res) {
    try {
      const { grant_type } = req.body;

      if (grant_type === 'authorization_code') {
        const {
          code,
          client_id,
          redirect_uri,
          code_verifier
        } = req.body;

        if (!code || !client_id || !redirect_uri || !code_verifier) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing required parameters'
          });
        }

        const tokens = await this.oidcService.exchangeCodeForTokens(
          code,
          client_id,
          redirect_uri,
          code_verifier
        );

        res.json(tokens);

      } else if (grant_type === 'refresh_token') {
        const { refresh_token, scope } = req.body;

        if (!refresh_token) {
          return res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing refresh token'
          });
        }

        const scopes = scope ? scope.split(' ') : ['openid'];
        const tokens = await this.oidcService.refreshAccessToken(refresh_token, scopes);

        res.json(tokens);

      } else {
        res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code and refresh_token are supported'
        });
      }

    } catch (error) {
      console.error('Token endpoint error:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: error.message
        });
      }

      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  async userinfo(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'invalid_token',
          error_description: 'Bearer token required'
        });
      }

      const accessToken = authHeader.substring(7);
      const userInfo = await this.oidcService.getUserInfo(accessToken);

      res.json(userInfo);

    } catch (error) {
      console.error('UserInfo endpoint error:', error);
      
      if (error.message.includes('expired') || error.message.includes('Invalid')) {
        return res.status(401).json({
          error: 'invalid_token',
          error_description: error.message
        });
      }

      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  async jwks(req, res) {
    try {
      const jwks = this.oidcService.getJWKS();
      res.json(jwks);
    } catch (error) {
      console.error('JWKS endpoint error:', error);
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  async introspect(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Token parameter is required'
        });
      }

      const introspection = await this.oidcService.introspectToken(token);
      res.json(introspection);

    } catch (error) {
      console.error('Token introspection error:', error);
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  async revoke(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Token parameter is required'
        });
      }

      const result = await this.oidcService.revokeToken(token);
      res.json(result);

    } catch (error) {
      console.error('Token revocation error:', error);
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  // ==============================================
  // KEY ROTATION ENDPOINTS
  // ==============================================

  async getKeyRotationStatus(req, res) {
    try {
      if (!this.keyRotationService) {
        return res.status(501).json({
          error: 'Key rotation service not available',
          code: 'KEY_ROTATION_NOT_AVAILABLE'
        });
      }

      const status = this.keyRotationService.getHealthStatus();
      const allKeys = await this.keyRotationService.getAllKeys();

      res.json({
        success: true,
        data: {
          status,
          keys: allKeys
        }
      });

    } catch (error) {
      console.error('Get key rotation status error:', error);
      res.status(500).json({
        error: 'Failed to get key rotation status',
        code: 'KEY_ROTATION_STATUS_ERROR'
      });
    }
  }

  async forceKeyRotation(req, res) {
    try {
      if (!this.keyRotationService) {
        return res.status(501).json({
          error: 'Key rotation service not available',
          code: 'KEY_ROTATION_NOT_AVAILABLE'
        });
      }

      const newKeyId = await this.keyRotationService.forceRotation();

      res.json({
        success: true,
        message: 'Key rotation completed successfully',
        data: {
          newKeyId
        }
      });

    } catch (error) {
      console.error('Force key rotation error:', error);
      res.status(500).json({
        error: 'Failed to rotate keys',
        code: 'KEY_ROTATION_ERROR'
      });
    }
  }

  async getJWKS(req, res) {
    try {
      if (this.keyRotationService) {
        const jwks = this.keyRotationService.getJWKS();
        res.json(jwks);
      } else {
        // Fallback to OIDC service JWKS
        const jwks = this.oidcService.getJWKS();
        res.json(jwks);
      }
    } catch (error) {
      console.error('JWKS endpoint error:', error);
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  // ==============================================
  // GOOGLE OAUTH AUTHENTICATION
  // ==============================================

  async googleOAuth(req, res) {
    try {
      const { idToken, deviceInfo } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      if (!idToken) {
        return res.status(400).json({
          error: 'Google ID token is required',
          code: 'MISSING_ID_TOKEN'
        });
      }

      console.log('🔐 Google OAuth authentication attempt from:', ipAddress);

      // Verify Google ID token
      const verificationResult = await this.googleOAuthProvider.verifyIdToken(idToken);
      
      if (!verificationResult.success) {
        return res.status(400).json({
          error: 'Invalid Google ID token',
          code: 'INVALID_ID_TOKEN',
          details: verificationResult.error
        });
      }

      const { userInfo } = verificationResult;
      console.log('✅ Google OAuth verification successful for:', userInfo.email);

      // Check if user exists
      let user = await this.authService.findUserByEmail(userInfo.email);
      
      if (!user) {
        // Create new user from Google OAuth data
        console.log('👤 Creating new user from Google OAuth:', userInfo.email);
        
        user = await this.authService.createUser({
          email: userInfo.email,
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          status: 'active', // Auto-activate Google OAuth users
          emailVerified: userInfo.emailVerified,
          profilePicture: userInfo.picture,
          oauthProvider: 'google',
          oauthId: userInfo.googleId,
        });

        // Log registration event
        await this.authService.logAuthEvent(user.id, 'register', true, { 
          method: 'google_oauth',
          device_id: deviceInfo?.deviceId 
        });
      } else {
        // Update existing user with Google OAuth info if needed
        if (!user.oauthProvider || !user.oauthId) {
          await this.authService.updateUserOAuthInfo(user.id, {
            oauthProvider: 'google',
            oauthId: userInfo.googleId,
            profilePicture: userInfo.picture,
          });
        }

        // Log login event
        await this.authService.logAuthEvent(user.id, 'login', true, { 
          method: 'google_oauth',
          device_id: deviceInfo?.deviceId 
        });
      }

      // Generate tokens
      const tokens = await this.authService.generateTokens(user.id, deviceInfo);
      
      // Get user with roles and permissions
      const userWithRoles = await this.rbacService.getUserWithRoles(user.id);

      res.json({
        success: true,
        message: 'Google OAuth authentication successful',
        user: {
          id: userWithRoles.id,
          email: userWithRoles.email,
          firstName: userWithRoles.firstName,
          lastName: userWithRoles.lastName,
          status: userWithRoles.status,
          roles: userWithRoles.roles,
          permissions: userWithRoles.permissions,
          profilePicture: userWithRoles.profilePicture,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: 'Bearer'
        }
      });

    } catch (error) {
      console.error('Google OAuth authentication error:', error);
      res.status(500).json({
        success: false,
        error: 'Google OAuth authentication failed',
        message: error.message
      });
    }
  }

  // ==============================================
  // MAGIC LINK AUTHENTICATION
  // ==============================================

  async sendMagicLink(req, res) {
    try {
      const { email, purpose = 'login' } = req.body;
      const ipAddress = req.ip;

      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        });
      }

      console.log(`📧 Sending magic link to: ${email} for purpose: ${purpose}`);

      // Generate magic link
      const magicLinkResult = this.magicLinkProvider.generateMobileMagicLinkUrl(email, purpose);
      
      if (!magicLinkResult.success) {
        return res.status(500).json({
          error: 'Failed to generate magic link',
          code: 'MAGIC_LINK_GENERATION_FAILED'
        });
      }

      // Create email template
      const emailTemplate = this.magicLinkProvider.createMagicLinkEmail(
        email, 
        magicLinkResult.url, 
        purpose
      );

      // Send email
      await this.emailService.sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log(`✅ Magic link sent successfully to: ${email}`);

      res.json({
        success: true,
        message: 'Magic link sent successfully',
        expiresAt: magicLinkResult.expiresAt
      });

    } catch (error) {
      console.error('Magic link sending error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send magic link',
        message: error.message
      });
    }
  }

  async verifyMagicLink(req, res) {
    try {
      const { token, deviceInfo } = req.body;
      const ipAddress = req.ip;

      if (!token) {
        return res.status(400).json({
          error: 'Magic link token is required',
          code: 'MISSING_TOKEN'
        });
      }

      console.log('🔗 Verifying magic link from:', ipAddress);

      // Verify magic link token
      const verificationResult = this.magicLinkProvider.verifyMagicLink(token);
      
      if (!verificationResult.success) {
        return res.status(400).json({
          error: verificationResult.error,
          code: verificationResult.code
        });
      }

      const { email, purpose } = verificationResult;
      console.log('✅ Magic link verification successful for:', email);

      // Check if user exists
      let user = await this.authService.findUserByEmail(email);
      
      if (purpose === 'register' && !user) {
        // Create new user for registration
        console.log('👤 Creating new user from magic link:', email);
        
        user = await this.authService.createUser({
          email: email,
          firstName: '',
          lastName: '',
          status: 'active', // Auto-activate magic link users
          emailVerified: true,
          oauthProvider: 'magic_link',
        });

        // Log registration event
        await this.authService.logAuthEvent(user.id, 'register', true, { 
          method: 'magic_link',
          device_id: deviceInfo?.deviceId 
        });
      } else if (purpose === 'login' && user) {
        // Log login event for existing user
        await this.authService.logAuthEvent(user.id, 'login', true, { 
          method: 'magic_link',
          device_id: deviceInfo?.deviceId 
        });
      } else if (!user) {
        return res.status(404).json({
          error: 'User not found. Please register first.',
          code: 'USER_NOT_FOUND'
        });
      }

      // Generate tokens
      const tokens = await this.authService.generateTokens(user.id, deviceInfo);
      
      // Get user with roles and permissions
      const userWithRoles = await this.rbacService.getUserWithRoles(user.id);

      res.json({
        success: true,
        message: 'Magic link authentication successful',
        user: {
          id: userWithRoles.id,
          email: userWithRoles.email,
          firstName: userWithRoles.firstName,
          lastName: userWithRoles.lastName,
          status: userWithRoles.status,
          roles: userWithRoles.roles,
          permissions: userWithRoles.permissions,
          profilePicture: userWithRoles.profilePicture,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: 'Bearer'
        }
      });

    } catch (error) {
      console.error('Magic link verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Magic link verification failed',
        message: error.message
      });
    }
  }

  // ==============================================
  // HEALTH CHECK
  // ==============================================

  async healthCheck(req, res) {
    try {
      const dbStatus = await this.authService.db.query('SELECT 1');
      
      let keyRotationStatus = 'operational';
      if (this.keyRotationService) {
        const status = this.keyRotationService.getHealthStatus();
        keyRotationStatus = status.status === 'healthy' ? 'operational' : status.status;
      }
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          auth: 'operational',
          rbac: 'operational',
          captcha: 'operational',
          mfa: 'operational',
          email: 'operational',
          oidc: 'operational',
          keyRotation: keyRotationStatus
        }
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message
      });
    }
  }
}

module.exports = AuthController;
