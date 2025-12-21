import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notification/notificationService';
import { NotificationResponse, PagedResponse } from '../types/api';

// Query keys for cache management
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unreadOnly?: boolean) => [...notificationKeys.all, 'list', unreadOnly ?? false] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch paginated notifications using infinite query
 */
export function useNotifications(unreadOnly: boolean = false) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: ({ pageParam = 0 }) =>
      notificationService.getNotifications({
        page: pageParam,
        size: 20,
        unreadOnly,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.page + 1;
    },
  });
}

/**
 * Hook to fetch simple notifications (non-paginated first page)
 */
export function useNotificationsSimple(unreadOnly: boolean = false) {
  return useQuery({
    queryKey: [...notificationKeys.list(unreadOnly), 'simple'],
    queryFn: () => notificationService.getNotifications({ page: 0, size: 50, unreadOnly }),
  });
}

/**
 * Hook to fetch unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch notification stats
 */
export function useNotificationStats() {
  return useQuery({
    queryKey: notificationKeys.stats(),
    queryFn: () => notificationService.getStats(),
  });
}

/**
 * Hook to invalidate notification caches
 */
export function useInvalidateNotifications() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    invalidateList: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(true) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(false) });
    },
    invalidateUnreadCount: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() }),
  };
}

/**
 * Hook for marking a notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Utility function to add a notification to the cache from WebSocket
 */
export function addNotificationToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  notification: NotificationResponse
) {
  // Update the list cache
  queryClient.setQueryData<{ pages: PagedResponse<NotificationResponse>[] }>(
    notificationKeys.list(false),
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page, index) => {
          if (index === 0) {
            return {
              ...page,
              content: [notification, ...page.content],
              totalElements: page.totalElements + 1,
            };
          }
          return page;
        }),
      };
    }
  );

  // Update unread count
  queryClient.setQueryData<number>(notificationKeys.unreadCount(), (old) => (old ?? 0) + 1);
}
