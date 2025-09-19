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
    try {
      const response = await this.post<LoginResponse>(
        API_ENDPOINTS.LOGIN,
        credentials
      );

      // Store tokens securely
      await tokenStorage.setTokens(
        response.accessToken,
        response.refreshToken
      );

      return response;
    } catch (error) {
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
      '/auth/reset-password', // Assuming this endpoint exists
      { token, password: newPassword }
    );
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