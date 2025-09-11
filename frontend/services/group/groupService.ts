import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';

// Group DTOs matching backend
export interface GroupCreationRequest {
  groupName: string;
  description: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  maxMembers?: number;
}

export interface GroupSummaryResponse {
  id: number;
  groupName: string;
  description?: string;
  groupPictureUrl?: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  creatorUsername: string;
  memberCount: number;
  maxMembers?: number;
  isActive: boolean;
  totalMessages: number;
  lastMessageAt?: string;
  createdAt: string;
  isUserMember: boolean;
}

export interface GroupDetailResponse extends GroupSummaryResponse {
  updatedAt: string;
  userRole?: string;
}

export interface GroupMemberResponse {
  id: number;
  username: string;
  displayName?: string;
  email: string;
  profilePictureUrl?: string;
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  joinedAt: string;
  lastActivityAt?: string;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
}

export class GroupService extends BaseApiService {
  constructor() {
    super(''); // Group endpoints use the root API path
  }

  /**
   * Create a new group
   */
  async createGroup(groupData: GroupCreationRequest): Promise<GroupDetailResponse> {
    return this.post<GroupDetailResponse>(API_ENDPOINTS.GROUP_CREATE, groupData);
  }

  /**
   * Get public groups for discovery
   */
  async getPublicGroups(): Promise<GroupSummaryResponse[]> {
    return this.get<GroupSummaryResponse[]>(API_ENDPOINTS.GROUP_PUBLIC);
  }

  /**
   * Get current user's groups
   */
  async getMyGroups(): Promise<GroupSummaryResponse[]> {
    return this.get<GroupSummaryResponse[]>(API_ENDPOINTS.GROUP_MY_GROUPS);
  }

  /**
   * Search groups by name or description
   */
  async searchGroups(query: string): Promise<GroupSummaryResponse[]> {
    return this.get<GroupSummaryResponse[]>(API_ENDPOINTS.GROUP_SEARCH, {
      params: { q: query }
    });
  }

  /**
   * Get group details by ID
   */
  async getGroupById(id: number): Promise<GroupDetailResponse> {
    return this.get<GroupDetailResponse>(API_ENDPOINTS.GROUP_BY_ID(id));
  }

  /**
   * Check if group name is available
   */
  async isGroupNameAvailable(groupName: string): Promise<boolean> {
    return this.get<boolean>(API_ENDPOINTS.GROUP_CHECK_NAME, {
      params: { groupName }
    });
  }

  /**
   * Get group members by group ID
   */
  async getGroupMembers(groupId: number): Promise<GroupMemberResponse[]> {
    return this.get<GroupMemberResponse[]>(API_ENDPOINTS.GROUP_MEMBERS(groupId));
  }
}

// Export singleton instance
export const groupService = new GroupService();