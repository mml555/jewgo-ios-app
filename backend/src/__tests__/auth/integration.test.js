const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');
const AuthSystem = require('../../auth');

// Mock database connection
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

describe('Authentication Integration Tests', () => {
  let app;
  let mockPool;
  let mockClient;

  beforeAll(() => {
    // Set up environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-key-32-characters-long';
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-key-32-characters-long';
    process.env.JWT_ISSUER = 'test-issuer';
    process.env.JWT_AUDIENCE = 'test-audience';
    process.env.API_BASE_URL = 'http://localhost:3001';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.FROM_EMAIL = 'test@example.com';
  });

  beforeEach(() => {
    // Mock database client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
      connect: jest.fn(),
    };

    // Mock database pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
      end: jest.fn(),
    };

    // Mock Pool constructor
    Pool.mockImplementation(() => mockPool);

    // Create Express app
    app = express();
    app.use(express.json());

    // Initialize auth system
    new AuthSystem(mockPool);

    // Set up routes
    const authRoutes = require('../../routes/auth');
    app.use('/api/v5/auth', authRoutes);

    // Mock session middleware
    app.use((req, res, next) => {
      req.session = {};
      next();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v5/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      // Mock database responses
      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'user-123',
              primary_email: 'test@example.com',
              status: 'pending',
              created_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ id: 'identity-123' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'device-123' }] });

      const response = await request(app)
        .post('/api/v5/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.status).toBe('pending');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v5/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: '123',
      };

      const response = await request(app)
        .post('/api/v5/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'Password must be at least 8 characters long',
      );
    });
  });

  describe('POST /api/v5/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock user lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'user-123',
            primary_email: 'test@example.com',
            status: 'active',
            cred_hash: '$2a$12$hashedpassword',
          },
        ],
      });

      // Mock device creation
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'device-123' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'session-123',
              family_jti: 'family-123',
              current_jti: 'current-123',
              expires_at: new Date(),
            },
          ],
        });

      const response = await request(app)
        .post('/api/v5/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/v5/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/v5/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token',
      };

      // Mock session lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'session-123',
            user_id: 'user-123',
            primary_email: 'test@example.com',
            status: 'active',
            family_jti: 'family-123',
            current_jti: 'current-123',
          },
        ],
      });

      // Mock session update
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/v5/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tokens).toBeDefined();
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    it('should reject refresh with invalid token', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/v5/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/v5/auth/logout', () => {
    it('should logout with valid session', async () => {
      // Mock session lookup and revocation
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-123' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/v5/auth/logout')
        .send({ sessionId: 'session-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v5/auth/me', () => {
    it('should return user info with valid token', async () => {
      // Mock JWT verification
      const mockUser = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Mock JWT token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { sub: 'user-123', iss: 'test-issuer', aud: 'test-audience' },
        'test-jwt-secret-key-32-characters-long',
        { expiresIn: '1h' },
      );

      const response = await request(app)
        .get('/api/v5/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v5/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /api/v5/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const verifyData = {
        token: 'valid-verification-token',
      };

      // Mock token verification
      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              user_id: 'user-123',
              expires_at: new Date(Date.now() + 86400000),
              primary_email: 'test@example.com',
              status: 'pending',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // Mark token as used
        .mockResolvedValueOnce({ rows: [] }); // Update user status

      const response = await request(app)
        .post('/api/v5/auth/verify-email')
        .send(verifyData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully');
    });

    it('should reject verification with invalid token', async () => {
      const verifyData = {
        token: 'invalid-token',
      };

      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/v5/auth/verify-email')
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired verification token');
    });
  });

  describe('POST /api/v5/auth/password/forgot', () => {
    it('should send password reset email', async () => {
      const resetData = {
        email: 'test@example.com',
      };

      // Mock user lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'user-123',
            primary_email: 'test@example.com',
          },
        ],
      });

      // Mock token creation
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Insert reset token
        .mockResolvedValueOnce({ rows: [] }); // Log event

      const response = await request(app)
        .post('/api/v5/auth/password/forgot')
        .send(resetData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'If the email exists, a password reset link has been sent',
      );
    });
  });

  describe('GET /api/v5/auth/mfa/status', () => {
    it('should return MFA status for authenticated user', async () => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { sub: 'user-123', iss: 'test-issuer', aud: 'test-audience' },
        'test-jwt-secret-key-32-characters-long',
        { expiresIn: '1h' },
      );

      // Mock MFA status
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // TOTP check
        .mockResolvedValueOnce({ rows: [] }); // WebAuthn check

      const response = await request(app)
        .get('/api/v5/auth/mfa/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totpEnabled).toBe(false);
      expect(response.body.data.webauthnEnabled).toBe(false);
    });
  });

  describe('GET /api/v5/auth/.well-known/openid-configuration', () => {
    it('should return OIDC configuration', async () => {
      const response = await request(app).get(
        '/api/v5/auth/.well-known/openid-configuration',
      );

      expect(response.status).toBe(200);
      expect(response.body.issuer).toBe('test-issuer');
      expect(response.body.authorization_endpoint).toBe(
        'http://localhost:3001/api/v5/auth/authorize',
      );
      expect(response.body.token_endpoint).toBe(
        'http://localhost:3001/api/v5/auth/token',
      );
      expect(response.body.userinfo_endpoint).toBe(
        'http://localhost:3001/api/v5/auth/userinfo',
      );
      expect(response.body.jwks_uri).toBe(
        'http://localhost:3001/api/v5/auth/jwks.json',
      );
    });
  });

  describe('GET /api/v5/auth/jwks.json', () => {
    it('should return JWKS', async () => {
      const response = await request(app).get('/api/v5/auth/jwks.json');

      expect(response.status).toBe(200);
      expect(response.body.keys).toBeDefined();
      expect(response.body.keys).toHaveLength(1);
      expect(response.body.keys[0].kty).toBe('oct');
      expect(response.body.keys[0].kid).toBe('default');
    });
  });

  describe('POST /api/v5/auth/token', () => {
    it('should exchange authorization code for tokens', async () => {
      const tokenData = {
        grant_type: 'authorization_code',
        code: 'valid-auth-code',
        client_id: 'client-123',
        redirect_uri: 'http://localhost:3000/callback',
        code_verifier: 'code-verifier',
      };

      // Mock code exchange
      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              user_id: 'user-123',
              expires_at: new Date(Date.now() + 600000),
              details: JSON.stringify({
                client_id: 'client-123',
                redirect_uri: 'http://localhost:3000/callback',
                scopes: ['openid', 'profile'],
                code_challenge: 'challenge',
                code_challenge_method: 'S256',
              }),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // Mark code as used
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'user-123',
              primary_email: 'test@example.com',
              status: 'active',
              created_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // Insert refresh token
        .mockResolvedValueOnce({ rows: [] }); // Log event

      const response = await request(app)
        .post('/api/v5/auth/token')
        .send(tokenData);

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
      expect(response.body.token_type).toBe('Bearer');
      expect(response.body.expires_in).toBe(3600);
    });

    it('should refresh tokens with refresh_token grant', async () => {
      const tokenData = {
        grant_type: 'refresh_token',
        refresh_token: 'valid-refresh-token',
        scope: 'openid profile',
      };

      // Mock refresh token validation
      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              user_id: 'user-123',
              expires_at: new Date(Date.now() + 86400000),
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'user-123',
              primary_email: 'test@example.com',
              status: 'active',
              created_at: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // Mark old token as used
        .mockResolvedValueOnce({ rows: [] }) // Insert new refresh token
        .mockResolvedValueOnce({ rows: [] }); // Log event

      const response = await request(app)
        .post('/api/v5/auth/token')
        .send(tokenData);

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });
  });

  describe('GET /api/v5/auth/userinfo', () => {
    it('should return user info with valid access token', async () => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        {
          sub: 'user-123',
          iss: 'test-issuer',
          aud: 'test-audience',
          scope: 'openid profile email',
        },
        'test-jwt-secret-key-32-characters-long',
        { expiresIn: '1h' },
      );

      // Mock user lookup
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'user-123',
            primary_email: 'test@example.com',
            status: 'active',
            created_at: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v5/auth/userinfo')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.sub).toBe('user-123');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.email_verified).toBe(true);
    });

    it('should reject request without Bearer token', async () => {
      const response = await request(app).get('/api/v5/auth/userinfo');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('invalid_token');
      expect(response.body.error_description).toBe('Bearer token required');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const response = await request(app).get('/api/v5/auth/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
    });
  });
});
