import { useState, useEffect, useCallback, useRef } from 'react';
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
  enabled?: boolean;
}

interface UseNotificationsReturn {
  notifications: NotificationResponse[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  unreadCount: number;
  stats: NotificationStats | null;

  loadNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: NotificationResponse) => void;

  setUnreadOnly: (unreadOnly: boolean) => void;
}

interface CachedData {
  notifications: NotificationResponse[];
  hasMore: boolean;
  currentPage: number;
  loaded: boolean;
  lastFetched: number; // timestamp
}

// Cache TTL in milliseconds (2 minutes)
const CACHE_TTL_MS = 2 * 60 * 1000;

// Module-level cache that persists across component mounts
const globalCache = {
  all: { notifications: [], hasMore: true, currentPage: 0, loaded: false, lastFetched: 0 } as CachedData,
  unread: { notifications: [], hasMore: true, currentPage: 0, loaded: false, lastFetched: 0 } as CachedData,
  unreadCount: 0,
  stats: null as NotificationStats | null,
  metaLoaded: false
};

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    pageSize = 20,
    unreadOnly: initialUnreadOnly = false,
    enabled = true
  } = options;

  const [unreadOnly, setUnreadOnlyState] = useState(initialUnreadOnly);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state that syncs with global cache
  const [unreadCount, setUnreadCount] = useState(globalCache.unreadCount);
  const [stats, setStats] = useState(globalCache.stats);
  const [, forceUpdate] = useState({});

  // Request deduplication refs to prevent concurrent API calls
  const pendingLoadRequest = useRef<Promise<void> | null>(null);
  const pendingCountRequest = useRef<Promise<number> | null>(null);

  // Get current cache key
  const cacheKey = unreadOnly ? 'unread' : 'all';

  // Check if cache is stale
  const isCacheStale = useCallback((cache: CachedData) => {
    if (!cache.loaded) return true;
    return Date.now() - cache.lastFetched > CACHE_TTL_MS;
  }, []);

  // Load notifications (silent = no loading state, for background refresh)
  const loadNotifications = useCallback(async (page = 0, reset = true, forceRefresh = false, silent = false) => {
    const cache = globalCache[cacheKey];

    // Skip if already loaded, not stale, and not forcing refresh
    if (cache.loaded && !forceRefresh && !isCacheStale(cache) && page === 0 && reset) {
      return;
    }

    // Request deduplication: if there's already a pending request, return it
    if (pendingLoadRequest.current && page === 0 && reset) {
      return pendingLoadRequest.current;
    }

    const doLoad = async () => {
      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);

        const response = await notificationService.getNotifications({
          page,
          size: pageSize,
          unreadOnly
        });

        let content = response?.content || [];

        content = content.filter(notification =>
          notification &&
          notification.id &&
          (notification.title || notification.message || notification.content)
        );

        const isLast = response?.last !== false;

        if (reset) {
          globalCache[cacheKey] = {
            notifications: content,
            hasMore: !isLast,
            currentPage: page,
            loaded: true,
            lastFetched: Date.now()
          };
        } else {
          const existingIds = new Set(cache.notifications.map(n => n.id));
          const newNotifications = content.filter(n => !existingIds.has(n.id));
          globalCache[cacheKey] = {
            notifications: [...cache.notifications, ...newNotifications],
            hasMore: !isLast,
            currentPage: page,
            loaded: true,
            lastFetched: Date.now()
          };
        }

        forceUpdate({});

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        if (!silent) {
          setLoading(false);
        }
        pendingLoadRequest.current = null;
      }
    };

    // Only deduplicate initial page loads with reset
    if (page === 0 && reset) {
      pendingLoadRequest.current = doLoad();
      return pendingLoadRequest.current;
    } else {
      return doLoad();
    }
  }, [pageSize, unreadOnly, cacheKey, isCacheStale]);

  // Load more
  const loadMore = useCallback(async () => {
    const cache = globalCache[cacheKey];
    if (!cache.hasMore || loading) return;
    await loadNotifications(cache.currentPage + 1, false);
  }, [cacheKey, loading, loadNotifications]);

  // Refresh (pull-to-refresh)
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications(0, true, true);
      const count = await notificationService.getUnreadCount();
      globalCache.unreadCount = count || 0;
      setUnreadCount(count || 0);
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications]);

  // Load unread count with request deduplication
  const loadUnreadCount = useCallback(async () => {
    // Return existing request if one is pending
    if (pendingCountRequest.current) {
      return pendingCountRequest.current;
    }

    const doFetch = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        globalCache.unreadCount = count || 0;
        setUnreadCount(count || 0);
        return count || 0;
      } catch {
        return globalCache.unreadCount;
      } finally {
        pendingCountRequest.current = null;
      }
    };

    pendingCountRequest.current = doFetch();
    return pendingCountRequest.current;
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const statistics = await notificationService.getStats();
      globalCache.stats = statistics || null;
      setStats(statistics || null);
    } catch {
      // Stats failed to load - continue without them
    }
  }, []);

  // Check staleness and refresh in background if needed
  const checkAndRefreshIfStale = useCallback(async () => {
    const cache = globalCache[cacheKey];

    // Only check if cache exists and is stale
    if (!cache.loaded || !isCacheStale(cache)) {
      return;
    }

    // Fetch current unread count from server
    const serverUnreadCount = await loadUnreadCount();

    // If count differs, do a silent background refresh
    if (serverUnreadCount !== globalCache.unreadCount || isCacheStale(cache)) {
      await loadNotifications(0, true, true, true); // silent refresh
    }
  }, [cacheKey, isCacheStale, loadUnreadCount, loadNotifications]);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);

      // Update both caches
      ['all', 'unread'].forEach(key => {
        globalCache[key as 'all' | 'unread'].notifications =
          globalCache[key as 'all' | 'unread'].notifications.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          );
      });

      globalCache.unreadCount = Math.max(0, globalCache.unreadCount - 1);
      setUnreadCount(globalCache.unreadCount);
      forceUpdate({});

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      throw err;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      ['all', 'unread'].forEach(key => {
        globalCache[key as 'all' | 'unread'].notifications =
          globalCache[key as 'all' | 'unread'].notifications.map(n => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString()
          }));
      });

      globalCache.unreadCount = 0;
      setUnreadCount(0);
      forceUpdate({});

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, []);

  // Add new notification
  const addNotification = useCallback((notification: NotificationResponse) => {
    // Add to all cache
    globalCache.all.notifications = [notification, ...globalCache.all.notifications];

    // Add to unread cache if unread
    if (!notification.isRead) {
      globalCache.unread.notifications = [notification, ...globalCache.unread.notifications];
      globalCache.unreadCount += 1;
      setUnreadCount(globalCache.unreadCount);
    }

    forceUpdate({});
  }, []);

  // Handle filter change
  const setUnreadOnly = useCallback((newUnreadOnly: boolean) => {
    setUnreadOnlyState(newUnreadOnly);
  }, []);

  // On mount: always fetch fresh data to ensure user sees all notifications
  useEffect(() => {
    if (!enabled) return;

    // Always force a fresh fetch when the component mounts
    // This ensures the user sees up-to-date data when opening inbox
    loadNotifications(0, true, true);
  }, [enabled, cacheKey]); // Intentionally exclude loadNotifications to run only on mount/filter change

  // Initial load of unread count and stats (once)
  useEffect(() => {
    if (!enabled || globalCache.metaLoaded) return;
    globalCache.metaLoaded = true;
    loadUnreadCount();
    loadStats();
  }, [enabled, loadUnreadCount, loadStats]);

  // Auto-refresh unread count
  useEffect(() => {
    if (!autoRefresh || !enabled) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, enabled, refreshInterval, loadUnreadCount]);

  const currentCache = globalCache[cacheKey];

  return {
    notifications: currentCache.notifications,
    loading,
    refreshing,
    error,
    hasMore: currentCache.hasMore,
    unreadCount,
    stats,

    loadNotifications: () => loadNotifications(0, true, true),
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    addNotification,

    setUnreadOnly
  };
}
