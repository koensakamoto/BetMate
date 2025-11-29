/**
 * Centralized default values for the application
 */

export const DEFAULTS = {
  // Bet creation defaults (in milliseconds from now)
  BET_END_TIME_OFFSET: 24 * 60 * 60 * 1000, // 24 hours
  BET_RESOLUTION_DATE_OFFSET: 48 * 60 * 60 * 1000, // 48 hours

  // Default stake type
  STAKE_TYPE: 'SOCIAL' as const,

  // Pagination defaults
  PAGE_SIZE: 20,
  NOTIFICATION_PAGE_SIZE: 20,
} as const;

// Bet categories with their associated colors (from theme)
export const BET_CATEGORIES = [
  { id: 'SPORTS', label: 'Sports', icon: 'football' },
  { id: 'CRYPTO', label: 'Crypto', icon: 'bitcoin' },
  { id: 'STOCKS', label: 'Stocks', icon: 'trending-up' },
  { id: 'POLITICS', label: 'Politics', icon: 'account-balance' },
  { id: 'ENTERTAINMENT', label: 'Entertainment', icon: 'movie' },
  { id: 'GAMING', label: 'Gaming', icon: 'videogame-asset' },
  { id: 'OTHER', label: 'Other', icon: 'more-horiz' },
] as const;

export type StakeType = typeof DEFAULTS.STAKE_TYPE;
export type BetCategory = typeof BET_CATEGORIES[number]['id'];
