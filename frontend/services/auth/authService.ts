import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';
import { tokenStorage } from '../api/baseClient';
import { ApiResponse } from '../../types/api';

// Auth DTOs matching backend
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface GoogleAuthRequest {
  idToken: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export interface AppleAuthRequest {
  identityToken: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  user: UserProfileResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfileResponse {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  // Additional fields from backend
  totalCredits?: number;
  totalWins?: number;
  totalLosses?: number;
  winRate?: number;
  groupMembershipCount?: number;
}

export class AuthService extends BaseApiService {
  constructor() {
    super(''); // Auth endpoints use the root API path
  }

  /**
   * Login user and store tokens
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 [AuthService] Login attempt starting...', {
      usernameOrEmail: credentials.usernameOrEmail,
      endpoint: API_ENDPOINTS.LOGIN
    });

    try {
      console.log('🔐 [AuthService] Sending login request to backend...');
      const response = await this.post<LoginResponse>(
        API_ENDPOINTS.LOGIN,
        credentials
      );

      console.log('✅ [AuthService] Login successful! Response:', {
        userId: response.user?.id,
        username: response.user?.username,
        hasAccessToken: !!response.accessToken,
        hasRefreshToken: !!response.refreshToken,
        expiresIn: response.expiresIn,
        userCredits: response.user?.totalCredits
      });

      // Store tokens securely
      console.log('💾 [AuthService] Storing tokens...');
      await tokenStorage.setTokens(
        response.accessToken,
        response.refreshToken
      );
      console.log('✅ [AuthService] Tokens stored successfully');

      return response;
    } catch (error) {
      console.error('❌ [AuthService] Login failed:', error);
      // Clear any existing tokens on login failure
      await tokenStorage.clearTokens();
      throw error;
    }
  }

  /**
   * Register new user
   */
  async signup(userData: SignupRequest): Promise<LoginResponse> {
    try {
      // First, register the user (returns UserProfileResponseDto)
      const registerResponse = await this.post<UserProfileResponse>(
        API_ENDPOINTS.REGISTER,
        userData
      );

      // Then automatically login to get tokens
      const loginResponse = await this.login({
        usernameOrEmail: userData.email,
        password: userData.password
      });

      return loginResponse;
    } catch (error) {
      // Clear any existing tokens on signup failure
      await tokenStorage.clearTokens();
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfileResponse> {
    return this.get<UserProfileResponse>(API_ENDPOINTS.ME);
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenResponse> {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.post<TokenResponse>(
        API_ENDPOINTS.REFRESH,
        { refreshToken }
      );

      // Update stored tokens
      await tokenStorage.setTokens(
        response.accessToken,
        response.refreshToken
      );

      return response;
    } catch (error) {
      // If refresh fails, clear all tokens
      await this.logout();
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwords: ChangePasswordRequest): Promise<void> {
    return this.post<void>(
      API_ENDPOINTS.CHANGE_PASSWORD,
      passwords
    );
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint (optional for JWT)
      await this.post<void>(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Continue with logout even if backend call fails
      console.warn('Backend logout failed:', error);
    } finally {
      // Always clear local tokens
      await tokenStorage.clearTokens();
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    console.log(`🔍 [AuthService] Checking if user is authenticated...`);
    const accessToken = await tokenStorage.getAccessToken();
    console.log(`🔍 [AuthService] Access token check:`, {
      hasToken: !!accessToken,
      tokenLength: accessToken ? accessToken.length : 0,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'null'
    });
    return !!accessToken;
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(googleData: GoogleAuthRequest): Promise<LoginResponse> {
    console.log('🔐 [AuthService] Google login attempt starting...', {
      email: googleData.email,
    });

    try {
      const response = await this.post<LoginResponse>(
        '/auth/google',
        googleData
      );

      console.log('✅ [AuthService] Google login successful!', {
        userId: response.user?.id,
        username: response.user?.username,
      });

      // Store tokens securely
      await tokenStorage.setTokens(
        response.accessToken,
        response.refreshToken
      );

      return response;
    } catch (error) {
      console.error('❌ [AuthService] Google login failed:', error);
      await tokenStorage.clearTokens();
      throw error;
    }
  }

  /**
   * Login with Apple OAuth
   */
  async loginWithApple(appleData: AppleAuthRequest): Promise<LoginResponse> {
    console.log('🔐 [AuthService] Apple login attempt starting...', {
      userId: appleData.userId,
      email: appleData.email,
    });

    try {
      const response = await this.post<LoginResponse>(
        '/auth/apple',
        appleData
      );

      console.log('✅ [AuthService] Apple login successful!', {
        userId: response.user?.id,
        username: response.user?.username,
      });

      // Store tokens securely
      await tokenStorage.setTokens(
        response.accessToken,
        response.refreshToken
      );

      return response;
    } catch (error) {
      console.error('❌ [AuthService] Apple login failed:', error);
      await tokenStorage.clearTokens();
      throw error;
    }
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(email: string): Promise<void> {
    return this.post<void>(
      '/auth/forgot-password', // Assuming this endpoint exists
      { email }
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.post<void>(
      '/auth/reset-password',
      { token, newPassword }
    );
  }

  /**
   * Validate password reset token
   */
  async validateResetToken(token: string): Promise<boolean> {
    const response = await this.get<boolean>(`/auth/reset-password/validate?token=${token}`);
    return response;
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();