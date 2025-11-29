/**
 * Error handling utilities for type-safe error handling
 */

/**
 * Registration error codes returned by the backend
 */
export enum RegistrationErrorCode {
  USERNAME_TAKEN = 'USERNAME_TAKEN',
  USERNAME_INVALID_FORMAT = 'USERNAME_INVALID_FORMAT',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  EMAIL_INVALID_FORMAT = 'EMAIL_INVALID_FORMAT',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
}

/**
 * Authentication error codes returned by the backend
 */
export enum AuthErrorCode {
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
}

/**
 * User-friendly error messages for authentication errors
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  [AuthErrorCode.ACCOUNT_LOCKED]: 'Account temporarily locked due to multiple failed login attempts. Please try again later.',
  [AuthErrorCode.ACCOUNT_DISABLED]: 'Your account has been suspended. Please contact support.',
  [AuthErrorCode.ACCOUNT_INACTIVE]: 'Your account is inactive. Please contact support.',
  [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
};

/**
 * User-friendly error messages for registration errors
 */
export const REGISTRATION_ERROR_MESSAGES: Record<string, string> = {
  [RegistrationErrorCode.USERNAME_TAKEN]: 'This username is already taken. Please choose another.',
  [RegistrationErrorCode.USERNAME_INVALID_FORMAT]: 'Username must be 3-20 characters with only lowercase letters, numbers, and underscores.',
  [RegistrationErrorCode.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists.',
  [RegistrationErrorCode.EMAIL_INVALID_FORMAT]: 'Please enter a valid email address.',
  [RegistrationErrorCode.PASSWORD_TOO_WEAK]: 'Please choose a stronger password.',
  [RegistrationErrorCode.VALIDATION_ERROR]: 'Please check your information and try again.',
  [RegistrationErrorCode.RATE_LIMITED]: 'Too many attempts. Please wait before trying again.',
  // Network errors
  NETWORK_ERROR: 'Connection failed. Please check your internet connection.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
};

/**
 * Maps an error code to a field name for inline error display
 */
export const ERROR_CODE_TO_FIELD: Record<string, string> = {
  [RegistrationErrorCode.USERNAME_TAKEN]: 'username',
  [RegistrationErrorCode.USERNAME_INVALID_FORMAT]: 'username',
  [RegistrationErrorCode.EMAIL_ALREADY_EXISTS]: 'email',
  [RegistrationErrorCode.EMAIL_INVALID_FORMAT]: 'email',
  [RegistrationErrorCode.PASSWORD_TOO_WEAK]: 'password',
};

/**
 * Extracts error code from API error response
 */
export function getErrorCode(error: unknown): string | null {
  if (hasResponse(error) && error.response?.data?.code) {
    return error.response.data.code;
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return null;
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    // Axios network error
    if ('message' in error && (error as { message: string }).message === 'Network Error') {
      return true;
    }
    // No response received
    if ('request' in error && !('response' in error)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if error is a rate limit error (HTTP 429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (hasResponse(error) && error.response?.status === 429) {
    return true;
  }
  return false;
}

/**
 * Checks if error is a server error (HTTP 5xx)
 */
export function isServerError(error: unknown): boolean {
  if (hasResponse(error) && error.response?.status && error.response.status >= 500) {
    return true;
  }
  return false;
}

/**
 * Gets the retry-after value from rate limit response (in seconds)
 */
export function getRetryAfter(error: unknown): number | null {
  if (hasResponse(error) && error.response?.data?.retryAfter) {
    return Number(error.response.data.retryAfter);
  }
  return null;
}

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
  // Check for network errors first
  if (isNetworkError(error)) {
    return REGISTRATION_ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Check for rate limiting
  if (isRateLimitError(error)) {
    const retryAfter = getRetryAfter(error);
    if (retryAfter) {
      return `Too many attempts. Please try again in ${retryAfter} seconds.`;
    }
    return REGISTRATION_ERROR_MESSAGES[RegistrationErrorCode.RATE_LIMITED];
  }

  // Check for server errors
  if (isServerError(error)) {
    return REGISTRATION_ERROR_MESSAGES.SERVER_ERROR;
  }

  // Check for known error codes
  const errorCode = getErrorCode(error);
  if (errorCode && REGISTRATION_ERROR_MESSAGES[errorCode]) {
    return REGISTRATION_ERROR_MESSAGES[errorCode];
  }

  // Fall back to message extraction
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
export function hasResponse(error: unknown): error is {
  response: {
    data?: { message?: string; code?: string; retryAfter?: number };
    status?: number
  }
} {
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
