/**
 * Centralized timeout and delay constants
 * All time values are in milliseconds unless otherwise noted
 */

export const TIMEOUTS = {
  // API and Network
  API_DEV: 30000,
  API_PROD: 15000,
  HEALTH_CHECK: 5000,
  RETRY_DELAY: 1000,

  // WebSocket
  WS_CONNECTION: 30000,
  WS_HEARTBEAT_INCOMING: 4000,
  WS_HEARTBEAT_OUTGOING: 4000,
  WS_RECONNECT_INITIAL: 1000,
  WS_RECONNECT_MAX: 30000,

  // Notifications
  NOTIFICATION_REFRESH_INTERVAL: 30000,
  NOTIFICATION_CACHE_TTL: 120000, // 2 minutes

  // Auth
  RESEND_COOLDOWN_SECONDS: 60,

  // UI Interactions
  DEBOUNCE_SEARCH: 300,
  INPUT_FOCUS_DELAY: 100,
  TYPING_INDICATOR_TIMEOUT: 3000,

  // Toasts
  TOAST_DURATION_SHORT: 2000,
  TOAST_DURATION_LONG: 4000,
} as const;

export type TimeoutKey = keyof typeof TIMEOUTS;
