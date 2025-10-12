import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import authService, {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from '../services/AuthService';
import guestService, {
  GuestUser,
  GuestSession,
} from '../services/GuestService';
import { debugLog, errorLog } from '../utils/logger';

export interface AuthContextType {
  // Authentication state
  user: User | null;
  guestUser: GuestUser | null;
  isAuthenticated: boolean;
  isGuestAuthenticated: boolean;
  hasAnyAuth: boolean;
  isLoading: boolean;
  isInitializing: boolean;

  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;

  // Guest methods
  createGuestSession: () => Promise<void>;
  convertGuestToUser: (userData: any) => Promise<void>;
  revokeGuestSession: () => Promise<void>;

  // User management
  updateProfile: (data: Partial<User>) => Promise<void>;
  getActiveSessions: () => Promise<any[]>;
  revokeSession: (sessionId: string) => Promise<void>;

  // Password management
  requestPasswordReset: (email: string, captchaToken?: string) => Promise<void>;

  // Utility methods
  checkPermission: (permission: string, resource?: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCreatingGuestSession, setIsCreatingGuestSession] = useState(false);

  // Memoize authentication state to prevent excessive re-checks
  const isAuthenticated = useMemo(() => !!user && authService.isAuthenticated(), [user]);
  const isGuestAuthenticated = useMemo(() => guestService.isGuestAuthenticated(), [guestUser]);
  const hasAnyAuth = useMemo(() => isAuthenticated || isGuestAuthenticated, [isAuthenticated, isGuestAuthenticated]);

  // ==============================================
  // INITIALIZATION
  // ==============================================

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsInitializing(true);

      // Initialize auth services
      await Promise.all([authService.initialize(), guestService.initialize()]);

      if (authService.isAuthenticated()) {
        // Try to get user profile
        try {
          const userProfile = await authService.getProfile();
          setUser(userProfile);
        } catch (error) {
          errorLog('Failed to get user profile:', error);
          // If profile fetch fails, clear auth state
          await authService.logout();
          setUser(null);
        }
      }

      // Set guest user if guest session exists
      if (guestService.isGuestAuthenticated()) {
        const guest = guestService.getGuestUser();
        setGuestUser(guest);
        // Only log occasionally to avoid console spam
        if (__DEV__ && Math.random() < 0.1) {
          debugLog('🔐 AuthContext: Restored guest session from storage');
        }
      } else {
        // If no authentication exists, create a guest session automatically
        // This ensures the app works even if users bypass the Welcome screen
        // Only log occasionally to avoid console spam
        if (__DEV__ && Math.random() < 0.1) {
          debugLog('🔐 AuthContext: No authentication found, creating guest session...');
        }
        try {
          await createGuestSession();
        } catch (error) {
          errorLog('Failed to create automatic guest session:', error);
          // Continue without guest session - API service will handle this gracefully
        }
      }
    } catch (error) {
      errorLog('Auth initialization error:', error);
      setUser(null);
      setGuestUser(null);
    } finally {
      setIsInitializing(false);
    }
  };

  // ==============================================
  // AUTHENTICATION METHODS
  // ==============================================

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);

      // Add device info to credentials
      const credentialsWithDevice = {
        ...credentials,
        deviceInfo: authService.getDeviceInfo(),
      };

      const authResponse = await authService.login(credentialsWithDevice);
      setUser(authResponse.user);
    } catch (error) {
      errorLog('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);

      // Add device info to registration data
      const userDataWithDevice = {
        ...userData,
        deviceInfo: authService.getDeviceInfo(),
      };

      const authResponse = await authService.register(userDataWithDevice);
      setUser(authResponse.user);
    } catch (error) {
      errorLog('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);

      // Also clear guest session if exists
      if (guestService.isGuestAuthenticated()) {
        await guestService.revokeSession();
        setGuestUser(null);
      }
    } catch (error) {
      errorLog('Logout error:', error);
      // Even if logout fails on server, clear local state
      setUser(null);
      setGuestUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================================
  // GUEST METHODS
  // ==============================================

  const createGuestSession = async () => {
    // Prevent duplicate guest session creation
    if (isCreatingGuestSession) {
      // Only log occasionally to avoid console spam
      if (__DEV__ && Math.random() < 0.1) {
        debugLog(
          '🔐 AuthContext: Guest session creation already in progress, skipping...',
        );
      }
      return;
    }

    // If we already have a valid guest session, don't create another one
    if (guestService.isGuestAuthenticated()) {
      // Only log occasionally to avoid console spam
      if (__DEV__ && Math.random() < 0.1) {
        debugLog(
          '🔐 AuthContext: Valid guest session already exists, skipping creation',
        );
      }
      const guest = guestService.getGuestUser();
      if (guest) {
        setGuestUser(guest);
      }
      return;
    }

    try {
      setIsCreatingGuestSession(true);
      setIsLoading(true);
      const guestSession = await guestService.createGuestSession();
      setGuestUser(guestSession.guestUser);
      // Only log occasionally to avoid console spam
      if (__DEV__ && Math.random() < 0.1) {
        debugLog('🔐 AuthContext: Guest session created and set');
      }
    } catch (error) {
      errorLog('Create guest session error:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsCreatingGuestSession(false);
    }
  };

  const convertGuestToUser = async (userData: any) => {
    try {
      setIsLoading(true);
      const result = await guestService.convertToUser(userData);

      // Clear guest state
      setGuestUser(null);

      // The user would need to login after conversion
      return result;
    } catch (error) {
      errorLog('Convert guest to user error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeGuestSession = async () => {
    try {
      setIsLoading(true);
      await guestService.revokeSession();
      setGuestUser(null);
    } catch (error) {
      errorLog('Revoke guest session error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokens = async () => {
    try {
      await authService.refreshTokens();

      // Update user profile after token refresh
      if (authService.isAuthenticated()) {
        const userProfile = await authService.getProfile();
        setUser(userProfile);
      }
    } catch (error) {
      errorLog('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  // ==============================================
  // USER MANAGEMENT
  // ==============================================

  const updateProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true);

      // Make API call to update profile
      // This would be implemented when the backend endpoint is ready
      // Removed excessive logging

      // Update local user state
      if (user) {
        setUser({ ...user, ...data });
      }
    } catch (error) {
      errorLog('Update profile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveSessions = async () => {
    try {
      return await authService.getActiveSessions();
    } catch (error) {
      errorLog('Get sessions error:', error);
      throw error;
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await authService.revokeSession(sessionId);
    } catch (error) {
      errorLog('Revoke session error:', error);
      throw error;
    }
  };

  // ==============================================
  // PASSWORD MANAGEMENT
  // ==============================================

  const requestPasswordReset = async (email: string, captchaToken?: string) => {
    try {
      await authService.requestPasswordReset(email, captchaToken);
    } catch (error) {
      errorLog('Password reset request error:', error);
      throw error;
    }
  };

  // ==============================================
  // PERMISSION CHECKING
  // ==============================================

  const checkPermission = (permission: string, resource?: string): boolean => {
    // Check user permissions first
    if (user && user.permissions) {
      // Check for exact permission
      if (user.permissions.includes(permission)) {
        return true;
      }

      // Check for resource-specific permission
      if (resource) {
        const resourcePermission = `${permission}:${resource}`;
        if (user.permissions.includes(resourcePermission)) {
          return true;
        }
      }
    }

    // Check guest permissions if no user auth
    if (!user && guestUser) {
      return guestService.hasGuestPermission(permission, resource);
    }

    return false;
  };

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) {
      return false;
    }

    return user.roles.includes(role);
  };

  // ==============================================
  // CONTEXT VALUE
  // ==============================================

  const contextValue: AuthContextType = {
    // Authentication state
    user,
    guestUser,
    isAuthenticated,
    isGuestAuthenticated,
    hasAnyAuth,
    isLoading,
    isInitializing,

    // Authentication methods
    login,
    register,
    logout,
    refreshTokens,

    // Guest methods
    createGuestSession,
    convertGuestToUser,
    revokeGuestSession,

    // User management
    updateProfile,
    getActiveSessions,
    revokeSession,

    // Password management
    requestPasswordReset,

    // Utility methods
    checkPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// ==============================================
// HOOKS
// ==============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for checking specific permissions
export const usePermission = (
  permission: string,
  resource?: string,
): boolean => {
  const { checkPermission } = useAuth();
  return checkPermission(permission, resource);
};

// Hook for checking specific roles
export const useRole = (role: string): boolean => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

// Hook for checking if user can manage entities
export const useEntityPermission = (
  permission: string,
  entityId?: string,
): boolean => {
  const { checkPermission } = useAuth();

  // Check global permission first
  if (checkPermission(permission)) {
    return true;
  }

  // Check resource-specific permission
  if (checkPermission(permission, 'entity')) {
    return true;
  }

  // Additional entity-specific checks would go here
  // For now, return false for entity-specific permissions
  return false;
};

export default AuthContext;
