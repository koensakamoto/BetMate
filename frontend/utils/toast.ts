import Toast from 'react-native-toast-message';

interface ToastOptions {
  duration?: number;
  onPress?: () => void;
}

/**
 * Show a success toast notification
 */
export function showSuccessToast(title: string, message?: string, options?: ToastOptions) {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: options?.duration ?? 3000,
    onPress: options?.onPress,
  });
}

/**
 * Show an error toast notification
 */
export function showErrorToast(title: string, message?: string, options?: ToastOptions) {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: options?.duration ?? 4000,
    onPress: options?.onPress,
  });
}

/**
 * Show an info toast notification
 */
export function showInfoToast(title: string, message?: string, options?: ToastOptions) {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    visibilityTime: options?.duration ?? 3000,
    onPress: options?.onPress,
  });
}

/**
 * Show a warning toast notification
 */
export function showWarningToast(title: string, message?: string, options?: ToastOptions) {
  Toast.show({
    type: 'warning',
    text1: title,
    text2: message,
    visibilityTime: options?.duration ?? 3500,
    onPress: options?.onPress,
  });
}

/**
 * Hide the currently visible toast
 */
export function hideToast() {
  Toast.hide();
}

// Re-export Toast for direct access if needed
export { Toast };
