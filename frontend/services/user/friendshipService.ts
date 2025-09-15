import { BaseApiService } from '../api/baseService';
import { UserSearchResult } from './userService';

// Friendship DTOs matching backend
export interface FriendshipRequest {
  friendshipId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  acceptedAt?: string;
  user: UserSearchResult;
  isRequester: boolean;
}

export interface FriendshipStatus {
  friendshipStatus: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  areFriends: boolean;
  hasPendingRequest: boolean;
}

export class FriendshipService extends BaseApiService {
  constructor() {
    super('/friendships');
  }

  /**
   * Send a friend request to another user
   */
  async sendFriendRequest(userId: number): Promise<{ success: boolean; message: string; friendshipId?: number }> {
    return this.post<{ success: boolean; message: string; friendshipId?: number }>(`/request/${userId}`);
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(friendshipId: number): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(`/${friendshipId}/accept`);
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(friendshipId: number): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(`/${friendshipId}/reject`);
  }

  /**
   * Remove a friend (unfriend)
   */
  async removeFriend(friendId: number): Promise<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(`/remove/${friendId}`);
  }

  /**
   * Get all friends for the current user
   */
  async getFriends(searchTerm?: string): Promise<UserSearchResult[]> {
    const params = searchTerm ? { search: searchTerm } : undefined;
    return this.get<UserSearchResult[]>('/friends', { params });
  }

  /**
   * Get friends count for the current user
   */
  async getFriendsCount(): Promise<{ friendsCount: number }> {
    return this.get<{ friendsCount: number }>('/friends/count');
  }

  /**
   * Get mutual friends with another user
   */
  async getMutualFriends(userId: number): Promise<UserSearchResult[]> {
    return this.get<UserSearchResult[]>(`/mutual/${userId}`);
  }

  /**
   * Get mutual friends count with another user
   */
  async getMutualFriendsCount(userId: number): Promise<{ mutualFriendsCount: number }> {
    return this.get<{ mutualFriendsCount: number }>(`/mutual/${userId}/count`);
  }

  /**
   * Get pending friend requests sent by the current user
   */
  async getPendingRequestsSent(): Promise<FriendshipRequest[]> {
    return this.get<FriendshipRequest[]>('/requests/sent');
  }

  /**
   * Get pending friend requests received by the current user
   */
  async getPendingRequestsReceived(): Promise<FriendshipRequest[]> {
    return this.get<FriendshipRequest[]>('/requests/received');
  }

  /**
   * Get count of pending friend requests received
   */
  async getPendingRequestsReceivedCount(): Promise<{ pendingRequestsCount: number }> {
    return this.get<{ pendingRequestsCount: number }>('/requests/received/count');
  }

  /**
   * Get friendship status with another user
   */
  async getFriendshipStatus(userId: number): Promise<FriendshipStatus> {
    return this.get<FriendshipStatus>(`/status/${userId}`);
  }

  /**
   * Check multiple friendship statuses at once
   */
  async getMultipleFriendshipStatuses(userIds: number[]): Promise<Map<number, FriendshipStatus>> {
    const statusMap = new Map<number, FriendshipStatus>();

    // Make parallel requests for all user IDs
    const promises = userIds.map(async (userId) => {
      try {
        const status = await this.getFriendshipStatus(userId);
        return { userId, status };
      } catch (error) {
        // If there's an error, assume no relationship
        return {
          userId,
          status: {
            friendshipStatus: 'NONE' as const,
            areFriends: false,
            hasPendingRequest: false
          }
        };
      }
    });

    const results = await Promise.all(promises);
    results.forEach(({ userId, status }) => {
      statusMap.set(userId, status);
    });

    return statusMap;
  }

  /**
   * Convert friendship status to simple friend request status for UI
   */
  static getFriendRequestStatus(status: FriendshipStatus): 'none' | 'pending_sent' | 'pending_received' | 'friends' {
    if (status.areFriends) {
      return 'friends';
    }

    if (status.hasPendingRequest) {
      // For now, we'll assume all pending requests are sent by current user
      // In a more complex implementation, we'd need to check who sent the request
      return 'pending_sent';
    }

    return 'none';
  }

  /**
   * Get friend request status for a user (simplified for UI)
   */
  async getFriendRequestStatus(userId: number): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'> {
    try {
      const status = await this.getFriendshipStatus(userId);
      return FriendshipService.getFriendRequestStatus(status);
    } catch (error) {
      return 'none';
    }
  }
}

// Export singleton instance
export const friendshipService = new FriendshipService();