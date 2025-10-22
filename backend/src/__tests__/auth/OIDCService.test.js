const { Pool } = require('pg');
const OIDCService = require('../../auth/OIDCService');
const jwt = require('jsonwebtoken');

// Mock database connection
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
}));

describe('OIDCService', () => {
  let oidcService;
  let mockPool;
  let mockClient;

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

    // Set up environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-key-32-characters-long';
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-key-32-characters-long';
    process.env.JWT_ISSUER = 'test-issuer';
    process.env.JWT_AUDIENCE = 'test-audience';
    process.env.API_BASE_URL = 'http://localhost:3001';

    oidcService = new OIDCService(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfiguration', () => {
    it('should return OIDC configuration', () => {
      const config = oidcService.getConfiguration();

      expect(config.issuer).toBe('test-issuer');
      expect(config.authorization_endpoint).toBe(
        'http://localhost:3001/api/v5/auth/authorize',
      );
      expect(config.token_endpoint).toBe(
        'http://localhost:3001/api/v5/auth/token',
      );
      expect(config.userinfo_endpoint).toBe(
        'http://localhost:3001/api/v5/auth/userinfo',
      );
      expect(config.jwks_uri).toBe(
        'http://localhost:3001/api/v5/auth/jwks.json',
      );
      expect(config.response_types_supported).toContain('code');
      expect(config.grant_types_supported).toContain('authorization_code');
      expect(config.grant_types_supported).toContain('refresh_token');
    });
  });

  describe('generateAuthorizationCode', () => {
    it('should generate authorization code', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Insert code
        .mockResolvedValueOnce({ rows: [] }); // Log event

      const code = await oidcService.generateAuthorizationCode(
        'user-123',
        'client-123',
        'http://localhost:3000/callback',
        ['openid', 'profile'],
        'challenge-123',
        'S256',
      );

      expect(code).toMatch(/^[a-f0-9]{64}$/); // 64 hex characters
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens', async () => {
      const mockCodeDetails = {
        client_id: 'client-123',
        redirect_uri: 'http://localhost:3000/callback',
        scopes: ['openid', 'profile'],
        code_challenge: 'challenge-123',
        code_challenge_method: 'S256',
      };

      const mockUser = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
        created_at: new Date(),
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              user_id: 'user-123',
              expires_at: new Date(),
              details: JSON.stringify(mockCodeDetails),
            },
          ],
        }) // Find code
        .mockResolvedValueOnce({ rows: [] }) // Mark code as used
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [] }) // Insert refresh token
        .mockResolvedValueOnce({ rows: [] }); // Log event

      jwt.sign
        .mockReturnValueOnce('access-token') // Access token
        .mockReturnValueOnce('id-token'); // ID token

      const tokens = await oidcService.exchangeCodeForTokens(
        'valid-code',
        'client-123',
        'http://localhost:3000/callback',
        'code-verifier',
      );

      expect(tokens.access_token).toBe('access-token');
      expect(tokens.refresh_token).toBeDefined();
      expect(tokens.id_token).toBe('id-token');
      expect(tokens.token_type).toBe('Bearer');
      expect(tokens.expires_in).toBe(3600);
    });

    it('should reject invalid authorization code', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // No code found

      await expect(
        oidcService.exchangeCodeForTokens(
          'invalid-code',
          'client-123',
          'http://localhost:3000/callback',
          'code-verifier',
        ),
      ).rejects.toThrow('Invalid or expired authorization code');
    });

    it('should reject invalid code verifier', async () => {
      const mockCodeDetails = {
        code_challenge: 'expected-challenge',
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            user_id: 'user-123',
            expires_at: new Date(),
            details: JSON.stringify(mockCodeDetails),
          },
        ],
      });

      await expect(
        oidcService.exchangeCodeForTokens(
          'valid-code',
          'client-123',
          'http://localhost:3000/callback',
          'wrong-verifier',
        ),
      ).rejects.toThrow('Invalid code verifier');
    });
  });

  describe('generateTokens', () => {
    it('should generate access and ID tokens', async () => {
      const user = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
      };

      jwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('id-token');

      mockPool.query.mockResolvedValueOnce({ rows: [] }); // Insert refresh token

      const tokens = await oidcService.generateTokens(user, [
        'openid',
        'profile',
      ]);

      expect(tokens.access_token).toBe('access-token');
      expect(tokens.id_token).toBe('id-token');
      expect(tokens.refresh_token).toBeDefined();
      expect(tokens.token_type).toBe('Bearer');
      expect(tokens.expires_in).toBe(3600);
      expect(tokens.scope).toBe('openid profile');
    });

    it('should not generate ID token without openid scope', async () => {
      const user = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
      };

      jwt.sign.mockReturnValueOnce('access-token');
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // Insert refresh token

      const tokens = await oidcService.generateTokens(user, ['profile']);

      expect(tokens.access_token).toBe('access-token');
      expect(tokens.id_token).toBeUndefined();
      expect(tokens.scope).toBe('profile');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      const mockUser = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
        created_at: new Date(),
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ user_id: 'user-123', expires_at: new Date() }],
        }) // Find refresh token
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [] }) // Mark old token as used
        .mockResolvedValueOnce({ rows: [] }) // Insert new refresh token
        .mockResolvedValueOnce({ rows: [] }); // Log event

      jwt.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-id-token');

      const tokens = await oidcService.refreshAccessToken(
        'valid-refresh-token',
        ['openid'],
      );

      expect(tokens.access_token).toBe('new-access-token');
      expect(tokens.refresh_token).toBeDefined();
      expect(tokens.id_token).toBe('new-id-token');
    });

    it('should reject invalid refresh token', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // No token found

      await expect(
        oidcService.refreshAccessToken('invalid-token', ['openid']),
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('getUserInfo', () => {
    it('should return user info for valid access token', async () => {
      const mockDecoded = {
        sub: 'user-123',
        scope: 'openid profile email',
        iss: 'test-issuer',
        aud: 'test-audience',
      };

      const mockUser = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
        created_at: new Date(),
      };

      jwt.verify.mockReturnValue(mockDecoded);
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const userInfo = await oidcService.getUserInfo('valid-access-token');

      expect(userInfo.sub).toBe('user-123');
      expect(userInfo.email).toBe('test@example.com');
      expect(userInfo.email_verified).toBe(true);
    });

    it('should return limited user info based on scopes', async () => {
      const mockDecoded = {
        sub: 'user-123',
        scope: 'openid',
        iss: 'test-issuer',
        aud: 'test-audience',
      };

      const mockUser = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
        created_at: new Date(),
      };

      jwt.verify.mockReturnValue(mockDecoded);
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const userInfo = await oidcService.getUserInfo('valid-access-token');

      expect(userInfo.sub).toBe('user-123');
      expect(userInfo.email).toBeUndefined();
    });

    it('should reject expired access token', async () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      await expect(oidcService.getUserInfo('expired-token')).rejects.toThrow(
        'Access token has expired',
      );
    });

    it('should reject invalid access token', async () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      await expect(oidcService.getUserInfo('invalid-token')).rejects.toThrow(
        'Invalid access token',
      );
    });
  });

  describe('getJWKS', () => {
    it('should return JWKS', () => {
      const jwks = oidcService.getJWKS();

      expect(jwks.keys).toHaveLength(1);
      expect(jwks.keys[0].kty).toBe('oct');
      expect(jwks.keys[0].kid).toBe('default');
      expect(jwks.keys[0].use).toBe('sig');
      expect(jwks.keys[0].alg).toBe('HS256');
      expect(jwks.keys[0].k).toBeDefined();
    });
  });

  describe('introspectToken', () => {
    it('should introspect valid access token', async () => {
      const mockDecoded = {
        sub: 'user-123',
        iss: 'test-issuer',
        aud: 'test-audience',
        exp: Date.now() / 1000 + 3600,
        iat: Date.now() / 1000,
        scope: 'openid profile',
      };

      jwt.verify.mockReturnValue(mockDecoded);

      const introspection = await oidcService.introspectToken(
        'valid-access-token',
      );

      expect(introspection.active).toBe(true);
      expect(introspection.sub).toBe('user-123');
      expect(introspection.token_type).toBe('Bearer');
    });

    it('should introspect valid refresh token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Not a JWT');
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ user_id: 'user-123', expires_at: new Date() }],
      });

      const introspection = await oidcService.introspectToken(
        'valid-refresh-token',
      );

      expect(introspection.active).toBe(true);
      expect(introspection.sub).toBe('user-123');
      expect(introspection.token_type).toBe('refresh_token');
    });

    it('should return inactive for invalid token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const introspection = await oidcService.introspectToken('invalid-token');

      expect(introspection.active).toBe(false);
    });
  });

  describe('revokeToken', () => {
    it('should revoke JWT token', async () => {
      const mockDecoded = { sub: 'user-123' };
      jwt.decode.mockReturnValue(mockDecoded);

      const result = await oidcService.revokeToken('jwt-token');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token will expire naturally');
    });

    it('should revoke refresh token', async () => {
      jwt.decode.mockReturnValue(null);
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-123' }] }) // Update token
        .mockResolvedValueOnce({ rows: [] }); // Log event

      const result = await oidcService.revokeToken('refresh-token');

      expect(result.success).toBe(true);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateRedirectUri', () => {
    it('should validate allowed redirect URI', () => {
      const allowedUris = [
        'http://localhost:3000/callback',
        'https://app.example.com/callback',
      ];

      expect(
        oidcService.validateRedirectUri(
          'http://localhost:3000/callback',
          allowedUris,
        ),
      ).toBe(true);
      expect(
        oidcService.validateRedirectUri(
          'https://app.example.com/callback',
          allowedUris,
        ),
      ).toBe(true);
      expect(
        oidcService.validateRedirectUri(
          'http://malicious.com/callback',
          allowedUris,
        ),
      ).toBe(false);
    });
  });

  describe('validateScopes', () => {
    it('should validate allowed scopes', () => {
      const allowedScopes = ['openid', 'profile', 'email'];

      expect(oidcService.validateScopes('openid profile', allowedScopes)).toBe(
        true,
      );
      expect(oidcService.validateScopes('openid email', allowedScopes)).toBe(
        true,
      );
      expect(oidcService.validateScopes('openid admin', allowedScopes)).toBe(
        false,
      );
    });
  });

  describe('generateState', () => {
    it('should generate state parameter', () => {
      const state = oidcService.generateState();

      expect(state).toMatch(/^[a-f0-9]{32}$/); // 32 hex characters
    });
  });

  describe('generateNonce', () => {
    it('should generate nonce parameter', () => {
      const nonce = oidcService.generateNonce();

      expect(nonce).toMatch(/^[a-f0-9]{32}$/); // 32 hex characters
    });
  });
});
