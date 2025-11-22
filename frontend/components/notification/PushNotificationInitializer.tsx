import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePushNotifications, setBadgeCount } from '../../services/notification';
import { useNotificationContext } from '../../contexts/NotificationContext';

/**
 * Component that initializes push notifications when mounted.
 * Should be rendered inside authenticated app screens.
 * Automatically registers for push notifications and syncs badge count.
 */
export function PushNotificationInitializer(): null {
  const { registerForPushNotifications, fcmToken } = usePushNotifications();
  const { unreadCount, refreshUnreadCount } = useNotificationContext();
  const hasRegistered = useRef(false);
  const appState = useRef(AppState.currentState);

  // Register for push notifications on mount
  useEffect(() => {
    if (!hasRegistered.current) {
      hasRegistered.current = true;
      registerForPushNotifications().then(token => {
        if (token) {
          console.log('Push notifications registered successfully');
        }
      });
    }
  }, [registerForPushNotifications]);

  // Sync badge count with unread notifications
  useEffect(() => {
    setBadgeCount(unreadCount).catch(err => {
      console.warn('Failed to set badge count:', err);
    });
  }, [unreadCount]);

  // Refresh unread count when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
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
