import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useNotifications, useNotificationWebSocket } from '../services/notification';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Only enable notifications when auth is fully loaded and user is authenticated
  const shouldFetchNotifications = isAuthenticated && !isLoading;

  const {
    unreadCount,
    loading,
    error,
    refresh,
    addNotification
  } = useNotifications({
    autoRefresh: shouldFetchNotifications,
    refreshInterval: 30000, // 30 seconds
    pageSize: 1, // Only need count, not content
    enabled: shouldFetchNotifications // Only fetch when user is authenticated and auth is loaded
  });

  // Setup WebSocket for real-time notifications (only when authenticated)
  useNotificationWebSocket({
    onNotificationReceived: addNotification,
    enabled: shouldFetchNotifications
  });

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo<NotificationContextValue>(() => ({
    unreadCount,
    loading,
    error,
    refreshUnreadCount: refresh
  }), [unreadCount, loading, error, refresh]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}