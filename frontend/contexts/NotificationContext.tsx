import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications, useNotificationWebSocket } from '../services/notification';

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
  const {
    unreadCount,
    loading,
    error,
    refresh,
    addNotification
  } = useNotifications({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    pageSize: 1 // Only need count, not content
  });

  // Setup WebSocket for real-time notifications
  useNotificationWebSocket({
    onNotificationReceived: addNotification,
    enabled: true
  });

  const value: NotificationContextValue = {
    unreadCount,
    loading,
    error,
    refreshUnreadCount: refresh
  };

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