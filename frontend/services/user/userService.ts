import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';
import { ApiResponse } from '../../types/api';
import { apiClient } from '../api/baseClient';

// React Native FormData file type (not officially typed by RN)
interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

// User DTOs matching backend
export interface UserProfileUpdateRequest {
  firstName: string;
  lastName: string;
  bio?: string;
}

export interface UserProfileResponse {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt?: string;
  lastLoginAt?: string;
  isActive?: boolean;
  active?: boolean; // Backend returns "active" not "isActive"
  totalCredits?: number;
  totalWins?: number;
  totalLosses?: number;
  winRate?: number;
  groupMembershipCount?: number;
  // Fields for limited/private profile responses
  isPrivate?: boolean;
  private?: boolean; // Backend returns "private" not "isPrivate"
  message?: string;
}

export interface UserSearchResult {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isActive: boolean;
}

export interface UserStatistics {
  winCount: number;
  lossCount: number;
  currentStreak: number;
  longestStreak: number;
  activeBets: number;
  winRate: number;
  totalGames: number;
}

export type ProfileVisibility = 'PUBLIC' | 'PRIVATE';

export interface ProfileVisibilityResponse {
  visibility: ProfileVisibility;
}

// Username change DTOs
export interface UsernameChangeRequest {
  newUsername: string;
}

export interface UsernameChangeResponse {
  success: boolean;
  message: string;
  newUsername: string | null;
}

// Email change DTOs
export interface EmailChangeRequest {
  newEmail: string;
  currentPassword: string;
}

export interface EmailChangeConfirmRequest {
  token: string;
}

export interface EmailChangeResponse {
  success: boolean;
  message: string;
  email: string | null;
}

export interface EmailChangeValidationResponse {
  valid: boolean;
  pendingEmail?: string;
  message?: string;
}

export interface UsernameAvailabilityResponse {
  available: boolean;
  errorMessage: string | null;
}

export class UserService extends BaseApiService {
  constructor() {
    super(''); // User endpoints use the root API path
  }

  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<UserProfileResponse> {
    return this.get<UserProfileResponse>(API_ENDPOINTS.USER_PROFILE);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(profileData: UserProfileUpdateRequest): Promise<UserProfileResponse> {
    return this.put<UserProfileResponse>(
      API_ENDPOINTS.USER_PROFILE,
      profileData
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserProfileResponse> {
    return this.get<UserProfileResponse>(API_ENDPOINTS.USER_BY_ID(id));
  }

  /**
   * Search users by name
   */
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    return this.get<UserSearchResult[]>(API_ENDPOINTS.USER_SEARCH, {
      params: { q: query }
    });
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(id: number): Promise<UserStatistics> {
    return this.get<UserStatistics>(API_ENDPOINTS.USER_STATS(id));
  }

  /**
   * Get current user's statistics
   */
  async getCurrentUserStatistics(): Promise<UserStatistics> {
    const profile = await this.getCurrentUserProfile();
    return this.getUserStatistics(profile.id);
  }

  /**
   * Export user data as JSON string
   * Returns the raw JSON data for download
   */
  async exportUserData(): Promise<string> {
    const response = await apiClient.get(API_ENDPOINTS.USER_DATA_EXPORT, {
      responseType: 'arraybuffer',
    });
    // Convert arraybuffer to string
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(response.data);
  }

  /**
   * Get current user's profile visibility setting
   */
  async getProfileVisibility(): Promise<ProfileVisibilityResponse> {
    return this.get<ProfileVisibilityResponse>(API_ENDPOINTS.USER_PROFILE_VISIBILITY);
  }

  /**
   * Update current user's profile visibility setting
   */
  async updateProfileVisibility(visibility: ProfileVisibility): Promise<ProfileVisibilityResponse> {
    return this.put<ProfileVisibilityResponse>(
      API_ENDPOINTS.USER_PROFILE_VISIBILITY,
      { visibility }
    );
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(imageUri: string, fileName: string): Promise<UserProfileResponse> {
    // Determine content type from file extension
    const getContentType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const typeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      return typeMap[ext || ''] || 'image/jpeg';
    };

    const formData = new FormData();

    // Create file object from image URI for React Native
    const file: FormDataFile = {
      uri: imageUri,
      type: getContentType(fileName),
      name: fileName,
    };

    // FormData.append expects Blob | string, but React Native accepts the file object
    formData.append('file', file as unknown as Blob);

    return this.post<UserProfileResponse>(
      API_ENDPOINTS.USER_PROFILE_PICTURE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  // ==========================================
  // USERNAME & EMAIL CHANGES
  // ==========================================

  /**
   * Check if a username is available
   */
  async checkUsernameAvailability(username: string): Promise<UsernameAvailabilityResponse> {
    return this.get<UsernameAvailabilityResponse>(API_ENDPOINTS.USER_USERNAME_AVAILABILITY(username));
  }

  /**
   * Change current user's username
   */
  async changeUsername(newUsername: string): Promise<UsernameChangeResponse> {
    return this.put<UsernameChangeResponse>(
      API_ENDPOINTS.USER_PROFILE_USERNAME,
      { newUsername }
    );
  }

  /**
   * Request email change - sends verification email to new address
   */
  async requestEmailChange(newEmail: string, currentPassword: string): Promise<EmailChangeResponse> {
    return this.post<EmailChangeResponse>(
      API_ENDPOINTS.USER_PROFILE_EMAIL_REQUEST,
      { newEmail, currentPassword }
    );
  }

  /**
   * Confirm email change with verification token
   */
  async confirmEmailChange(token: string): Promise<EmailChangeResponse> {
    return this.post<EmailChangeResponse>(
      API_ENDPOINTS.USER_PROFILE_EMAIL_CONFIRM,
      { token }
    );
  }

  /**
   * Validate email change token
   */
  async validateEmailChangeToken(token: string): Promise<EmailChangeValidationResponse> {
    return this.get<EmailChangeValidationResponse>(
      API_ENDPOINTS.USER_PROFILE_EMAIL_VALIDATE,
      { params: { token } }
    );
  }
}

// Export singleton instance
export const userService = new UserService();