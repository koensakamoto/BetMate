import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  friendshipService,
  FriendDto,
  FriendRequestDto,
  FriendshipStatusResponse,
} from '../services/friendship/friendshipService';

// Query keys for cache management
export const friendshipKeys = {
  all: ['friendship'] as const,
  friends: () => [...friendshipKeys.all, 'list'] as const,
  friendsCount: () => [...friendshipKeys.all, 'count'] as const,
  friendsSearch: (query: string) => [...friendshipKeys.all, 'search', query] as const,
  status: (userId: number) => [...friendshipKeys.all, 'status', userId] as const,
  pendingSent: () => [...friendshipKeys.all, 'pendingSent'] as const,
  pendingReceived: () => [...friendshipKeys.all, 'pendingReceived'] as const,
  pendingCount: () => [...friendshipKeys.all, 'pendingCount'] as const,
  mutualFriends: (userId: number) => [...friendshipKeys.all, 'mutual', userId] as const,
  mutualFriendsCount: (userId: number) => [...friendshipKeys.all, 'mutualCount', userId] as const,
};

/**
 * Hook to fetch user's friends list
 */
export function useFriends() {
  return useQuery({
    queryKey: friendshipKeys.friends(),
    queryFn: () => friendshipService.getFriends(),
  });
}

/**
 * Hook to fetch friends count
 */
export function useFriendsCount() {
  return useQuery({
    queryKey: friendshipKeys.friendsCount(),
    queryFn: () => friendshipService.getFriendsCount(),
  });
}

/**
 * Hook to search friends
 */
export function useSearchFriends(query: string) {
  return useQuery({
    queryKey: friendshipKeys.friendsSearch(query),
    queryFn: () => friendshipService.searchFriends(query),
    enabled: query.length > 0,
  });
}

/**
 * Hook to get friendship status with a user
 */
export function useFriendshipStatus(userId: number | undefined) {
  return useQuery({
    queryKey: friendshipKeys.status(userId!),
    queryFn: () => friendshipService.getFriendshipStatus(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook to fetch pending requests sent
 */
export function usePendingRequestsSent() {
  return useQuery({
    queryKey: friendshipKeys.pendingSent(),
    queryFn: () => friendshipService.getPendingRequestsSent(),
  });
}

/**
 * Hook to fetch pending requests received
 */
export function usePendingRequestsReceived() {
  return useQuery({
    queryKey: friendshipKeys.pendingReceived(),
    queryFn: () => friendshipService.getPendingRequestsReceived(),
  });
}

/**
 * Hook to fetch pending requests count
 */
export function usePendingRequestsCount() {
  return useQuery({
    queryKey: friendshipKeys.pendingCount(),
    queryFn: () => friendshipService.getPendingRequestsCount(),
  });
}

/**
 * Hook to fetch mutual friends with a user
 */
export function useMutualFriends(userId: number | undefined) {
  return useQuery({
    queryKey: friendshipKeys.mutualFriends(userId!),
    queryFn: () => friendshipService.getMutualFriends(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook to fetch mutual friends count
 */
export function useMutualFriendsCount(userId: number | undefined) {
  return useQuery({
    queryKey: friendshipKeys.mutualFriendsCount(userId!),
    queryFn: () => friendshipService.getMutualFriendsCount(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook to invalidate friendship caches
 */
export function useInvalidateFriendship() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: friendshipKeys.all }),
    invalidateFriends: () => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friends() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friendsCount() });
    },
    invalidatePending: () => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.pendingSent() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.pendingReceived() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.pendingCount() });
    },
    invalidateStatus: (userId: number) => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.status(userId) });
    },
  };
}

/**
 * Hook for sending a friend request
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accepterId: number) => friendshipService.sendFriendRequest(accepterId),
    onSuccess: (_, accepterId) => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.pendingSent() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.status(accepterId) });
    },
  });
}

/**
 * Hook for accepting a friend request
 */
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendshipId, requesterId }: { friendshipId: number; requesterId: number }) =>
      friendshipService.acceptFriendRequest(friendshipId),
    onSuccess: (_, { requesterId }) => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friends() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friendsCount() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.pendingReceived() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.pendingCount() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.status(requesterId) });
    },
  });
}

/**
 * Hook for rejecting a friend request
 */
export function useRejectFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendshipId, requesterId }: { friendshipId: number; requesterId: number }) =>
      friendshipService.rejectFriendRequest(friendshipId),
    onSuccess: (_, { requesterId }) => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.pendingReceived() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.pendingCount() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.status(requesterId) });
    },
  });
}

/**
 * Hook for removing a friend
 */
export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: number) => friendshipService.removeFriend(friendId),
    onSuccess: (_, friendId) => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friends() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.friendsCount() });
      queryClient.invalidateQueries({ queryKey: friendshipKeys.status(friendId) });
    },
  });
}
