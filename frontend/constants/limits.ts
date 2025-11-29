/**
 * Centralized limits for pagination, batch sizes, and other numeric constraints
 */

export const LIMITS = {
  // WebSocket
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  WS_MAX_CHUNK_SIZE: 8 * 1024, // 8KB chunks for mobile

  // Messages
  RECENT_MESSAGES_LIMIT: 50,
  MESSAGES_BEFORE_LIMIT: 50,
  MESSAGES_PER_BATCH_RENDER: 10,

  // Typing indicator
  MAX_TYPING_USERS_DISPLAYED: 3,

  // Virtual list rendering
  TRANSACTION_ITEM_HEIGHT: 110,
  MAX_RENDER_PER_BATCH: 5,

  // Retry limits
  API_RETRY_ATTEMPTS_DEV: 3,
  API_RETRY_ATTEMPTS_PROD: 2,

  // Screen dimensions
  MODAL_MAX_HEIGHT_RATIO: 0.85, // 85% of screen height
  MODAL_HEIGHT_REDUCTION: 180,
  SUCCESS_MODAL_MAX_WIDTH: 400,
} as const;

export type LimitsKey = keyof typeof LIMITS;
