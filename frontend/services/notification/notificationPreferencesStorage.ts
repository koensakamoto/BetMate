import * as SecureStore from 'expo-secure-store';
import { NotificationPreferences } from '../../types/api';

const STORAGE_KEY = 'notification_preferences';

export const notificationPreferencesStorage = {
  async get(): Promise<NotificationPreferences | null> {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as NotificationPreferences;
      }
      return null;
    } catch {
      return null;
    }
  },

  async set(preferences: NotificationPreferences): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Silent failure - cache is non-critical
    }
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch {
      // Silent failure
    }
  },
};
