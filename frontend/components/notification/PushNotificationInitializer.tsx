import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePushNotifications, setBadgeCount } from '../../services/notification';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useNotificationWebSocket } from '../../services/notification/useNotificationWebSocket';

/**
 * Component that initializes push notifications when mounted.
 * Should be rendered inside authenticated app screens.
 *
 * Features:
 * - Registers for push notifications (FCM)
 * - Syncs badge count with unread notifications
 * - Subscribes to WebSocket notifications for in-app toasts
 *
 * Note: Presence heartbeats are now handled by PresenceProvider in the app layout.
 */
export function PushNotificationInitializer(): null {
  const { registerForPushNotifications } = usePushNotifications();
  const { unreadCount, refreshUnreadCount } = useNotificationContext();

  // Subscribe to WebSocket notifications for in-app toast notifications
  useNotificationWebSocket({
    onNotificationReceived: () => {
      // Refresh unread count when a notification is received
      refreshUnreadCount();
    },
    enabled: true,
  });
  const hasRegistered = useRef(false);
  const appState = useRef(AppState.currentState);

  // Register for push notifications on mount
  useEffect(() => {
    if (!hasRegistered.current) {
      hasRegistered.current = true;
      registerForPushNotifications();
    }
  }, [registerForPushNotifications]);

  // Sync badge count with unread notifications
  useEffect(() => {
    setBadgeCount(unreadCount).catch(() => {
      // Silent failure for badge count
    });
  }, [unreadCount]);

  // Refresh unread count when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - refresh unread count
        refreshUnreadCount();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refreshUnreadCount]);

  // This component doesn't render anything
  return null;
}

export default PushNotificationInitializer;
