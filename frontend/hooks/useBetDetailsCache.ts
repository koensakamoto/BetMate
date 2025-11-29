import { useState, useEffect, useCallback } from 'react';
import { CacheStore } from '../utils/cache';
import { betService, BetResponse, BetParticipationResponse } from '../services/bet/betService';

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Module-level cache instances (persist across component mounts)
const betCache = new CacheStore<BetResponse>(CACHE_TTL);
const participantsCache = new CacheStore<BetParticipationResponse[]>(CACHE_TTL);

interface UseBetDetailsCacheResult {
  bet: BetResponse | null;
  participants: BetParticipationResponse[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and caching bet details with stale-while-revalidate pattern.
 *
 * Features:
 * - Shows cached data instantly on navigation
 * - Refreshes in background if data is stale
 * - Request deduplication (prevents duplicate in-flight requests)
 * - Automatic fetch on mount/ID change
 */
export function useBetDetailsCache(betId: number | null): UseBetDetailsCacheResult {
  const key = betId?.toString() ?? '';

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useState({});

  const fetchData = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!betId) return;

    // Request deduplication: if there's already a pending request, wait for it
    const pending = betCache.getPending(key);
    if (pending) {
      try {
        await pending;
        forceUpdate({});
      } catch {
        // Error handled by original request
      }
      return;
    }

    const hasCached = betCache.has(key);

    // Set appropriate loading state
    if (!options.silent) {
      if (hasCached) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
    }
    setError(null);

    // Create the fetch promise
    const fetchPromise = (async () => {
      const [bet, participants] = await Promise.all([
        betService.getBetById(betId),
        betService.getBetParticipations(betId).catch(() => []),
      ]);

      betCache.set(key, bet);
      participantsCache.set(key, participants);

      return bet;
    })();

    // Register as pending for deduplication
    betCache.setPending(key, fetchPromise);

    try {
      await fetchPromise;
      forceUpdate({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bet details');
      console.error('Error loading bet details:', err);
    } finally {
      betCache.clearPending(key);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [betId, key]);

  // Auto-fetch on mount or betId change
  useEffect(() => {
    if (!betId) return;

    // Fetch if stale, silently if we have cached data
    if (betCache.isStale(key)) {
      fetchData({ silent: betCache.has(key) });
    }
  }, [betId, key, fetchData]);

  return {
    bet: betCache.get(key),
    participants: participantsCache.get(key) ?? [],
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchData(),
  };
}

/**
 * Invalidate cached bet data. Call after mutations (resolve, cancel).
 */
export function invalidateBet(betId: number): void {
  const key = betId.toString();
  betCache.invalidate(key);
  participantsCache.invalidate(key);
}

/**
 * Update cached bet data directly. Call after successful join with API response.
 */
export function updateBetCache(betId: number, bet: BetResponse): void {
  betCache.set(betId.toString(), bet);
}

/**
 * Update cached participants data directly.
 */
export function updateParticipantsCache(betId: number, participants: BetParticipationResponse[]): void {
  participantsCache.set(betId.toString(), participants);
}

/**
 * Clear all bet caches. Call on logout.
 */
export function clearAllBetCaches(): void {
  betCache.clear();
  participantsCache.clear();
}
