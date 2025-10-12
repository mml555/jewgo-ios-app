import AsyncStorage from '@react-native-async-storage/async-storage';
import { configService } from '../config/ConfigService';
import { warnLog, errorLog, debugLog } from '../utils/logger';

// Optional DeviceInfo import to prevent crashes
let DeviceInfo: any = null;
try {
  DeviceInfo = require('react-native-device-info');
} catch (error) {
  warnLog('DeviceInfo not available, using fallback values');
}

export interface GuestUser {
  id: string;
  type: 'guest';
  sessionId: string;
}

export interface GuestSession {
  sessionToken: string;
  expiresAt: string;
  guestUser: GuestUser;
  permissions: Array<{
    name: string;
    resource: string;
  }>;
}

export interface DeviceInfo {
  platform: string;
  model?: string;
  osVersion?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
}

class GuestService {
  private readonly GUEST_TOKEN_KEY = '@jewgo_guest_token';
  private readonly GUEST_SESSION_KEY = '@jewgo_guest_session';
  private guestSession: GuestSession | null = null;
  private isCreatingSession: boolean = false;
  private creationPromise: Promise<GuestSession> | null = null;

  // ==============================================
  // INITIALIZATION
  // ==============================================

  async initialize(): Promise<void> {
    try {
      const storedToken = await AsyncStorage.getItem(this.GUEST_TOKEN_KEY);
      const storedSession = await AsyncStorage.getItem(this.GUEST_SESSION_KEY);

      if (storedToken && storedSession) {
        const session = JSON.parse(storedSession);

        // Check if session is still valid
        if (new Date(session.expiresAt) > new Date()) {
          this.guestSession = session;
          // Only log occasionally to avoid console spam
          if (__DEV__ && Math.random() < 0.01) {
            debugLog('🔐 GuestService: Restored valid session from storage');
          }
          return;
        }

        // Session invalid or expired, clear it
        await this.clearGuestSession();
      }
    } catch (error) {
      errorLog('Guest service initialization error:', error);
      await this.clearGuestSession();
    }
  }

  // ==============================================
  // GUEST SESSION MANAGEMENT
  // ==============================================

  async createGuestSession(retryCount: number = 0): Promise<GuestSession> {
    // If already creating a session, return the existing promise
    if (this.isCreatingSession && this.creationPromise) {
      // Only log occasionally to avoid console spam
      if (__DEV__ && Math.random() < 0.01) {
        debugLog(
          '🔐 GuestService: Session creation already in progress, waiting...',
        );
      }
      return this.creationPromise;
    }

    // If we already have a valid session, return it
    if (
      this.guestSession &&
      new Date(this.guestSession.expiresAt) > new Date()
    ) {
      // Only log occasionally to avoid console spam
      if (__DEV__ && Math.random() < 0.01) {
        debugLog('🔐 GuestService: Using existing valid session');
      }
      return this.guestSession;
    }

    // Create new session with retry logic
    this.isCreatingSession = true;
    this.creationPromise = this._createGuestSessionWithRetry(retryCount);

    try {
      const session = await this.creationPromise;
      return session;
    } finally {
      this.isCreatingSession = false;
      this.creationPromise = null;
    }
  }

