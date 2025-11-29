import { useEffect, useCallback } from 'react';
import {
  NotificationResponse,
  NotificationWebSocketPayload,
  NotificationType,
  NotificationPriority
} from '../../types/api';

interface UseNotificationWebSocketOptions {
  onNotificationReceived?: (notification: NotificationResponse) => void;
  enabled?: boolean;
}

export function useNotificationWebSocket(options: UseNotificationWebSocketOptions = {}) {
  const { onNotificationReceived, enabled = true } = options;

  // Convert WebSocket payload to NotificationResponse
  const convertWebSocketNotification = useCallback((payload: NotificationWebSocketPayload): NotificationResponse => {
    return {
      id: payload.id,
      userId: 0, // Will be set by the current user context
      type: payload.type as NotificationType,
      title: payload.title,
      content: payload.content,
      actionUrl: payload.actionUrl,
      priority: payload.priority as NotificationPriority,
      isRead: false,
      isDelivered: true,
      createdAt: payload.createdAt,
      deliveredAt: new Date().toISOString()
    };
  }, []);

  // Handle WebSocket notification
  const handleWebSocketNotification = useCallback((payload: NotificationWebSocketPayload) => {
    const notification = convertWebSocketNotification(payload);

    // Call the callback if provided
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.content,
        icon: '/icon.png', // App icon
        badge: '/badge.png', // Badge icon
        tag: `notification-${notification.id}`, // Prevent duplicates
        requireInteraction: notification.priority === NotificationPriority.HIGH ||
                           notification.priority === NotificationPriority.URGENT,
      });

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          // Navigate to the action URL
          // This would need to be implemented based on your navigation setup
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== NotificationPriority.HIGH &&
          notification.priority !== NotificationPriority.URGENT) {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }, [convertWebSocketNotification, onNotificationReceived]);

  // Setup WebSocket connection for notifications
  useEffect(() => {
    if (!enabled) return;

    // This would integrate with your existing WebSocket service
    // Example of how this would work with your existing WebSocket service:
    /*
    const unsubscribe = webSocketService.subscribe('/queue/notifications', (message) => {
      const payload = JSON.parse(message.body) as NotificationWebSocketPayload;
      handleWebSocketNotification(payload);
    });

    return () => {
      unsubscribe();
    };
    */

    // Cleanup function
    return () => {
    };
  }, [enabled, handleWebSocketNotification]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }, []);

  return {
    requestNotificationPermission,
    handleWebSocketNotification,
    isNotificationSupported: 'Notification' in window,
    notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported'
  };
}