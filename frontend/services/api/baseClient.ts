import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiConfig } from '../../config/api';
import { debugLog, errorLog } from '../../config/env';
import { ApiResponse } from '../../types/api';

// Token storage keys
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

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
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
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
      
      // Log request
      debugLog(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
      
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
      // Log response
      debugLog(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
      
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
      
      // Log error
      errorLog(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });

      // Handle 401 Unauthorized - attempt token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = await tokenStorage.getRefreshToken();
          
          if (refreshToken) {
            // Attempt to refresh token
            const refreshResponse = await axios.post(
              `${apiConfig.baseURL}/auth/refresh`,
              { refreshToken },
              { timeout: apiConfig.timeout }
            );
            
            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
            
            // Store new tokens
            await tokenStorage.setTokens(accessToken, newRefreshToken);
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          await tokenStorage.clearTokens();
          errorLog('Token refresh failed:', refreshError);
          // TODO: Trigger logout/redirect to login screen
        }
      }

      // Transform axios error to custom ApiError
      const apiError = new ApiError(
        error.response?.status || 500,
        error.response?.data?.message || error.message || 'An unexpected error occurred',
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
    if (!apiResponse.success) {
      throw new ApiError(
        response.status,
        apiResponse.error || apiResponse.message || 'API request failed'
      );
    }
    return apiResponse.data as T;
  }
  
  // Backend returns data directly (no wrapper), so return it as-is
  return response.data as T;
};

// Retry utility for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  attempts: number = apiConfig.retryAttempts,
  delay: number = apiConfig.retryDelay
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    if (attempts > 1 && error instanceof ApiError && error.statusCode >= 500) {
      // Only retry for server errors (5xx)
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, attempts - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};