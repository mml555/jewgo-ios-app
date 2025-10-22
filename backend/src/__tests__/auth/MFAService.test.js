const { Pool } = require('pg');
const MFAService = require('../../auth/MFAService');
const speakeasy = require('speakeasy');

// Mock database connection
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

// Mock speakeasy
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn(),
  },
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

describe('MFAService', () => {
  let mfaService;
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

    mfaService = new MFAService(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupTOTP', () => {
    it('should setup TOTP for new user', async () => {
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url:
          'otpauth://totp/Jewgo%20App?secret=JBSWY3DPEHPK3PXP&issuer=Jewgo',
      };

      speakeasy.generateSecret.mockReturnValue(mockSecret);
      require('qrcode').toDataURL.mockResolvedValue(
        'data:image/png;base64,test-qr-code',
      );

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // No existing TOTP
        .mockResolvedValueOnce({ rows: [{ id: 'identity-123' }] }) // Get identity
        .mockResolvedValueOnce({ rows: [] }); // Insert credential

      const result = await mfaService.setupTOTP('user-123');

      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrCodeUrl).toBe('data:image/png;base64,test-qr-code');
      expect(result.manualEntryKey).toBe('JBSWY3DPEHPK3PXP');
      expect(mockClient.query).toHaveBeenCalledTimes(4); // BEGIN, check existing, get identity, insert, COMMIT
    });

    it('should return existing TOTP if already set up', async () => {
      const existingMeta = {
        secret: 'JBSWY3DPEHPK3PXP',
        qr_code_url: 'data:image/png;base64,existing-qr-code',
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 'cred-123', meta: existingMeta }],
      }); // Existing TOTP

      const result = await mfaService.setupTOTP('user-123');

      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrCodeUrl).toBe('data:image/png;base64,existing-qr-code');
      expect(mockClient.query).toHaveBeenCalledTimes(1); // Only check existing
    });

    it('should handle database errors', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(mfaService.setupTOTP('user-123')).rejects.toThrow(
        'Database error',
      );
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('verifyTOTP', () => {
    it('should verify valid TOTP token', async () => {
      const mockMeta = {
        secret: 'JBSWY3DPEHPK3PXP',
      };

      speakeasy.totp.verify.mockReturnValue(true);

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ meta: mockMeta }] }) // Get secret
        .mockResolvedValueOnce({ rows: [] }); // Log event

      const result = await mfaService.verifyTOTP('user-123', '123456');

      expect(result).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        token: '123456',
        window: 2,
      });
    });

    it('should reject invalid TOTP token', async () => {
      const mockMeta = {
        secret: 'JBSWY3DPEHPK3PXP',
      };

      speakeasy.totp.verify.mockReturnValue(false);

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ meta: mockMeta }] }) // Get secret
        .mockResolvedValueOnce({ rows: [] }); // Log event

      const result = await mfaService.verifyTOTP('user-123', '000000');

      expect(result).toBe(false);
    });

    it('should throw error if TOTP not set up', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // No TOTP found

      await expect(mfaService.verifyTOTP('user-123', '123456')).rejects.toThrow(
        'TOTP not set up for user',
      );
    });
  });

  describe('disableTOTP', () => {
    it('should disable TOTP', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'cred-123' }] }) // Delete credential
        .mockResolvedValueOnce({ rows: [] }); // Log event

      const result = await mfaService.disableTOTP('user-123');

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN, delete, COMMIT
    });

    it('should return false if TOTP not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // No credential found

      const result = await mfaService.disableTOTP('user-123');

      expect(result).toBe(false);
    });
  });

  describe('isTOTPEnabled', () => {
    it('should return true if TOTP is enabled', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'cred-123' }] });

      const result = await mfaService.isTOTPEnabled('user-123');

      expect(result).toBe(true);
    });

    it('should return false if TOTP is not enabled', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await mfaService.isTOTPEnabled('user-123');

      expect(result).toBe(false);
    });
  });

  describe('generateWebAuthnChallenge', () => {
    it('should generate WebAuthn challenge', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // Insert challenge

      const challenge = await mfaService.generateWebAuthnChallenge(
        'user-123',
        'registration',
      );

      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/); // Base64url format
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO verification_tokens'),
        ['user-123', expect.any(String), 'webauthn_registration'],
      );
    });
  });

  describe('verifyWebAuthnChallenge', () => {
    it('should verify valid challenge', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'token-123' }] }) // Find challenge
        .mockResolvedValueOnce({ rows: [] }); // Mark as used

      const result = await mfaService.verifyWebAuthnChallenge(
        'user-123',
        'valid-challenge',
        'registration',
      );

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid challenge', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // No challenge found

      await expect(
        mfaService.verifyWebAuthnChallenge(
          'user-123',
          'invalid-challenge',
          'registration',
        ),
      ).rejects.toThrow('Invalid or expired WebAuthn challenge');
    });
  });

  describe('registerWebAuthnCredential', () => {
    it('should register WebAuthn credential', async () => {
      const credentialData = {
        credentialId: 'cred-123',
        publicKey: 'public-key-data',
        counter: 0,
        deviceInfo: { platform: 'web' },
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // No existing identity
        .mockResolvedValueOnce({ rows: [{ id: 'identity-123' }] }) // Create identity
        .mockResolvedValueOnce({ rows: [] }); // Insert credential

      const result = await mfaService.registerWebAuthnCredential(
        'user-123',
        credentialData,
      );

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledTimes(4); // BEGIN, check identity, create identity, insert credential, COMMIT
    });

    it('should use existing WebAuthn identity', async () => {
      const credentialData = {
        credentialId: 'cred-123',
        publicKey: 'public-key-data',
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: 'identity-123' }] }) // Existing identity
        .mockResolvedValueOnce({ rows: [] }); // Insert credential

      const result = await mfaService.registerWebAuthnCredential(
        'user-123',
        credentialData,
      );

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledTimes(3); // BEGIN, get identity, insert credential, COMMIT
    });
  });

  describe('authenticateWebAuthn', () => {
    it('should authenticate valid WebAuthn credential', async () => {
      const credentialData = {
        credentialId: 'cred-123',
        counter: 1,
      };

      const mockCredential = {
        public_key: 'public-key-data',
        meta: {
          credentialId: 'cred-123',
          counter: 0,
        },
      };

      // Mock the verifyWebAuthnSignature method
      mfaService.verifyWebAuthnSignature = jest.fn().mockResolvedValue(true);

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockCredential] }) // Find credential
        .mockResolvedValueOnce({ rows: [] }); // Update counter

      const result = await mfaService.authenticateWebAuthn(
        'user-123',
        credentialData,
      );

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    it('should reject invalid WebAuthn credential', async () => {
      const credentialData = {
        credentialId: 'invalid-cred',
      };

      mockClient.query.mockResolvedValueOnce({ rows: [] }); // No credential found

      const result = await mfaService.authenticateWebAuthn(
        'user-123',
        credentialData,
      );

      expect(result).toBe(false);
    });
  });

  describe('getMFAStatus', () => {
    it('should return MFA status', async () => {
      const mockWebAuthnCredentials = [
        { credentialId: 'cred-1', registeredAt: '2024-01-01', deviceInfo: {} },
      ];

      // Mock the methods
      mfaService.isTOTPEnabled = jest.fn().mockResolvedValue(true);
      mfaService.getWebAuthnCredentials = jest
        .fn()
        .mockResolvedValue(mockWebAuthnCredentials);

      const result = await mfaService.getMFAStatus('user-123');

      expect(result).toEqual({
        totpEnabled: true,
        webauthnEnabled: true,
        webauthnCredentials: mockWebAuthnCredentials,
        mfaRequired: true,
      });
    });
  });

  describe('requireMFA', () => {
    it('should require MFA for sensitive operations', async () => {
      mfaService.getMFAStatus = jest.fn().mockResolvedValue({
        mfaRequired: true,
      });

      const result = await mfaService.requireMFA(
        'user-123',
        'sensitive_operation',
      );

      expect(result).toBe(true);
    });

    it('should not require MFA if not enabled', async () => {
      mfaService.getMFAStatus = jest.fn().mockResolvedValue({
        mfaRequired: false,
      });

      const result = await mfaService.requireMFA('user-123', 'login');

      expect(result).toBe(false);
    });
  });

  describe('verifyMFA', () => {
    it('should verify TOTP MFA', async () => {
      mfaService.verifyTOTP = jest.fn().mockResolvedValue(true);

      const mfaData = {
        method: 'totp',
        token: '123456',
      };

      const result = await mfaService.verifyMFA('user-123', mfaData);

      expect(result).toBe(true);
      expect(mfaService.verifyTOTP).toHaveBeenCalledWith('user-123', '123456');
    });

    it('should verify WebAuthn MFA', async () => {
      mfaService.authenticateWebAuthn = jest.fn().mockResolvedValue(true);

      const mfaData = {
        method: 'webauthn',
        credentialData: { credentialId: 'cred-123' },
      };

      const result = await mfaService.verifyMFA('user-123', mfaData);

      expect(result).toBe(true);
      expect(mfaService.authenticateWebAuthn).toHaveBeenCalledWith('user-123', {
        credentialId: 'cred-123',
      });
    });

    it('should throw error for unsupported MFA method', async () => {
      const mfaData = {
        method: 'unsupported',
        token: '123456',
      };

      await expect(mfaService.verifyMFA('user-123', mfaData)).rejects.toThrow(
        'Unsupported MFA method: unsupported',
      );
    });
  });

  describe('generateRecoveryCodes', () => {
    it('should generate recovery codes', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // Insert codes

      const codes = await mfaService.generateRecoveryCodes('user-123');

      expect(codes).toHaveLength(10);
      expect(codes[0]).toMatch(/^[A-F0-9]{8}$/); // 8 hex characters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO verification_tokens'),
        ['user-123', expect.any(String), 'mfa_recovery'],
      );
    });
  });

  describe('verifyRecoveryCode', () => {
    it('should verify valid recovery code', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'token-123' }] }) // Find code
        .mockResolvedValueOnce({ rows: [] }); // Mark as used

      const result = await mfaService.verifyRecoveryCode(
        'user-123',
        'ABCD1234',
      );

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should reject invalid recovery code', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // No code found

      const result = await mfaService.verifyRecoveryCode('user-123', 'INVALID');

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredChallenges', () => {
    it('should cleanup expired challenges', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ deleted_count: 5 }] });

      const result = await mfaService.cleanupExpiredChallenges();

      expect(result).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM verification_tokens'),
      );
    });
  });
});
