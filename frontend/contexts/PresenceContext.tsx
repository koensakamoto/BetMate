import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { presenceService, AppState as PresenceAppState } from '../services/presence/presenceService';
import { debugLog } from '../config/env';

interface ScreenContext {
  screen?: string;
  chatId?: number;
}

interface PresenceContextType {
  updateScreenContext: (context: ScreenContext) => void;
}

const PresenceContext = createContext<PresenceContextType | null>(null);

interface PresenceProviderProps {
  children: React.ReactNode;
  intervalMs?: number;
  enabled?: boolean;
}

export function PresenceProvider({ children, intervalMs = 30000, enabled = true }: PresenceProviderProps) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const screenContextRef = useRef<ScreenContext>({});
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const sendPresenceUpdate = useCallback(async (state: AppStateStatus) => {
    const presenceState = toPresenceState(state);
    const { screen, chatId } = screenContextRef.current;
    await presenceService.updateState(presenceState, screen, chatId);
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (appStateRef.current !== 'active') {
      return;
    }
    const { screen, chatId } = screenContextRef.current;
    debugLog('[PresenceContext] Sending heartbeat with context:', { screen, chatId });
    await presenceService.sendHeartbeat('active', screen, chatId);
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      return;
    }
    debugLog('[PresenceContext] Starting presence heartbeat');
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, intervalMs);
    sendHeartbeat();
  }, [intervalMs, sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      debugLog('[PresenceContext] Stopping presence heartbeat');
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const updateScreenContext = useCallback((context: ScreenContext) => {
    debugLog('[PresenceContext] Updating screen context:', context);
    screenContextRef.current = context;

    if (appStateRef.current === 'active') {
      sendHeartbeat();
    }
  }, [sendHeartbeat]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      debugLog(`[PresenceContext] App state changed: ${previousState} -> ${nextAppState}`);
      sendPresenceUpdate(nextAppState);

      if (nextAppState === 'active') {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (AppState.currentState === 'active') {
      sendPresenceUpdate('active');
      startHeartbeat();
    }

    return () => {
      subscription.remove();
      stopHeartbeat();
    };
  }, [enabled, sendPresenceUpdate, startHeartbeat, stopHeartbeat]);

  return (
    <PresenceContext.Provider value={{ updateScreenContext }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence(): PresenceContextType {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
