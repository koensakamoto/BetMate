import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { apiClient } from '../api/baseClient';
import { showInfoToast } from '../../utils/toast';

// Check if we're running in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo';

// Firebase messaging modular API imports
let firebaseMessaging: {
  getMessaging: () => any;
  requestPermission: (messaging: any) => Promise<number>;
  getToken: (messaging: any) => Promise<string>;
  deleteToken: (messaging: any) => Promise<void>;
  onMessage: (messaging: any, callback: (message: any) => void) => () => void;
  onNotificationOpenedApp: (messaging: any, callback: (message: any) => void) => () => void;
  getInitialNotification: (messaging: any) => Promise<any>;
  onTokenRefresh: (messaging: any, callback: (token: string) => void) => () => void;
  AuthorizationStatus: { AUTHORIZED: number; PROVISIONAL: number };
} | null = null;

let messagingInstance: any = null;

if (!isExpoGo) {
  try {
    const messaging = require('@react-native-firebase/messaging');
    firebaseMessaging = {
      getMessaging: messaging.getMessaging,
      requestPermission: messaging.requestPermission,
      getToken: messaging.getToken,
      deleteToken: messaging.deleteToken,
      onMessage: messaging.onMessage,
      onNotificationOpenedApp: messaging.onNotificationOpenedApp,
      getInitialNotification: messaging.getInitialNotification,
      onTokenRefresh: messaging.onTokenRefresh,
      AuthorizationStatus: messaging.AuthorizationStatus,
    };
    messagingInstance = firebaseMessaging.getMessaging();
  } catch (e) {
  }
}

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Security: Whitelist of allowed notification navigation routes
const ALLOWED_NOTIFICATION_ROUTES = [
  '/(tabs)',
  '/(app)/notifications',
  '/group/',
  '/bet-details/',
  '/profile/',
];

/**
 * Security: Validates that a route is in the allowed whitelist
 */
const isRouteAllowed = (route: string): boolean => {
  if (!route || typeof route !== 'string') return false;
  return ALLOWED_NOTIFICATION_ROUTES.some(allowed => route.startsWith(allowed));
};

interface UsePushNotificationsReturn {
  fcmToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
  isLoading: boolean;
  registerForPushNotifications: () => Promise<string | null>;
  unregisterPushNotifications: () => Promise<void>;
}

