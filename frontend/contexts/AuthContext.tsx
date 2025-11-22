import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserProfileResponse } from '../services/auth/authService';
import { ApiError } from '../services/api/baseClient';
import { errorLog, debugLog } from '../config/env';

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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  loginWithGoogle: (data: GoogleLoginData) => Promise<void>;
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

  const clearError = () => {
    setError(null);
  };

  const handleAuthError = (error: any): AuthError => {
    debugLog('Auth error:', error);
    
    if (error instanceof ApiError) {
      return {
        message: error.message,
        statusCode: error.statusCode,
      };
    }
    
    if (error?.response?.data?.message) {
      return {
        message: error.response.data.message,
        statusCode: error.response?.status,
      };
    }
    
    return {
      message: error?.message || 'An unexpected error occurred',
    };
  };

  const checkAuthStatus = async () => {
    try {
      console.log(`🔍 [AuthContext] Starting auth status check...`);
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      const isAuth = await authService.isAuthenticated();
      console.log(`🔍 [AuthContext] isAuthenticated result:`, isAuth);

      if (isAuth) {
        console.log(`🔍 [AuthContext] User appears to be authenticated, fetching profile...`);
        // Validate session and get user profile
        const userProfile = await authService.getCurrentUser();
        console.log(`✅ [AuthContext] User profile fetched:`, {
          id: userProfile.id,
          username: userProfile.username,
          email: userProfile.email,
          fullProfile: userProfile
        });
        const transformedUser = transformUser(userProfile);
        console.log(`✅ [AuthContext] Transformed user:`, {
          id: transformedUser.id,
          username: transformedUser.username,
          email: transformedUser.email,
          name: transformedUser.name
        });
        setUser(transformedUser);
        debugLog('Auth check successful - user logged in');
      } else {
        console.log(`❌ [AuthContext] User is not authenticated`);
        setUser(null);
        debugLog('Auth check - no valid session');
      }
    } catch (error) {
      console.error(`💥 [AuthContext] Auth status check failed:`, error);
      errorLog('Auth status check failed:', error);
      setUser(null);
      // Don't set error for initial auth check - user might just not be logged in
    } finally {
      console.log(`🏁 [AuthContext] Auth check completed. Setting isLoading to false.`);
      setIsLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    console.log('🔐 [AuthContext] Login function called', { email: data.email });
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔐 [AuthContext] Calling authService.login...');

      const response = await authService.login({
        usernameOrEmail: data.email,
        password: data.password,
      });

      console.log('✅ [AuthContext] Login response received:', {
        userId: response.user.id,
        username: response.user.username,
        credits: response.user.totalCredits,
        fullUser: response.user
      });

      const transformedUser = transformUser(response.user);
      console.log('✅ [AuthContext] User transformed, setting user state:', {
        id: transformedUser.id,
        username: transformedUser.username,
        credits: transformedUser.credits
      });
      setUser(transformedUser);
      console.log('✅ [AuthContext] User state updated successfully');

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
  };

  const signup = async (data: SignupData) => {
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
  };

  const loginWithGoogle = async (data: GoogleLoginData) => {
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
  };

  const logout = async () => {
    try {
      setIsLoading(true);
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
  };

  const forgotPassword = async (email: string) => {
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
  };

  const refreshUser = async () => {
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
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
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
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    loginWithGoogle,
    signup,
    logout,
    forgotPassword,
    clearError,
    refreshUser,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};