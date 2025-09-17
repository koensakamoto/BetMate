import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';
import { UserSearchResult } from '../user/userService';

// Friendship-related interfaces
export interface FriendDto {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isActive: boolean;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface FriendsCountResponse {
  friendsCount: number;
}

export interface FriendRequestDto {
  friendshipId: number;
  status: string;
  createdAt: string;
  acceptedAt?: string;
  user: UserSearchResult;
  isRequester: boolean;
}

export interface FriendshipStatusResponse {
  friendshipStatus: string;
  areFriends: boolean;
  hasPendingRequest: boolean;
}

export interface MutualFriendsCountResponse {
  mutualFriendsCount: number;
}

export interface PendingRequestsCountResponse {
  pendingRequestsCount: number;
}

export class FriendshipService extends BaseApiService {
  constructor() {
    super(''); // Friendship endpoints use the root API path
  }

  /**
   * Get all friends for the current user
   */
  async getFriends(): Promise<FriendDto[]> {
    const userSearchResults = await this.get<UserSearchResult[]>(API_ENDPOINTS.FRIENDS_LIST);

    // Convert UserSearchResult to FriendDto with additional friend-specific fields
    return userSearchResults.map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      isActive: user.isActive,
      bio: undefined, // TODO: Add bio field to backend response if needed
      isOnline: Math.random() > 0.5, // TODO: Replace with actual online status from backend
      lastSeen: Math.random() > 0.5 ? undefined : '2 hours ago' // TODO: Replace with actual last seen from backend
    }));
  }

  /**
   * Search friends by query
   */
  async searchFriends(query: string): Promise<FriendDto[]> {
    const userSearchResults = await this.get<UserSearchResult[]>(API_ENDPOINTS.FRIENDS_LIST, {
      params: { search: query }
    });

    return userSearchResults.map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      isActive: user.isActive,
      bio: undefined,
      isOnline: Math.random() > 0.5,
      lastSeen: Math.random() > 0.5 ? undefined : '2 hours ago'
    }));
  }

  /**
   * Get friends count for the current user
   */
  async getFriendsCount(): Promise<number> {
    const response = await this.get<FriendsCountResponse>(API_ENDPOINTS.FRIENDS_COUNT);
    return response.friendsCount;
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(accepterId: number): Promise<{ success: boolean; message: string; friendshipId?: number }> {
    return this.post(API_ENDPOINTS.FRIEND_REQUEST(accepterId));
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(friendshipId: number): Promise<{ success: boolean; message: string }> {
    return this.post(API_ENDPOINTS.ACCEPT_FRIEND_REQUEST(friendshipId));
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(friendshipId: number): Promise<{ success: boolean; message: string }> {
    return this.post(API_ENDPOINTS.REJECT_FRIEND_REQUEST(friendshipId));
  }

  /**
   * Remove a friend
   */
  async removeFriend(friendId: number): Promise<{ success: boolean; message: string }> {
    return this.delete(API_ENDPOINTS.REMOVE_FRIEND(friendId));
  }

  /**
   * Get friendship status with another user
   */
  async getFriendshipStatus(userId: number): Promise<FriendshipStatusResponse> {
    return this.get<FriendshipStatusResponse>(API_ENDPOINTS.FRIENDSHIP_STATUS(userId));
  }

  /**
   * Get pending friend requests sent by current user
   */
  async getPendingRequestsSent(): Promise<FriendRequestDto[]> {
    return this.get<FriendRequestDto[]>(API_ENDPOINTS.PENDING_REQUESTS_SENT);
  }

  /**
   * Get pending friend requests received by current user
   */
  async getPendingRequestsReceived(): Promise<FriendRequestDto[]> {
    return this.get<FriendRequestDto[]>(API_ENDPOINTS.PENDING_REQUESTS_RECEIVED);
  }

  /**
   * Get count of pending friend requests received
   */
  async getPendingRequestsCount(): Promise<number> {
    const response = await this.get<PendingRequestsCountResponse>(API_ENDPOINTS.PENDING_REQUESTS_COUNT);
    return response.pendingRequestsCount;
  }

  /**
   * Get mutual friends with another user
   */
  async getMutualFriends(userId: number): Promise<FriendDto[]> {
    const userSearchResults = await this.get<UserSearchResult[]>(API_ENDPOINTS.MUTUAL_FRIENDS(userId));

    return userSearchResults.map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      isActive: user.isActive,
      bio: undefined,
      isOnline: Math.random() > 0.5,
      lastSeen: Math.random() > 0.5 ? undefined : '2 hours ago'
    }));
  }

  /**
   * Get mutual friends count with another user
   */
  async getMutualFriendsCount(userId: number): Promise<number> {
    const response = await this.get<MutualFriendsCountResponse>(API_ENDPOINTS.MUTUAL_FRIENDS_COUNT(userId));
    return response.mutualFriendsCount;
  }
}

// Export singleton instance
export const friendshipService = new FriendshipService();