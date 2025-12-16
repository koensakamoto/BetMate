import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { presenceService, AppState as PresenceAppState } from '../services/presence/presenceService';
import { debugLog } from '../config/env';

/**
 * Configuration for the presence heartbeat.
 */
interface UsePresenceHeartbeatOptions {
  /** Heartbeat interval in milliseconds (default: 30000 = 30 seconds) */
  intervalMs?: number;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Context for the current screen the user is viewing.
 */
interface ScreenContext {
  screen?: string;
  chatId?: number;
}

/**
 * Hook that manages presence heartbeats and app state reporting.
 *
 * Features:
 * - Reports app state changes (active/background/inactive) to backend
 * - Sends heartbeats every 30 seconds while app is active
 * - Includes current screen context in heartbeats
 * - Automatically pauses heartbeats when app is backgrounded
 *
 * @param options - Configuration options
 * @returns Function to update the current screen context
 *
 * @example
 * ```tsx
 * // In your app's root component or layout
 * const updateScreenContext = usePresenceHeartbeat();
 *
 * // When navigating to a chat screen
 * updateScreenContext({ screen: 'chat', chatId: groupId });
 *
 * // When leaving the chat screen
 * updateScreenContext({ screen: 'home' });
 * ```
 */
export function usePresenceHeartbeat(options: UsePresenceHeartbeatOptions = {}) {
  const { intervalMs = 30000, enabled = true } = options;

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const screenContextRef = useRef<ScreenContext>({});
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Converts React Native AppState to our presence state.
   */
  const toPresenceState = (state: AppStateStatus): PresenceAppState => {
    switch (state) {
      case 'active':
        return 'active';
      case 'background':
        return 'background';
      case 'inactive':
      default:
        return 'inactive';
    }
  };

  /**
   * Sends the current state to the backend.
   */
  const sendPresenceUpdate = useCallback(async (state: AppStateStatus) => {
    const presenceState = toPresenceState(state);
    const { screen, chatId } = screenContextRef.current;

    await presenceService.updateState(presenceState, screen, chatId);
  }, []);

  /**
   * Sends a heartbeat with current context.
   */
  const sendHeartbeat = useCallback(async () => {
    if (appStateRef.current !== 'active') {
      return; // Don't send heartbeats when not active
    }

    const { screen, chatId } = screenContextRef.current;
    await presenceService.sendHeartbeat('active', screen, chatId);
  }, []);

  /**
   * Starts the heartbeat interval.
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      return; // Already running
    }

    debugLog('Starting presence heartbeat');
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, intervalMs);

    // Send initial heartbeat immediately
    sendHeartbeat();
  }, [intervalMs, sendHeartbeat]);

  /**
   * Stops the heartbeat interval.
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      debugLog('Stopping presence heartbeat');
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Updates the current screen context.
   * Call this when the user navigates to a different screen.
   */
  const updateScreenContext = useCallback((context: ScreenContext) => {
    screenContextRef.current = context;

    // If active, send an immediate update with the new context
    if (appStateRef.current === 'active') {
      sendHeartbeat();
    }
  }, [sendHeartbeat]);

  // Handle app state changes
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      debugLog(`App state changed: ${previousState} -> ${nextAppState}`);

      // Report state change to backend
      sendPresenceUpdate(nextAppState);

      // Manage heartbeat based on app state
      if (nextAppState === 'active') {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initialize - if app is already active, start heartbeat
    if (AppState.currentState === 'active') {
      sendPresenceUpdate('active');
      startHeartbeat();
    }

    // Cleanup on unmount
    return () => {
      subscription.remove();
      stopHeartbeat();
    };
  }, [enabled, sendPresenceUpdate, startHeartbeat, stopHeartbeat]);

  return updateScreenContext;
}

export default usePresenceHeartbeat;
