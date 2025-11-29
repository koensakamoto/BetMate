import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { apiClient } from '../api/baseClient';

// Check if we're running in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo';

// Dynamically import Firebase messaging only when not in Expo Go
let messaging: any = null;
if (!isExpoGo) {
  try {
    messaging = require('@react-native-firebase/messaging').default;
  } catch (e) {
  }
}

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
      if (!messaging) {
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
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

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
      const token = await messaging().getToken();

      // Determine platform
      const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';

      // Send token to backend
      try {
        await apiClient.post('/users/push-token', {
          token,
          platform,
        });
      } catch (backendError) {
        console.error('Failed to register FCM token with backend:', backendError);
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
      console.error('Push notification registration error:', err);
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
      if (messaging) {
        await messaging().deleteToken();
      }

      setFcmToken(null);
    } catch (err) {
      console.error('Failed to unregister FCM token:', err);
    }
  }, []);

  /**
   * Handles navigation when a notification is tapped.
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Navigate based on notification type
    if (data?.type === 'GROUP_MESSAGE' && data?.groupId) {
      router.push(`/group/${data.groupId}/chat`);
    } else if (data?.screen) {
      router.push(data.screen as any);
    } else if (data?.actionUrl) {
      // Convert actionUrl to app route
      const route = data.actionUrl.replace(/^\//, '');
      router.push(`/${route}` as any);
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
    if (!messaging) {
      return () => {
        notificationListener.current?.remove();
        responseListener.current?.remove();
      };
    }

    // FCM foreground message handler - display as local notification
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
      // Display as local notification using expo-notifications
      if (remoteMessage.notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title || '',
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data,
            sound: 'default',
          },
          trigger: null, // Show immediately
        });
      }
    });

    // FCM background/quit message handler for navigation
    const unsubscribeBackground = messaging().onNotificationOpenedApp((remoteMessage: any) => {
      const data = remoteMessage.data;

      if (data?.type === 'GROUP_MESSAGE' && data?.groupId) {
        router.push(`/group/${data.groupId}/chat`);
      } else if (data?.screen) {
        router.push(data.screen as any);
      } else if (data?.actionUrl && typeof data.actionUrl === 'string') {
        const route = data.actionUrl.replace(/^\//, '');
        router.push(`/${route}` as any);
      }
    });

    // Check if app was opened from a quit state by a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          const data = remoteMessage.data;

          if (data?.type === 'GROUP_MESSAGE' && data?.groupId) {
            router.push(`/group/${data.groupId}/chat`);
          } else if (data?.screen) {
            router.push(data.screen as any);
          } else if (data?.actionUrl && typeof data.actionUrl === 'string') {
            const route = data.actionUrl.replace(/^\//, '');
            router.push(`/${route}` as any);
          }
        }
      });

    // FCM token refresh handler
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken: string) => {
      setFcmToken(newToken);

      // Send new token to backend
      const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
      try {
        await apiClient.post('/users/push-token', {
          token: newToken,
          platform,
        });
      } catch (err) {
        console.error('Failed to register refreshed FCM token:', err);
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
