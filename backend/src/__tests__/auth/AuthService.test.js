const { Pool } = require('pg');
const AuthService = require('../../auth/AuthService');
const bcrypt = require('bcryptjs');

// Mock database connection
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

describe('AuthService', () => {
  let authService;
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

    authService = new AuthService(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user with password', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        deviceInfo: {
          platform: 'web',
          model: 'Chrome',
        },
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

      const result = await authService.createUser(userData);

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.status).toBe('pending');
      expect(result.deviceId).toBe('device-123');
      expect(mockClient.query).toHaveBeenCalledTimes(4); // BEGIN, user insert, identity insert, credentials insert, device insert, COMMIT
    });

    it('should create a user without password', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'user-123',
            primary_email: 'test@example.com',
            status: 'pending',
            created_at: new Date(),
          },
        ],
      });

      const result = await authService.createUser(userData);

      expect(result.user.email).toBe('test@example.com');
      expect(mockClient.query).toHaveBeenCalledTimes(2); // BEGIN, user insert, COMMIT
    });

    it('should handle database errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(authService.createUser(userData)).rejects.toThrow(
        'Database error',
      );
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('authenticatePassword', () => {
    it('should authenticate valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
        cred_hash: await bcrypt.hash('password123', 12),
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockUser] })
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

      const result = await authService.authenticatePassword(
        'test@example.com',
        'password123',
        { platform: 'web' },
        '127.0.0.1',
        'test-agent',
      );

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.authenticatePassword(
          'test@example.com',
          'wrongpassword',
          null,
          '127.0.0.1',
          'test-agent',
        ),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject inactive users', async () => {
      const mockUser = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'suspended',
        cred_hash: await bcrypt.hash('password123', 12),
      };

      mockClient.query.mockResolvedValueOnce({ rows: [mockUser] });

      await expect(
        authService.authenticatePassword(
          'test@example.com',
          'password123',
          null,
          '127.0.0.1',
          'test-agent',
        ),
      ).rejects.toThrow('Account is not active');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh valid tokens', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
        family_jti: 'family-123',
        current_jti: 'current-123',
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockSession] })
        .mockResolvedValueOnce({ rows: [] }); // Update session

      const refreshToken = 'valid-refresh-token';
      const result = await authService.refreshTokens(
        refreshToken,
        '127.0.0.1',
        'test-agent',
      );

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh tokens', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.refreshTokens('invalid-token', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should detect token reuse', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        family_jti: 'family-123',
        reused_jti_of: 'previous-session',
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockSession] })
        .mockResolvedValueOnce({ rows: [] }); // Revoke family

      await expect(
        authService.refreshTokens('reused-token', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow('Token reuse detected');
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-123' }] })
        .mockResolvedValueOnce({ rows: [] }); // Log event

      const result = await authService.revokeSession(
        'session-123',
        'manual_revoke',
      );

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions'),
        ['session-123'],
      );
    });

    it('should return false for non-existent session', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.revokeSession(
        'non-existent',
        'manual_revoke',
      );

      expect(result).toBe(false);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.getUserById('user-123');

      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.getUserById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: 'user-123',
        primary_email: 'test@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent email', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.getUserByEmail(
        'nonexistent@example.com',
      );

      expect(result).toBeNull();
    });
  });

  describe('parseTTL', () => {
    it('should parse seconds', () => {
      expect(authService.parseTTL('30s')).toBe(30);
    });

    it('should parse minutes', () => {
      expect(authService.parseTTL('15m')).toBe(900);
    });

    it('should parse hours', () => {
      expect(authService.parseTTL('2h')).toBe(7200);
    });

    it('should parse days', () => {
      expect(authService.parseTTL('7d')).toBe(604800);
    });

    it('should throw error for invalid format', () => {
      expect(() => authService.parseTTL('invalid')).toThrow(
        'Invalid TTL format',
      );
    });
  });

  describe('cleanupExpiredData', () => {
    it('should call cleanup function', async () => {
      const mockResult = {
        expired_sessions: 5,
        expired_tokens: 0,
        expired_verifications: 3,
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockResult] });

      const result = await authService.cleanupExpiredData();

      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM cleanup_expired_auth_data()',
      );
    });
  });
});