/**
 * Hook for managing push notifications with Firebase Cloud Messaging (FCM).
 * Handles permission requests, token registration, and notification handling.
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const router = useRouter();

  /**
   * Registers the device for push notifications and sends FCM token to backend.
   */
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if Firebase messaging is available (not in Expo Go)
      if (!firebaseMessaging || !messagingInstance) {
        setError('Push notifications not available in Expo Go');
        return null;
      }

      // Check if it's a physical device (push notifications don't work on simulators/emulators)
      if (!Device.isDevice) {
        setError('Push notifications require a physical device');
        return null;
      }

      // Request permission for iOS (Android doesn't need explicit permission for FCM)
      if (Platform.OS === 'ios') {
        const authStatus = await firebaseMessaging.requestPermission(messagingInstance);
        const enabled =
          authStatus === firebaseMessaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === firebaseMessaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          setError('Push notification permissions not granted');
          return null;
        }
      }

      // Also request expo-notifications permission for local notification display
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }

      // Get the FCM token
      const token = await firebaseMessaging.getToken(messagingInstance);

      // Determine platform
      const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';

      // Send token to backend
      try {
        await apiClient.post('/users/push-token', {
          token,
          platform,
        });
      } catch {
        // Don't fail completely - token is still valid locally
      }

      setFcmToken(token);

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4F46E5',
        });

        // Create channel for message notifications
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          description: 'Group chat message notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4F46E5',
        });
      }

      return token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register for push notifications';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Unregisters push notifications and removes token from backend.
   */
  const unregisterPushNotifications = useCallback(async (): Promise<void> => {
    try {
      // Remove token from backend
      await apiClient.delete('/users/push-token');

      // Delete the FCM token from the device (only if messaging is available)
      if (firebaseMessaging && messagingInstance) {
        await firebaseMessaging.deleteToken(messagingInstance);
      }

      setFcmToken(null);
    } catch {
      // Silent failure on unregister
    }
  }, []);

  /**
   * Handles navigation when a notification is tapped.
   * Security: Only navigates to whitelisted routes
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as {
      type?: string;
      groupId?: string | number;
      screen?: string;
      actionUrl?: string;
    };

    // Navigate based on notification type
    if (data?.type === 'GROUP_MESSAGE' && data?.groupId) {
      // Validate groupId is a positive integer
      const groupId = parseInt(String(data.groupId), 10);
      if (!isNaN(groupId) && groupId > 0) {
        router.push(`/group/${groupId}/chat`);
      }
    } else if (data?.screen && isRouteAllowed(data.screen)) {
      // Security: Only navigate to whitelisted routes
      router.push(data.screen as any);
    } else if (data?.actionUrl && typeof data.actionUrl === 'string') {
      // Convert actionUrl to app route and validate
      const route = `/${data.actionUrl.replace(/^\//, '')}`;
      if (isRouteAllowed(route)) {
        router.push(route as any);
      }
    }
  }, [router]);

  // Set up notification listeners on mount
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Skip Firebase messaging setup if not available (Expo Go)
    if (!firebaseMessaging || !messagingInstance) {
      return () => {
        notificationListener.current?.remove();
        responseListener.current?.remove();
      };
    }

    // FCM foreground message handler - show toast for in-app notifications
    const unsubscribeForeground = firebaseMessaging.onMessage(messagingInstance, async (remoteMessage: any) => {
      // Skip toast for group messages (user is already in-app)
      if (remoteMessage.data?.type === 'GROUP_MESSAGE') {
        return;
      }

      // Show toast notification instead of system notification when app is in foreground
      if (remoteMessage.notification) {
        const title = remoteMessage.notification.title || 'Notification';
        const body = remoteMessage.notification.body || '';

        showInfoToast(title, body, {
          onPress: () => router.push('/(app)/notifications'),
        });
      }
    });

    // FCM background/quit message handler for navigation
    // Security: Only navigates to whitelisted routes
    const unsubscribeBackground = firebaseMessaging.onNotificationOpenedApp(messagingInstance, (remoteMessage: any) => {
      const data = remoteMessage.data;

      if (data?.type === 'GROUP_MESSAGE' && data?.groupId) {
        const groupId = parseInt(String(data.groupId), 10);
        if (!isNaN(groupId) && groupId > 0) {
          router.push(`/group/${groupId}/chat`);
        }
      } else if (data?.screen && isRouteAllowed(data.screen)) {
        router.push(data.screen as any);
      } else if (data?.actionUrl && typeof data.actionUrl === 'string') {
        const route = `/${data.actionUrl.replace(/^\//, '')}`;
        if (isRouteAllowed(route)) {
          router.push(route as any);
        }
      }
    });

    // Check if app was opened from a quit state by a notification
    // Security: Only navigates to whitelisted routes
    firebaseMessaging.getInitialNotification(messagingInstance)
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          const data = remoteMessage.data;

          if (data?.type === 'GROUP_MESSAGE' && data?.groupId) {
            const groupId = parseInt(String(data.groupId), 10);
            if (!isNaN(groupId) && groupId > 0) {
              router.push(`/group/${groupId}/chat`);
            }
          } else if (data?.screen && isRouteAllowed(data.screen)) {
            router.push(data.screen as any);
          } else if (data?.actionUrl && typeof data.actionUrl === 'string') {
            const route = `/${data.actionUrl.replace(/^\//, '')}`;
            if (isRouteAllowed(route)) {
              router.push(route as any);
            }
          }
        }
      });

    // FCM token refresh handler
    const unsubscribeTokenRefresh = firebaseMessaging.onTokenRefresh(messagingInstance, async (newToken: string) => {
      setFcmToken(newToken);

      // Send new token to backend
      const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
      try {
        await apiClient.post('/users/push-token', {
          token: newToken,
          platform,
        });
      } catch {
        // Silent failure - token refresh failed
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribeTokenRefresh();
    };
  }, [handleNotificationResponse, router]);

  return {
    fcmToken,
    notification,
    error,
    isLoading,
    registerForPushNotifications,
    unregisterPushNotifications,
  };
}

/**
 * Schedules a local notification (useful for testing).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  seconds: number = 1
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
}

/**
 * Cancels all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Gets the current badge count.
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Sets the badge count.
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  return Notifications.setBadgeCountAsync(count);
}
