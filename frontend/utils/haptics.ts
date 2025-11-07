import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Centralized haptic feedback utility
 *
 * Provides consistent haptic feedback patterns across the app.
 * Note: Haptic feedback only works on physical devices, not simulators.
 *
 * Usage:
 * import { haptic } from '@/utils/haptics';
 *
 * haptic.light();    // Light tap for selections
 * haptic.medium();   // Medium tap for button presses
 * haptic.success();  // Success notification
 */

/**
 * Check if haptics are supported on the current platform
 */
const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Safe wrapper for haptic feedback that handles errors gracefully
 */
const safeHaptic = async (hapticFn: () => Promise<void>) => {
  if (!isHapticsSupported) return;

  try {
    await hapticFn();
  } catch (error) {
    // Silently fail - haptics are non-critical
    console.debug('Haptic feedback failed:', error);
  }
};

/**
 * Haptic feedback utility object
 */
export const haptic = {
  /**
   * Light impact - for minor interactions
   * Use for: selections, toggles, checkboxes, radio buttons
   */
  light: () => safeHaptic(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  ),

  /**
   * Medium impact - for standard button presses
   * Use for: primary buttons, confirmations, tab switches
   */
  medium: () => safeHaptic(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  ),

  /**
   * Heavy impact - for important actions
   * Use for: destructive actions, major confirmations, important submissions
   */
  heavy: () => safeHaptic(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  ),

  /**
   * Success notification - for successful operations
   * Use for: successful form submissions, purchases, bet creation
   */
  success: () => safeHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  ),

  /**
   * Warning notification - for warnings or caution
   * Use for: validation warnings, insufficient credits, risky actions
   */
  warning: () => safeHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  ),

  /**
   * Error notification - for errors or failures
   * Use for: form errors, network failures, invalid inputs
   */
  error: () => safeHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  ),

  /**
   * Selection change - for picker/selector changes
   * Use for: scrolling through options, changing values in a picker
   */
  selection: () => safeHaptic(() =>
    Haptics.selectionAsync()
  ),
};

/**
 * Helper function to add haptic feedback to a button press handler
 *
 * @param handler - The original press handler
 * @param feedbackType - The type of haptic feedback (default: 'medium')
 * @returns A new handler with haptic feedback
 *
 * @example
 * const handlePress = withHaptic(() => {
 *   console.log('Button pressed');
 * });
 */
export const withHaptic = (
  handler: () => void | Promise<void>,
  feedbackType: keyof typeof haptic = 'medium'
) => {
  return async () => {
    haptic[feedbackType]();
    await handler();
  };
};
