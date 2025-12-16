import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiConfig } from '../../config/api';
import { debugLog, errorLog } from '../../config/env';
import { ApiResponse } from '../../types/api';

// ==========================================
// SECURITY: Sensitive Data Sanitization for Logging
// ==========================================

/**
 * List of field names that should be redacted from logs.
 * Prevents accidental exposure of passwords, tokens, and other sensitive data.
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'secret',
  'apiKey',
  'apiSecret',
  'credential',
];

/**
 * Recursively sanitizes an object by replacing sensitive field values with '[REDACTED]'.
 * This prevents sensitive data from appearing in debug logs.
 *
 * @param data - The data object to sanitize
 * @param depth - Current recursion depth (max 5 to prevent infinite loops)
 * @returns A new object with sensitive fields redacted
 */
const sanitizeForLogging = (data: unknown, depth = 0): unknown => {
  // Prevent infinite recursion and handle non-objects
  if (depth > 5 || data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item, depth + 1));
  }

  // Handle objects
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // Check if this key matches any sensitive field (case-insensitive)
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      key.toLowerCase().includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Token storage keys
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Token refresh mutex to prevent race conditions
// When multiple 401 responses occur simultaneously, only one refresh is performed
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let failedRequestsQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: Error) => void;
}> = [];

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public originalError?: AxiosError
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token storage utilities
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
      ]);
    } catch {
      // Silent failure - tokens may already be cleared
    }
  },
};

/**
 * Refreshes the access token using the refresh token.
 * Uses a mutex pattern to prevent race conditions when multiple 401 errors occur simultaneously.
 *
 * @returns The new access token, or null if refresh failed
 */
const refreshAccessToken = async (): Promise<string | null> => {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    debugLog('Token refresh already in progress, waiting...');
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();

      if (!refreshToken) {
        debugLog('No refresh token available');
        return null;
      }

      debugLog('Attempting to refresh access token...');

      // SECURITY: Send refresh token in Authorization header instead of body
      // Use a fresh axios instance to avoid interceptor loops
      const refreshResponse = await axios.post(
        `${apiConfig.baseURL}/auth/refresh`,
        {},
        {
          timeout: apiConfig.timeout,
          headers: { 'Authorization': `Bearer ${refreshToken}` }
        }
      );

      const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

      // Store new tokens
      await tokenStorage.setTokens(accessToken, newRefreshToken);

      debugLog('Token refresh successful');

      // Resolve all queued requests with the new token
      failedRequestsQueue.forEach(({ resolve }) => resolve(accessToken));
      failedRequestsQueue = [];

      return accessToken;
    } catch (error) {
      errorLog('Token refresh failed:', error);

      // Clear tokens on refresh failure
      await tokenStorage.clearTokens();

      // Reject all queued requests
      failedRequestsQueue.forEach(({ reject }) =>
        reject(new Error('Token refresh failed'))
      );
      failedRequestsQueue = [];

      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Queues a failed request to be retried after token refresh completes.
 * Returns a promise that resolves with the new access token.
 */
const queueFailedRequest = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    failedRequestsQueue.push({ resolve, reject });
  });
};

// Create base axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async (config) => {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      errorLog('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // SECURITY: Sanitize error data before logging to prevent sensitive data exposure
      errorLog(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        message: error.message,
        data: sanitizeForLogging(error.response?.data),
      });

      // Handle 403 Forbidden - session expired or access revoked
      if (error.response?.status === 403) {
        errorLog('403 Forbidden - clearing tokens and forcing logout');
        await tokenStorage.clearTokens();
        // The ApiError will be thrown below, which should trigger a redirect to login
        // in the component that catches this error
      }

      // Handle 401 Unauthorized - attempt token refresh with mutex
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          let newAccessToken: string | null;

          // If a refresh is already in progress, queue this request
          if (isRefreshing) {
            debugLog('Refresh in progress, queueing request...');
            newAccessToken = await queueFailedRequest();
          } else {
            // Start a new refresh
            newAccessToken = await refreshAccessToken();
          }

          if (newAccessToken) {
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return client(originalRequest);
          }

          // No token available, fall through to error handling
          errorLog('No access token available after refresh attempt');
        } catch (refreshError) {
          errorLog('Failed to refresh token or retry request:', refreshError);
          // Fall through to error handling
        }
      }

      // Transform axios error to custom ApiError
      const responseData = error.response?.data as { message?: string } | undefined;
      const apiError = new ApiError(
        error.response?.status || 500,
        responseData?.message || error.message || 'An unexpected error occurred',
        error
      );
      
      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create and export the API client instance
export const apiClient = createApiClient();

// Utility function to handle API responses with proper typing
export const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T> | T>): T => {
  // Check if response has the ApiResponse wrapper format
  if (typeof response.data === 'object' && response.data !== null && 'success' in response.data) {
    const apiResponse = response.data as ApiResponse<T>;

    // Check if request was unsuccessful
    if (!apiResponse.success) {
      // Use 'status' field from backend ApiResponse, fallback to HTTP status
      const statusCode = (apiResponse as any).status || (apiResponse as any).statusCode || response.status;
      throw new ApiError(
        statusCode,
        apiResponse.message || apiResponse.error || 'API request failed'
      );
    }

    // Return data if present, otherwise return the entire response (for responses like {success, message})
    if ('data' in apiResponse) {
      return apiResponse.data as T;
    }
    // Return the entire response object for responses like {success: true, message: "...", ...other fields}
    return response.data as T;
  }

  // Backend returns data directly (no wrapper), so return it as-is
  return response.data as T;
};

// Status codes that are safe to retry (transient gateway errors)
const RETRYABLE_STATUS_CODES = [502, 503, 504];

// Retry utility for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  attempts: number = apiConfig.retryAttempts,
  delay: number = apiConfig.retryDelay
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    // Only retry for transient gateway errors (502, 503, 504)
    // Don't retry on 500 (application error) or 429 (rate limit)
    const isRetryable = error instanceof ApiError &&
      RETRYABLE_STATUS_CODES.includes(error.statusCode);

    if (attempts > 1 && isRetryable) {
      debugLog(`Retrying request after ${delay}ms (${attempts - 1} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, attempts - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};