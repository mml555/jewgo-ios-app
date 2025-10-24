import { safeAsyncStorage } from './SafeAsyncStorage';
import { configService } from '../config/ConfigService';
import { debugLog, errorLog } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  status: string;
  roles: string[];
  permissions: string[];
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  captchaToken?: string;
  deviceInfo?: DeviceInfo;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  captchaToken?: string;
  deviceInfo?: DeviceInfo;
}

export interface GoogleOAuthData {
  idToken: string;
  deviceInfo?: DeviceInfo;
}

export interface MagicLinkData {
  email: string;
  purpose?: 'login' | 'register';
}

export interface DeviceInfo {
  platform: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  tokens: AuthTokens;
  session: {
    id: string;
    expiresAt: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

class AuthService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor() {
    this.baseUrl = configService.getConfig().apiBaseUrl;
  }

  // ==============================================
  // INITIALIZATION
  // ==============================================

  async initialize(): Promise<void> {
    try {
      // Load stored tokens
      const storedTokens = await this.getStoredTokens();
      if (storedTokens) {
        this.accessToken = storedTokens.accessToken;
        this.refreshToken = storedTokens.refreshToken;

        // Verify token is still valid (with timeout)
        try {
          const isValid = await Promise.race([
            this.verifyToken(),
            new Promise<boolean>((_, reject) =>
              setTimeout(
                () => reject(new Error('Token verification timeout')),
                5000,
              ),
            ),
          ]);

          if (!isValid) {
            await this.clearStoredTokens();
            this.accessToken = null;
            this.refreshToken = null;
          }
        } catch (error) {
          // If verification times out or fails, clear tokens and continue
          errorLog('Token verification failed:', error);
          await this.clearStoredTokens();
          this.accessToken = null;
          this.refreshToken = null;
        }
      }
    } catch (error) {
      errorLog('Auth service initialization error:', error);
      await this.clearStoredTokens();
    }
  }

  // ==============================================
  // AUTHENTICATION METHODS
  // ==============================================

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.data) {
        await this.setTokens(response.data.tokens);
        return response.data;
      }

      throw new Error(response.error || 'Login failed');
    } catch (error) {
      errorLog('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      debugLog('📝 Registering user with data:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        hasPhone: !!userData.phoneNumber,
        hasCaptcha: !!userData.captchaToken,
      });

      const response = await this.makeRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      debugLog('📝 Registration response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        code: response.code,
      });

      if (response.success && response.data) {
        await this.setTokens(response.data.tokens);
        return response.data;
      }

      throw new Error(response.error || 'Registration failed');
    } catch (error) {
      errorLog('❌ Registration error in AuthService:', error);
      errorLog('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });
      }
    } catch (error) {
      errorLog('Logout error:', error);
    } finally {
      await this.clearStoredTokens();
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  async googleOAuth(data: GoogleOAuthData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success && response.data) {
        await this.setTokens(response.data.tokens);
        return response.data;
      }

      throw new Error(response.error || 'Google OAuth failed');
    } catch (error) {
      errorLog('Google OAuth error:', error);
      throw error;
    }
  }

  async sendMagicLink(
    data: MagicLinkData,
  ): Promise<{ success: boolean; message: string; expiresAt: string }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        message: string;
        expiresAt: string;
      }>('/auth/magic-link/send', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to send magic link');
    } catch (error) {
      errorLog('Magic link sending error:', error);
      throw error;
    }
  }

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<AuthResponse>(
        '/auth/magic-link/verify',
        {
          method: 'POST',
          body: JSON.stringify({ token }),
        },
      );

      if (response.success && response.data) {
        await this.setTokens(response.data.tokens);
        return response.data;
      }

      throw new Error(response.error || 'Magic link verification failed');
    } catch (error) {
      errorLog('Magic link verification error:', error);
      throw error;
    }
  }

  async refreshTokens(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<AuthTokens> {
    try {
      const response = await this.makeRequest<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.success && response.data) {
        await this.setTokens(response.data.tokens);
        return response.data.tokens;
      }

      throw new Error(response.error || 'Token refresh failed');
    } catch (error) {
      // If refresh fails, clear stored tokens
      await this.clearStoredTokens();
      this.accessToken = null;
      this.refreshToken = null;
      throw error;
    }
  }

  // ==============================================
  // USER MANAGEMENT
  // ==============================================

  async getProfile(): Promise<User> {
    const response = await this.authenticatedRequest<{ user: User }>(
      '/auth/me',
    );

    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.error || 'Failed to get profile');
  }

  async getActiveSessions(): Promise<any[]> {
    const response = await this.authenticatedRequest<{ sessions: any[] }>(
      '/auth/sessions',
    );

    if (response.success && response.data) {
      return response.data.sessions;
    }

    throw new Error(response.error || 'Failed to get sessions');
  }

  async revokeSession(sessionId: string): Promise<void> {
    const response = await this.authenticatedRequest(
      `/auth/sessions/${sessionId}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to revoke session');
    }
  }

  // ==============================================
  // PASSWORD MANAGEMENT
  // ==============================================

  async requestPasswordReset(
    email: string,
    captchaToken?: string,
  ): Promise<void> {
    const response = await this.makeRequest('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email, captchaToken }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to request password reset');
    }
  }

  // ==============================================
  // TOKEN MANAGEMENT
  // ==============================================

  async setTokens(tokens: AuthTokens): Promise<void> {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;

    // Store tokens securely
    await safeAsyncStorage.setJSON('auth_tokens', tokens);
  }

  async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      return await safeAsyncStorage.getJSON<AuthTokens>('auth_tokens');
    } catch (error) {
      errorLog('Error retrieving stored tokens:', error);
      return null;
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.accessToken) {
      return {};
    }

    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async clearStoredTokens(): Promise<void> {
    try {
      await safeAsyncStorage.removeItem('auth_tokens');
    } catch (error) {
      errorLog('Error clearing stored tokens:', error);
    }
  }

  async verifyToken(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    try {
      const response = await this.makeRequest('/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return response.success;
    } catch (error) {
      return false;
    }
  }

  // ==============================================
  // AUTHENTICATION STATE
  // ==============================================

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  // ==============================================
  // HTTP REQUEST METHODS
  // ==============================================

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          code: data.code,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        errorLog(`Request timeout for ${endpoint}`);
        return {
          success: false,
          error: 'Request timeout',
        };
      }
      errorLog(`Request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    // Try the request with current token
    let response = await this.makeRequest<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    // If token is expired, try to refresh
    if (!response.success && response.code === 'AUTH_FAILED') {
      try {
        await this.refreshTokens();

        // Retry with new token
        response = await this.makeRequest<T>(endpoint, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${this.accessToken}`,
          },
        });
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        await this.clearStoredTokens();
        this.accessToken = null;
        this.refreshToken = null;
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  }

  // ==============================================
  // DEVICE INFO
  // ==============================================

  getDeviceInfo(): DeviceInfo {
    const { Platform } = require('react-native');
    const { getVersion } = require('react-native-device-info');

    return {
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: getVersion(),
    };
  }

  // ==============================================
  // HEALTH CHECK
  // ==============================================

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/auth/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
