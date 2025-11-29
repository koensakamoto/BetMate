import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Alert } from 'react-native';
import { authService, UserProfileResponse } from '../services/auth/authService';
import { ApiError } from '../services/api/baseClient';
import { errorLog, debugLog } from '../config/env';
import { getErrorMessage, hasResponse } from '../utils/errorUtils';
import { webSocketService } from '../services/messaging/webSocketService';

// Updated User interface to match backend response
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  totalCredits?: number;
  totalWins?: number;
  totalLosses?: number;
  winRate?: number;
  groupMembershipCount?: number;
  // Computed fields for backward compatibility
  name: string; // firstName + lastName or username
  credits: number; // totalCredits or 0
  joinedAt: Date; // parsed createdAt
}

export interface SignupData {
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface GoogleLoginData {
  idToken: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export interface AppleLoginData {
  identityToken: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  loginWithGoogle: (data: GoogleLoginData) => Promise<void>;
  loginWithApple: (data: AppleLoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Transform backend user response to frontend User interface
const transformUser = (userResponse: UserProfileResponse): User => {
  const name = userResponse.firstName && userResponse.lastName
    ? `${userResponse.firstName} ${userResponse.lastName}`
    : userResponse.username;

  return {
    id: userResponse.id,
    username: userResponse.username,
    email: userResponse.email,
    firstName: userResponse.firstName,
    lastName: userResponse.lastName,
    profileImageUrl: userResponse.profileImageUrl,
    createdAt: userResponse.createdAt,
    lastLoginAt: userResponse.lastLoginAt,
    isActive: userResponse.isActive,
    totalCredits: userResponse.totalCredits,
    totalWins: userResponse.totalWins,
    totalLosses: userResponse.totalLosses,
    winRate: userResponse.winRate,
    groupMembershipCount: userResponse.groupMembershipCount,
    // Computed fields
    name,
    credits: userResponse.totalCredits || 0,
    joinedAt: new Date(userResponse.createdAt),
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const isAuthenticated = !!user;

  // Initialize auth state on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAuthError = useCallback((error: unknown): AuthError => {
    debugLog('Auth error:', error);

    if (error instanceof ApiError) {
      return {
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    if (hasResponse(error) && error.response?.data?.message) {
      return {
        message: error.response.data.message,
        statusCode: error.response?.status,
      };
    }

    return {
      message: getErrorMessage(error),
    };
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const isAuth = await authService.isAuthenticated();

      if (isAuth) {
        // Validate session and get user profile
        const userProfile = await authService.getCurrentUser();

        // Check if account is still active
        if (!userProfile.isActive) {
          await authService.logout();
          await webSocketService.disconnect();
          setUser(null);
          Alert.alert(
            'Account Suspended',
            'Your account has been suspended. Please contact support.',
            [{ text: 'OK' }]
          );
          return;
        }

        const transformedUser = transformUser(userProfile);
        setUser(transformedUser);
        debugLog('Auth check successful - user logged in');
      } else {
        setUser(null);
        debugLog('Auth check - no valid session');
      }
    } catch (error) {
      console.error(`💥 [AuthContext] Auth status check failed:`, error);
      errorLog('Auth status check failed:', error);
      setUser(null);
      // Don't set error for initial auth check - user might just not be logged in
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login({
        usernameOrEmail: data.email,
        password: data.password,
      });

      const transformedUser = transformUser(response.user);
      setUser(transformedUser);

      debugLog('Login successful for user:', transformedUser.username);
    } catch (error) {
      const authError = handleAuthError(error);
      setError(authError);
      setUser(null); // Clear user state on login failure
      errorLog('Login failed:', error);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

  const signup = useCallback(async (data: SignupData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.signup({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        username: data.username,
        email: data.email,
        password: data.password,
      });

      const transformedUser = transformUser(response.user);
      setUser(transformedUser);

      debugLog('Signup successful for user:', transformedUser.username);
    } catch (error) {
      const authError = handleAuthError(error);
      setError(authError);
      setUser(null); // Clear user state on signup failure
      errorLog('Signup failed:', error);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

  const loginWithGoogle = useCallback(async (data: GoogleLoginData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.loginWithGoogle({
        idToken: data.idToken,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        profileImageUrl: data.profileImageUrl,
      });

      const transformedUser = transformUser(response.user);
      setUser(transformedUser);

      debugLog('Google login successful for user:', transformedUser.username);
    } catch (error) {
      const authError = handleAuthError(error);
      setError(authError);
      setUser(null);
      errorLog('Google login failed:', error);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

  const loginWithApple = useCallback(async (data: AppleLoginData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.loginWithApple({
        identityToken: data.identityToken,
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      const transformedUser = transformUser(response.user);
      setUser(transformedUser);

      debugLog('Apple login successful for user:', transformedUser.username);
    } catch (error) {
      const authError = handleAuthError(error);
      setError(authError);
      setUser(null);
      errorLog('Apple login failed:', error);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Disconnect WebSocket before logging out
      try {
        await webSocketService.disconnect();
        debugLog('WebSocket disconnected on logout');
      } catch (wsError) {
        errorLog('WebSocket disconnect error (non-critical):', wsError);
      }

      await authService.logout();
      setUser(null);
      setError(null);
      debugLog('Logout successful');
    } catch (error) {
      errorLog('Logout error:', error);
      // Clear user state even if logout API call fails
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.forgotPassword(email);
      debugLog('Password reset email sent for:', email);
    } catch (error) {
      const authError = handleAuthError(error);
      setError(authError);
      errorLog('Forgot password failed:', error);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

  const refreshUser = useCallback(async () => {
    try {
      const userProfile = await authService.getCurrentUser();
      const transformedUser = transformUser(userProfile);
      setUser(transformedUser);
      debugLog('User profile refreshed');
    } catch (error) {
      errorLog('Failed to refresh user profile:', error);
      // If user profile fetch fails, the user might need to re-authenticate
      const authError = handleAuthError(error);
      setError(authError);
      
      // If it's an auth error, clear the user
      if (error instanceof ApiError && error.statusCode === 401) {
        setUser(null);
      }
    }
  }, [handleAuthError]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      
      debugLog('Password changed successfully');
    } catch (error) {
      const authError = handleAuthError(error);
      setError(authError);
      errorLog('Change password failed:', error);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    loginWithGoogle,
    loginWithApple,
    signup,
    logout,
    forgotPassword,
    clearError,
    refreshUser,
    changePassword,
  }), [
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    loginWithGoogle,
    loginWithApple,
    signup,
    logout,
    forgotPassword,
    clearError,
    refreshUser,
    changePassword,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};