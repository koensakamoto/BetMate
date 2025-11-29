/**
 * Centralized animation duration constants
 * All values are in milliseconds
 */

export const ANIMATIONS = {
  // Fast interactions (button presses, small transitions)
  FAST: 150,

  // Standard transitions (modal open/close, page transitions)
  STANDARD: 200,

  // Medium transitions (more deliberate animations)
  MEDIUM: 300,

  // Slow transitions (complex animations, emphasis)
  SLOW: 400,

  // Specific animation durations
  FADE: 200,
  BOUNCE: 800,
  PULSE: 1000,
  SKELETON_PULSE: 1000,

  // Component-specific
  INPUT_TRANSITION: 200,
  MODAL_TRANSITION: 250,
  PROGRESS_BAR: 300,
  SUCCESS_MODAL: 200,

  // Loading animations
  LOADING_LOGO: 800,
  LOADING_COMPLETE: 2000,

  // List animations
  LIST_ITEM_APPEAR: 800,

  // Typing indicator
  TYPING_DOT_DELAY: 400,
} as const;

export type AnimationKey = keyof typeof ANIMATIONS;
