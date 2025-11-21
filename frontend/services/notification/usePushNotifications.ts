import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { apiClient } from '../api/baseClient';

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
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
  isLoading: boolean;
  registerForPushNotifications: () => Promise<string | null>;
  unregisterPushNotifications: () => Promise<void>;
}

/**
 * Hook for managing push notifications with Expo.
 * Handles permission requests, token registration, and notification handling.
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const router = useRouter();

  /**
   * Registers the device for push notifications and sends token to backend.
   */
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if it's a physical device (push notifications don't work on simulators/emulators)
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        setError('Push notifications require a physical device');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        setError('Push notification permissions not granted');
        return null;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn('No project ID found for push notifications');
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenResponse.data;
      console.log('Expo Push Token:', token);

      // Determine platform
      const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';

      // Send token to backend
      try {
        await apiClient.post('/users/push-token', {
          token,
          platform,
        });
        console.log('Push token registered with backend');
      } catch (backendError) {
        console.error('Failed to register push token with backend:', backendError);
        // Don't fail completely - token is still valid locally
      }

      setExpoPushToken(token);

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
      console.log('Push token removed from backend');
      setExpoPushToken(null);
    } catch (err) {
      console.error('Failed to unregister push token:', err);
    }
  }, []);

  /**
   * Handles navigation when a notification is tapped.
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    console.log('Notification tapped:', data);

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
      console.log('Notification received in foreground:', notification);
      setNotification(notification);
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [handleNotificationResponse]);

  return {
    expoPushToken,
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
    trigger: { seconds },
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
