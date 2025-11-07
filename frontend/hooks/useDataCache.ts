import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for caching data with timestamp-based invalidation
 * Prevents unnecessary refetches when switching between tabs
 *
 * @param cacheDuration - Cache duration in milliseconds (default: 5 minutes)
 */
export function useDataCache<T>(cacheDuration: number = 5 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((): boolean => {
    const now = Date.now();
    return (now - lastFetchTime.current) < cacheDuration;
  }, [cacheDuration]);

  /**
   * Fetch data with smart caching
   * Only fetches if cache is invalid or force is true
   */
  const fetchData = useCallback(async (
    fetchFn: () => Promise<T>,
    options: { force?: boolean; silent?: boolean } = {}
  ): Promise<T | null> => {
    const { force = false, silent = false } = options;

    // Return cached data if valid and not forcing refresh
    if (!force && isCacheValid() && data !== null) {
      return data;
    }

    try {
      // Only show loading state if not silent
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      const result = await fetchFn();

      setData(result);
      lastFetchTime.current = Date.now();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      return null;
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [data, isCacheValid]);

  /**
   * Force invalidate cache
   */
  const invalidateCache = useCallback(() => {
    lastFetchTime.current = 0;
  }, []);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    setData(null);
    lastFetchTime.current = 0;
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchData,
    invalidateCache,
    clearCache,
    isCacheValid
  };
}
