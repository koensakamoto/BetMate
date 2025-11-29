/**
 * Centralized validation constants for form fields and inputs
 */

export const VALIDATION = {
  // Password
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_MIN_LENGTH: 8,

  // Username
  USERNAME_MAX_LENGTH: 20,
  USERNAME_MIN_LENGTH: 3,

  // Bet fields
  BET_TITLE_MAX_LENGTH: 100,
  BET_DESCRIPTION_MAX_LENGTH: 200,
  BET_EVIDENCE_MAX_LENGTH: 500,

  // Group fields
  GROUP_NAME_MAX_LENGTH: 50,
  GROUP_NAME_MIN_LENGTH: 3,
  GROUP_DESCRIPTION_MAX_LENGTH: 200,

  // Message fields
  MESSAGE_PREVIEW_MAX_LENGTH: 100,

  // Input heights
  INPUT_MIN_HEIGHT: 36,
  INPUT_MAX_HEIGHT: 100,
} as const;

export type ValidationKey = keyof typeof VALIDATION;
