import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';
import { ApiResponse } from '../../types/api';

// User DTOs matching backend
export interface UserProfileUpdateRequest {
  firstName: string;
  lastName: string;
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
  totalCredits?: number;
  totalWins?: number;
  totalLosses?: number;
  winRate?: number;
  groupMembershipCount?: number;
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
  userId: number;
  totalCredits: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalBets: number;
  activeBets: number;
  groupMembershipCount: number;
  rank?: number;
  achievements?: string[];
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
}

// Export singleton instance
export const userService = new UserService();