  private async _createGuestSessionWithRetry(
    retryCount: number = 0,
    maxRetries: number = 3,
  ): Promise<GuestSession> {
    try {
      // Only log occasionally to avoid console spam
      if (__DEV__ && Math.random() < 0.1) {
        debugLog(
          '🔐 GuestService: Creating guest session... (attempt ' +
            (retryCount + 1) +
            ')',
        );
      }
      const deviceInfo = await this.getDeviceInfo();
      // Removed excessive logging

      // Use config service for API URL
      const config = configService.getConfig();
      const apiUrl = config.apiBaseUrl;
      // Removed excessive logging

      const response = await fetch(`${apiUrl}/guest/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceInfo }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // If rate limited and we have retries left, wait and retry
        if (response.status === 429 && retryCount < maxRetries) {
          const retryAfter = errorData.retryAfter || 60;
          const backoffDelay = Math.min(
            retryAfter * 1000,
            Math.pow(2, retryCount) * 1000,
          );

          warnLog(
            `🔐 GuestService: Rate limited, retrying in ${
              backoffDelay / 1000
            }s...`,
          );

          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return this._createGuestSessionWithRetry(retryCount + 1, maxRetries);
        }

        errorLog('🔐 GuestService: API Error:', errorData);
        throw new Error(errorData.error || 'Failed to create guest session');
      }

      const data = await response.json();
      // Removed excessive logging
      const guestSession = data.data;

      // Store guest session
      await AsyncStorage.setItem(
        this.GUEST_TOKEN_KEY,
        guestSession.sessionToken,
      );
      await AsyncStorage.setItem(
        this.GUEST_SESSION_KEY,
        JSON.stringify(guestSession),
      );

      this.guestSession = guestSession;
      // Only log occasionally to avoid console spam
      if (__DEV__ && Math.random() < 0.1) {
        debugLog(
          '🔐 GuestService: Guest session created successfully:',
          guestSession.guestUser.id,
        );
      }
      return guestSession;
    } catch (error: any) {
      // Only retry on network errors, not on other errors
      if (
        retryCount < maxRetries &&
        error.message?.includes('Network request failed')
      ) {
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        warnLog(
          `🔐 GuestService: Network error, retrying in ${
            backoffDelay / 1000
          }s...`,
        );

        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this._createGuestSessionWithRetry(retryCount + 1, maxRetries);
      }

      errorLog('🔐 GuestService: Create guest session error:', error);
      throw error;
    }
  }

  async validateSession(token: string): Promise<boolean> {
    try {
      const config = configService.getConfig();
      const apiUrl = config.apiBaseUrl;
      const response = await fetch(`${apiUrl}/guest/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Token': token,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      errorLog('Validate guest session error:', error);
      return false;
    }
  }

  async extendSession(additionalHours: number = 24): Promise<boolean> {
    try {
      const token = await this.getGuestToken();
      if (!token) {
        return false;
      }

      const config = configService.getConfig();
      const apiUrl = config.apiBaseUrl;
      const response = await fetch(`${apiUrl}/guest/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Token': token,
        },
        body: JSON.stringify({ additionalHours }),
      });

      return response.ok;
    } catch (error) {
      errorLog('Extend guest session error:', error);
      return false;
    }
  }

  async revokeSession(): Promise<void> {
    try {
      const token = await this.getGuestToken();
      if (token) {
        const config = configService.getConfig();
        const apiUrl = config.apiBaseUrl;
        await fetch(`${apiUrl}/guest/revoke`, {
          method: 'DELETE',
          headers: {
            'X-Guest-Token': token,
          },
        });
      }
    } catch (error) {
      errorLog('Revoke guest session error:', error);
    } finally {
      await this.clearGuestSession();
    }
  }

  async clearGuestSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.GUEST_TOKEN_KEY);
      await AsyncStorage.removeItem(this.GUEST_SESSION_KEY);
      this.guestSession = null;
    } catch (error) {
      errorLog('Clear guest session error:', error);
    }
  }

  // ==============================================
  // GUEST STATE
  // ==============================================

  isGuestAuthenticated(): boolean {
    const isAuthenticated = (
      this.guestSession !== null &&
      new Date(this.guestSession.expiresAt) > new Date()
    );
    // Removed excessive logging that was causing memory issues
    return isAuthenticated;
  }

  getGuestUser(): GuestUser | null {
    return this.guestSession?.guestUser || null;
  }

  getGuestPermissions(): Array<{ name: string; resource: string }> {
    return this.guestSession?.permissions || [];
  }

  async getGuestToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(this.GUEST_TOKEN_KEY);
      // Only log occasionally to avoid console spam (1% of the time)
      if (__DEV__ && Math.random() < 0.01) {
        debugLog(
          '🔍 GuestService: getGuestToken - retrieved token:',
          token ? 'present' : 'missing',
        );
      }
      return token;
    } catch (error) {
      errorLog('Get guest token error:', error);
      return null;
    }
  }

  hasGuestPermission(permission: string, resource?: string): boolean {
    const permissions = this.getGuestPermissions();

    return permissions.some(p => {
      if (p.name === permission) {
        return !resource || p.resource === resource;
      }
      return false;
    });
  }

  // ==============================================
  // GUEST TO USER CONVERSION
  // ==============================================

  async convertToUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<any> {
    try {
      const token = await this.getGuestToken();
      if (!token) {
        throw new Error('No guest session found');
      }

      const config = configService.getConfig();
      const apiUrl = config.apiBaseUrl;
      const response = await fetch(`${apiUrl}/guest/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Token': token,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert guest to user');
      }

      const data = await response.json();

      // Clear guest session after conversion
      await this.clearGuestSession();

      return data;
    } catch (error) {
      errorLog('Convert guest to user error:', error);
      throw error;
    }
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      // Try to get device info, but provide fallback for any errors
      let platform = 'ios';
      let model = 'simulator';
      let systemVersion = '17.0';

      if (DeviceInfo) {
        try {
          platform = DeviceInfo.getPlatform();
          model = await DeviceInfo.getModel();
          systemVersion = await DeviceInfo.getSystemVersion();
        } catch (deviceError) {
          debugLog('DeviceInfo not available, using fallback values');
        }
      } else {
        debugLog('DeviceInfo not available, using fallback values');
      }

      return {
        platform,
        model,
        osVersion: systemVersion,
        screenResolution: '390x844', // iPhone 16 resolution
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          'America/New_York',
        language: 'en-US',
      };
    } catch (error) {
      errorLog('Get device info error:', error);
      // Complete fallback device info
      return {
        platform: 'ios',
        model: 'simulator',
        osVersion: '17.0',
        screenResolution: '390x844',
        timezone: 'America/New_York',
        language: 'en-US',
      };
    }
  }

  // ==============================================
  // API HELPERS
  // ==============================================

  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const token = await this.getGuestToken();

    if (!token) {
      throw new Error('No guest session available');
    }

    const headers = {
      ...options.headers,
      'X-Guest-Token': token,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  getAuthHeaders(): Record<string, string> {
    return {};
  }

  async getAuthHeadersAsync(): Promise<Record<string, string>> {
    const token = await this.getGuestToken();
    // Only log occasionally to avoid console spam (1% of the time)
    if (__DEV__ && Math.random() < 0.01) {
      debugLog(
        '🔍 GuestService: getAuthHeadersAsync - token:',
        token ? 'present' : 'missing',
      );
    }
    return token ? { 'X-Guest-Token': token } : {};
  }
}

export default new GuestService();
