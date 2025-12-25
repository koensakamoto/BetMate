import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';
import { PagedResponse } from '../../types/api';
import { getContentType } from '../../utils/fileUtils';

// React Native FormData file type
interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

// Group DTOs matching backend
export interface MemberPreview {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export interface GroupCreationRequest {
  groupName: string;
  description: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET';
  maxMembers?: number;
}

export interface GroupUpdateRequest {
  groupName?: string;
  description?: string;
  privacy?: 'PUBLIC' | 'PRIVATE' | 'SECRET';
  maxMembers?: number;
}

export interface GroupSummaryResponse {
  id: number;
  groupName: string;
  description?: string;
  groupPictureUrl?: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'SECRET';
  ownerUsername: string;
  memberCount: number;
  maxMembers?: number;
  isActive: boolean;
  totalMessages: number;
  lastMessageAt?: string;
  createdAt: string;
  isUserMember: boolean;
  memberPreviews?: MemberPreview[];
}

export interface GroupDetailResponse extends GroupSummaryResponse {
  updatedAt: string;
  userRole?: string;
  userMembershipStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'LEFT';
}

export interface GroupMemberResponse {
  id: number;
  username: string;
  displayName?: string;
  email: string;
  profileImageUrl?: string;
  role: 'MEMBER' | 'ADMIN';
  isActive: boolean;
  joinedAt: string;
  lastActivityAt?: string;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
}

export interface PendingRequestResponse {
  requestId: number;
  userId: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  requestedAt: string;
}

export interface JoinGroupResponse {
  membershipId: number;
  status: 'APPROVED' | 'PENDING';
  message: string;
}

export interface InviteTokenResponse {
  token: string;
  groupId: number;
  groupName: string;
  expiresAt?: string;
  maxUses?: number;
  useCount: number;
  createdAt: string;
}

export interface InviteValidationResponse {
  valid: boolean;
  reason?: 'EXPIRED' | 'MAX_USES_REACHED' | 'REVOKED' | 'INVALID';
  groupId?: number;
  groupName?: string;
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
   * Get public groups for discovery (paginated)
   */
  async getPublicGroups(params?: { page?: number; size?: number }): Promise<PagedResponse<GroupSummaryResponse>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 0));
    queryParams.append('size', String(params?.size ?? 20));
    return this.get<PagedResponse<GroupSummaryResponse>>(`${API_ENDPOINTS.GROUP_PUBLIC}?${queryParams}`);
  }

  /**
   * Get current user's groups (paginated)
   */
  async getMyGroups(params?: { page?: number; size?: number }): Promise<PagedResponse<GroupSummaryResponse>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 0));
    queryParams.append('size', String(params?.size ?? 20));
    return this.get<PagedResponse<GroupSummaryResponse>>(`${API_ENDPOINTS.GROUP_MY_GROUPS}?${queryParams}`);
  }

  /**
   * Search groups by name or description (paginated)
   */
  async searchGroups(query: string, params?: { page?: number; size?: number }): Promise<PagedResponse<GroupSummaryResponse>> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    queryParams.append('page', String(params?.page ?? 0));
    queryParams.append('size', String(params?.size ?? 20));
    return this.get<PagedResponse<GroupSummaryResponse>>(`${API_ENDPOINTS.GROUP_SEARCH}?${queryParams}`);
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
   * Update group information
   */
  async updateGroup(groupId: number, updateData: GroupUpdateRequest): Promise<GroupDetailResponse> {
    return this.put<GroupDetailResponse>(API_ENDPOINTS.GROUP_UPDATE(groupId), updateData);
  }

  /**
   * Delete a group
   */
  async deleteGroup(groupId: number): Promise<void> {
    return this.delete(`/groups/${groupId}`);
  }

  /**
   * Get group members by group ID
   */
  async getGroupMembers(groupId: number): Promise<GroupMemberResponse[]> {
    return this.get<GroupMemberResponse[]>(API_ENDPOINTS.GROUP_MEMBERS(groupId));
  }

  /**
   * Remove a member from the group
   */
  async removeMember(groupId: number, memberId: number): Promise<void> {
    return this.delete(`/groups/${groupId}/members/${memberId}`);
  }

  /**
   * Update a member's role in the group
   */
  async updateMemberRole(groupId: number, memberId: number, newRole: 'MEMBER' | 'ADMIN'): Promise<GroupMemberResponse> {
    return this.put<GroupMemberResponse>(`/groups/${groupId}/members/${memberId}/role`, { role: newRole });
  }

  /**
   * Upload group picture
   */
  async uploadGroupPicture(groupId: number, imageUri: string, fileName: string): Promise<GroupDetailResponse> {
    const formData = new FormData();

    // Create file object for the image
    const fileToUpload: FormDataFile = {
      uri: imageUri,
      type: getContentType(fileName),
      name: fileName
    };

    formData.append('file', fileToUpload as unknown as Blob);

    return this.post<GroupDetailResponse>(
      API_ENDPOINTS.GROUP_PICTURE(groupId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    );
  }

  /**
   * Get all pending join requests for a group (admin only)
   */
  async getPendingRequests(groupId: number): Promise<PendingRequestResponse[]> {
    return this.get<PendingRequestResponse[]>(API_ENDPOINTS.GROUP_PENDING_REQUESTS(groupId));
  }

  /**
   * Get count of pending join requests for a group (admin only)
   */
  async getPendingRequestCount(groupId: number): Promise<number> {
    return this.get<number>(API_ENDPOINTS.GROUP_PENDING_REQUESTS_COUNT(groupId));
  }

  /**
   * Approve a pending join request (admin only)
   */
  async approvePendingRequest(groupId: number, requestId: number): Promise<void> {
    return this.post<void>(API_ENDPOINTS.GROUP_APPROVE_REQUEST(groupId, requestId), {});
  }

  /**
   * Deny/reject a pending join request (admin only)
   */
  async denyPendingRequest(groupId: number, requestId: number): Promise<void> {
    return this.post<void>(API_ENDPOINTS.GROUP_DENY_REQUEST(groupId, requestId), {});
  }

  /**
   * Join a group
   * For PUBLIC groups, user joins immediately.
   * For PRIVATE and SECRET groups, creates a pending request.
   */
  async joinGroup(groupId: number): Promise<JoinGroupResponse> {
    return this.post<JoinGroupResponse>(API_ENDPOINTS.GROUP_JOIN(groupId), {});
  }

  /**
   * Leave a group
   * The current user leaves the specified group.
   * Admins can only leave if there is another admin in the group.
   */
  async leaveGroup(groupId: number): Promise<{ message: string; groupId: string }> {
    return this.post<{ message: string; groupId: string }>(API_ENDPOINTS.GROUP_LEAVE(groupId), {});
  }

  /**
   * Invite a user to the group by username
   * Permissions:
   * - PUBLIC groups: Any active member can invite
   * - PRIVATE groups: Only admins can invite
   */
  async inviteUser(groupId: number, username: string): Promise<GroupMemberResponse> {
    return this.post<GroupMemberResponse>(API_ENDPOINTS.GROUP_INVITE(groupId), { username });
  }

  /**
   * Accept a group invitation
   */
  async acceptInvitation(membershipId: number): Promise<GroupMemberResponse> {
    return this.post<GroupMemberResponse>(API_ENDPOINTS.GROUP_ACCEPT_INVITATION(membershipId), {});
  }

  /**
   * Reject a group invitation
   */
  async rejectInvitation(membershipId: number): Promise<void> {
    return this.post<void>(API_ENDPOINTS.GROUP_REJECT_INVITATION(membershipId), {});
  }

  /**
   * Transfer group ownership to another member.
   * Only the current owner can transfer ownership.
   */
  async transferOwnership(groupId: number, newOwnerId: number): Promise<{ message: string; newOwnerId: string; newOwnerUsername: string }> {
    return this.post<{ message: string; newOwnerId: string; newOwnerUsername: string }>(
      `/groups/${groupId}/transfer-ownership`,
      { newOwnerId }
    );
  }

  /**
   * Create an invite token for a group.
   * Returns a token that can be shared to allow others to join.
   */
  async createInviteToken(groupId: number): Promise<InviteTokenResponse> {
    return this.post<InviteTokenResponse>(API_ENDPOINTS.GROUP_CREATE_INVITE_TOKEN(groupId), {});
  }

  /**
   * Validate an invite token.
   * Can be called without authentication to check if token is valid.
   */
  async validateInviteToken(token: string): Promise<InviteValidationResponse> {
    return this.get<InviteValidationResponse>(API_ENDPOINTS.GROUP_VALIDATE_INVITE_TOKEN(token));
  }

  /**
   * Accept an invite token and join the group.
   * Allows joining private groups directly via invite link.
   */
  async acceptInviteToken(token: string): Promise<JoinGroupResponse> {
    return this.post<JoinGroupResponse>(API_ENDPOINTS.GROUP_ACCEPT_INVITE_TOKEN(token), {});
  }
}

// Export singleton instance
export const groupService = new GroupService();