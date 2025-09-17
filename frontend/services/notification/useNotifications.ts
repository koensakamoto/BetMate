import { useState, useEffect, useCallback } from 'react';
import { notificationService } from './notificationService';
import {
  NotificationResponse,
  NotificationStats,
  PagedResponse
} from '../../types/api';

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

interface UseNotificationsReturn {
  notifications: NotificationResponse[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  unreadCount: number;
  stats: NotificationStats | null;

  // Actions
  loadNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: NotificationResponse) => void;

  // Filters
  setUnreadOnly: (unreadOnly: boolean) => void;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    pageSize = 20,
    unreadOnly: initialUnreadOnly = false
  } = options;

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(initialUnreadOnly);

  // Load notifications
  const loadNotifications = useCallback(async (page = 0, reset = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationService.getNotifications({
        page,
        size: pageSize,
        unreadOnly
      });

      // Handle case where response might not have expected structure
      let content = response?.content || [];

      // Filter out any invalid notifications (missing required fields)
      // Note: Backend sends 'message' field, not 'content'
      content = content.filter(notification =>
        notification &&
        notification.id &&
        (notification.title || notification.message || notification.content)
      );

      const isLast = response?.last !== false; // default to true if undefined

      if (reset) {
        setNotifications(content);
      } else {
        setNotifications(prev => {
          const existing = prev || [];
          // Avoid duplicates when paginating
          const existingIds = new Set(existing.map(n => n.id));
          const newNotifications = content.filter(n => !existingIds.has(n.id));
          return [...existing, ...newNotifications];
        });
      }

      setHasMore(!isLast);
      setCurrentPage(page);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize, unreadOnly]);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadNotifications(currentPage + 1, false);
  }, [hasMore, loading, currentPage, loadNotifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await loadNotifications(0, true);
  }, [loadNotifications]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count || 0); // Default to 0 if undefined
    } catch (err) {
      console.error('Error loading unread count:', err);
      setUnreadCount(0); // Set to 0 on error
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const statistics = await notificationService.getStats();
      setStats(statistics || null); // Keep as null if undefined
    } catch (err) {
      console.error('Error loading notification stats:', err);
      setStats(null); // Set to null on error
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );

      // Update unread count
      setUnreadCount(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification: NotificationResponse) => {
    setNotifications(prev => [notification, ...prev]);

    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Handle filter change
  const handleSetUnreadOnly = useCallback((newUnreadOnly: boolean) => {
    setUnreadOnly(newUnreadOnly);
  }, []);

  // Load initial data
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    loadStats();
  }, [loadNotifications, loadUnreadCount, loadStats]);

  // Reload when filter changes
  useEffect(() => {
    loadNotifications(0, true);
  }, [unreadOnly, loadNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadUnreadCount();
      // Only refresh if on first page to avoid disrupting user's reading
      if (currentPage === 0) {
        refresh();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, currentPage, loadUnreadCount, refresh]);

  return {
    notifications,
    loading,
    error,
    hasMore,
    unreadCount,
    stats,

    // Actions
    loadNotifications: () => loadNotifications(0, true),
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    addNotification,

    // Filters
    setUnreadOnly: handleSetUnreadOnly
  };
}