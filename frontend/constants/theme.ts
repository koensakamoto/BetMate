/**
 * Centralized theme constants for consistent styling across the app
 */

export const colors = {
  // Base backgrounds
  background: '#0a0a0f',
  backgroundCard: '#1a1a1f',
  backgroundCardAlt: '#2a2a2f',
  cardBackground: '#1a1a1f', // Alias for backgroundCard

  // Primary brand color
  primary: '#00D4AA',
  primaryDark: 'rgba(0, 212, 170, 0.5)',
  primaryLight: 'rgba(0, 212, 170, 0.15)',

  // Status colors
  success: '#00D4AA',
  successAlt: '#10b981',
  error: '#EF4444',
  errorAlt: '#FF4757',
  warning: '#FFA726',
  warningAlt: '#F59E0B',
  info: '#06B6D4',
  infoAlt: '#3B82F6',

  // Text colors
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textDisabled: 'rgba(255, 255, 255, 0.3)',
  textDark: '#000000',

  // Gray scale
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderMedium: 'rgba(255, 255, 255, 0.2)',
  borderStrong: 'rgba(255, 255, 255, 0.3)',

  // Surface overlays
  surfaceLight: 'rgba(255, 255, 255, 0.03)',
  surfaceMedium: 'rgba(255, 255, 255, 0.05)',
  surfaceStrong: 'rgba(255, 255, 255, 0.08)',

  // Accent colors
  gold: '#FFD700',
  purple: '#8B5CF6',
  pink: '#FF69B4',
  cyan: '#06B6D4',

  // Category colors (for bet categories)
  category: {
    sports: '#4CAF50',
    crypto: '#FF9500',
    stocks: '#007AFF',
    politics: '#8B5CF6',
    entertainment: '#FF69B4',
    gaming: '#F59E0B',
    other: '#64748B',
  },

  // Rarity colors (for store items)
  rarity: {
    common: '#9CA3AF',
    uncommon: '#10B981',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  },

  // Typing indicator
  typingDot: '#8b8b8b',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadow = {
  primary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;

export const cache = {
  /** 5 minutes - default for most data */
  DEFAULT_DURATION: 5 * 60 * 1000,
  /** 1 minute - for frequently changing data */
  SHORT_DURATION: 1 * 60 * 1000,
  /** 2 minutes - for moderately fresh data */
  MEDIUM_DURATION: 2 * 60 * 1000,
  /** 15 minutes - for rarely changing data */
  LONG_DURATION: 15 * 60 * 1000,
} as const;

// Type exports for type safety
export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type FontSizeKey = keyof typeof fontSize;
