import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  groupService,
  GroupSummaryResponse,
  GroupDetailResponse,
  GroupMemberResponse,
  PendingRequestResponse,
  GroupUpdateRequest
} from '../services/group/groupService';
import { PagedResponse } from '../types/api';

// Query keys for cache management
export const groupKeys = {
  all: ['groups'] as const,
  myGroups: () => [...groupKeys.all, 'my'] as const,
  publicGroups: () => [...groupKeys.all, 'public'] as const,
  detail: (id: number) => [...groupKeys.all, 'detail', id] as const,
  search: (query: string) => [...groupKeys.all, 'search', query] as const,
  members: (groupId: number) => [...groupKeys.all, 'members', groupId] as const,
  pendingRequests: (groupId: number) => [...groupKeys.all, 'pendingRequests', groupId] as const,
  pendingRequestCount: (groupId: number) => [...groupKeys.all, 'pendingRequestCount', groupId] as const,
};

// Cache configuration - prevents unnecessary refetches on tab switches
const GROUP_LIST_STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to fetch user's groups (paginated with infinite scroll)
 */
export function useMyGroups() {
  return useInfiniteQuery({
    queryKey: groupKeys.myGroups(),
    queryFn: ({ pageParam = 0 }) => groupService.getMyGroups({ page: pageParam, size: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.page + 1;
    },
    staleTime: GROUP_LIST_STALE_TIME,
  });
}

/**
 * Hook to fetch public groups (paginated with infinite scroll)
 */
export function usePublicGroups() {
  return useInfiniteQuery({
    queryKey: groupKeys.publicGroups(),
    queryFn: ({ pageParam = 0 }) => groupService.getPublicGroups({ page: pageParam, size: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.page + 1;
    },
    staleTime: GROUP_LIST_STALE_TIME,
  });
}

/**
 * Hook to fetch a single group by ID
 * Uses initialData from the list cache for instant loading
 */
export function useGroup(groupId: number | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: groupKeys.detail(groupId!),
    queryFn: () => groupService.getGroupById(groupId!),
    enabled: !!groupId,
    // Try to get initial data from the list caches for instant loading
    initialData: () => {
      if (!groupId) return undefined;

      // Check myGroups cache first (now paginated)
      const myGroupsData = queryClient.getQueryData<{ pages: PagedResponse<GroupSummaryResponse>[] }>(groupKeys.myGroups());
      if (myGroupsData?.pages) {
        for (const page of myGroupsData.pages) {
          const found = page.content.find(g => g.id === groupId);
          if (found) return found as GroupDetailResponse;
        }
      }

      // Check publicGroups cache (now paginated)
      const publicGroupsData = queryClient.getQueryData<{ pages: PagedResponse<GroupSummaryResponse>[] }>(groupKeys.publicGroups());
      if (publicGroupsData?.pages) {
        for (const page of publicGroupsData.pages) {
          const found = page.content.find(g => g.id === groupId);
          if (found) return found as GroupDetailResponse;
        }
      }

      return undefined;
    },
    // Mark initial data as stale so we refetch in background
    initialDataUpdatedAt: 0,
  });
}

/**
 * Hook to search groups (paginated with infinite scroll)
 */
export function useSearchGroups(query: string) {
  return useInfiniteQuery({
    queryKey: groupKeys.search(query),
    queryFn: ({ pageParam = 0 }) => groupService.searchGroups(query, { page: pageParam, size: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.page + 1;
    },
    enabled: query.length > 0,
    staleTime: GROUP_LIST_STALE_TIME,
  });
}

/**
 * Hook to invalidate group caches after mutations
 */
export function useInvalidateGroups() {
  const queryClient = useQueryClient();

  return {
    // Invalidate all group data
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }),

    // Invalidate just user's groups
    invalidateMyGroups: () => queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() }),

    // Invalidate public groups
    invalidatePublicGroups: () => queryClient.invalidateQueries({ queryKey: groupKeys.publicGroups() }),

    // Invalidate a specific group
    invalidateGroup: (id: number) => queryClient.invalidateQueries({ queryKey: groupKeys.detail(id) }),

    // Invalidate after joining/leaving (affects both lists and detail)
    invalidateAfterMembershipChange: (groupId: number) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
      queryClient.invalidateQueries({ queryKey: groupKeys.publicGroups() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  };
}

/**
 * Hook for joining a group
 */
export function useJoinGroup() {
  const { invalidateAfterMembershipChange } = useInvalidateGroups();

  return useMutation({
    mutationFn: (groupId: number) => groupService.joinGroup(groupId),
    onSuccess: (_, groupId) => {
      invalidateAfterMembershipChange(groupId);
    },
  });
}

/**
 * Hook for leaving a group
 */
export function useLeaveGroup() {
  const { invalidateAfterMembershipChange } = useInvalidateGroups();

  return useMutation({
    mutationFn: (groupId: number) => groupService.leaveGroup(groupId),
    onSuccess: (_, groupId) => {
      invalidateAfterMembershipChange(groupId);
    },
  });
}

/**
 * Hook to fetch group members
 */
export function useGroupMembers(groupId: number | undefined) {
  return useQuery({
    queryKey: groupKeys.members(groupId!),
    queryFn: () => groupService.getGroupMembers(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Hook to fetch pending join requests for a group (admin only)
 */
export function usePendingRequests(groupId: number | undefined) {
  return useQuery({
    queryKey: groupKeys.pendingRequests(groupId!),
    queryFn: () => groupService.getPendingRequests(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Hook to fetch pending request count for a group
 */
export function usePendingRequestCount(groupId: number | undefined) {
  return useQuery({
    queryKey: groupKeys.pendingRequestCount(groupId!),
    queryFn: () => groupService.getPendingRequestCount(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Hook for updating a group
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: GroupUpdateRequest }) =>
      groupService.updateGroup(groupId, data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
    },
  });
}

/**
 * Hook for approving a pending request
 */
export function useApprovePendingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, requestId }: { groupId: number; requestId: number }) =>
      groupService.approvePendingRequest(groupId, requestId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.pendingRequests(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.pendingRequestCount(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

/**
 * Hook for denying a pending request
 */
export function useDenyPendingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, requestId }: { groupId: number; requestId: number }) =>
      groupService.denyPendingRequest(groupId, requestId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.pendingRequests(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.pendingRequestCount(groupId) });
    },
  });
}

/**
 * Hook for removing a member from a group
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: number; memberId: number }) =>
      groupService.removeMember(groupId, memberId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

/**
 * Hook for updating a member's role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, memberId, role }: { groupId: number; memberId: number; role: 'MEMBER' | 'ADMIN' }) =>
      groupService.updateMemberRole(groupId, memberId, role),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
    },
  });
}
