/**
 * Error handling utilities for type-safe error handling
 */

/**
 * Extracts a user-friendly error message from an unknown error.
 * Use this in catch blocks instead of `catch (error: any)`.
 *
 * @example
 * ```typescript
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   Alert.alert('Error', message);
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
}

/**
 * Type guard to check if a value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if an error has a specific error code
 * Useful for handling API errors or library-specific errors
 */
export function hasErrorCode(error: unknown): error is { code: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Type guard for errors with a response property (e.g., Axios errors)
 */
export function hasResponse(error: unknown): error is { response: { data?: { message?: string }; status?: number } } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object'
  );
}

/**
 * Extracts error message with fallback, checking response data first (for API errors)
 */
export function getApiErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (hasResponse(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}
