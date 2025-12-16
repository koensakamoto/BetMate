import { useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  NotificationResponse,
  NotificationWebSocketPayload,
  NotificationType,
  NotificationPriority
} from '../../types/api';
import { showNotificationToast, hideToast } from '../../utils/toast';
import { webSocketService } from '../messaging/webSocketService';

interface UseNotificationWebSocketOptions {
  onNotificationReceived?: (notification: NotificationResponse) => void;
  enabled?: boolean;
}

export function useNotificationWebSocket(options: UseNotificationWebSocketOptions = {}) {
  const { onNotificationReceived, enabled = true } = options;
  const router = useRouter();

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

  // Handle navigation when notification is tapped
  const handleNotificationPress = useCallback((notification: NotificationResponse) => {
    hideToast();

    if (notification.actionUrl) {
      // Navigate to the action URL
      router.push(notification.actionUrl as any);
    } else {
      // Default: go to notifications page
      router.push('/(app)/notifications');
    }
  }, [router]);

  // Handle WebSocket notification
  const handleWebSocketNotification = useCallback((payload: NotificationWebSocketPayload) => {
    const notification = convertWebSocketNotification(payload);

    // Call the callback if provided
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }

    // Show in-app notification toast (works on all platforms)
    console.log('[useNotificationWebSocket] Showing toast for:', notification.title);
    showNotificationToast(
      notification.title,
      notification.content,
      {
        notificationType: notification.type,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        onPress: () => handleNotificationPress(notification),
      }
    );
    console.log('[useNotificationWebSocket] Toast shown!');

    // Also show browser notification on web if permission granted
    if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') {
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
        handleNotificationPress(notification);
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
  }, [convertWebSocketNotification, onNotificationReceived, handleNotificationPress]);

  // Track unsubscribe function
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Setup WebSocket connection for notifications
  useEffect(() => {
    console.log('[useNotificationWebSocket] ========== EFFECT RUNNING ==========');
    console.log('[useNotificationWebSocket] enabled:', enabled);
    if (!enabled) {
      console.log('[useNotificationWebSocket] Not enabled, skipping subscription');
      return;
    }

    let mounted = true;

    const setupSubscription = async () => {
      console.log('[useNotificationWebSocket] Setting up subscription...');
      console.log('[useNotificationWebSocket] WebSocket connected:', webSocketService.isConnected());
      try {
        const unsubscribe = await webSocketService.subscribeToNotifications((payload) => {
          console.log('[useNotificationWebSocket] ******** NOTIFICATION RECEIVED ********');
          console.log('[useNotificationWebSocket] Payload:', JSON.stringify(payload, null, 2));
          if (!mounted) {
            console.log('[useNotificationWebSocket] Component unmounted, ignoring payload');
            return;
          }
          handleWebSocketNotification(payload as NotificationWebSocketPayload);
        });

        console.log('[useNotificationWebSocket] ******** SUBSCRIPTION SUCCESSFUL ********');
        console.log('[useNotificationWebSocket] Active subscriptions:', webSocketService.getActiveSubscriptions());
        if (mounted) {
          unsubscribeRef.current = unsubscribe;
        } else {
          console.log('[useNotificationWebSocket] Component unmounted during setup, cleaning up');
          unsubscribe();
        }
      } catch (error) {
        console.error('[useNotificationWebSocket] Failed to subscribe to notifications:', error);
      }
    };

    setupSubscription();

    // Cleanup function
    return () => {
      console.log('[useNotificationWebSocket] Cleanup - unmounting');
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
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