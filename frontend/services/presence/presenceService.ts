import { apiClient } from '../api/baseClient';
import { errorLog } from '../../config/env';

/**
 * Presence state representing app foreground/background status.
 */
export type AppState = 'active' | 'background' | 'inactive';

/**
 * Request payload for updating presence.
 */
export interface PresenceUpdateRequest {
  state: AppState;
  screen?: string;
  chatId?: number;
}

/**
 * Presence info returned from the server.
 */
export interface PresenceInfo {
  state: string;
  screen: string | null;
  chatId: number | null;
  lastSeen: number;
}

/**
 * Service for managing user presence state.
 * Reports app state and heartbeats to the backend for smart notification routing.
 */
export const presenceService = {
  /**
   * Updates the user's app state.
   * Call this when app transitions between foreground/background/inactive.
   *
   * @param state - The current app state
   * @param screen - Optional current screen name
   * @param chatId - Optional group ID if viewing a chat
   */
  async updateState(state: AppState, screen?: string, chatId?: number): Promise<void> {
    try {
      const payload: PresenceUpdateRequest = { state };
      if (screen) payload.screen = screen;
      if (chatId) payload.chatId = chatId;

      await apiClient.post('/presence/state', payload);
    } catch (error) {
      // Don't throw - presence updates shouldn't break the app
      errorLog('[Presence] Failed to update presence state:', error);
    }
  },

  /**
   * Sends a heartbeat to keep presence alive.
   * Should be called every 30 seconds while the app is active.
   *
   * @param state - The current app state
   * @param screen - Optional current screen name
   * @param chatId - Optional group ID if viewing a chat
   */
  async sendHeartbeat(state: AppState, screen?: string, chatId?: number): Promise<void> {
    try {
      const payload: PresenceUpdateRequest = { state };
      if (screen) payload.screen = screen;
      if (chatId) payload.chatId = chatId;

      console.log('[Presence] Sending heartbeat:', payload);
      await apiClient.post('/presence/heartbeat', payload);
    } catch (error) {
      // Don't throw - heartbeats shouldn't break the app
      errorLog('[Presence] Failed to send heartbeat:', error);
    }
  },

  /**
   * Gets the current user's presence info (for debugging).
   *
   * @returns The presence info or null if not available
   */
  async getMyPresence(): Promise<PresenceInfo | null> {
    try {
      const response = await apiClient.get<PresenceInfo>('/presence/me');
      return response.data;
    } catch (error) {
      errorLog('Failed to get presence:', error);
      return null;
    }
  },
};
