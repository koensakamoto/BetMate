/**
 * Generic cache store with TTL and request deduplication.
 * Pure TypeScript - no React dependencies.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class CacheStore<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private pending = new Map<string, Promise<T>>();

  constructor(private ttl: number) {}

  /**
   * Get cached data by key. Returns null if not found.
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? entry.data : null;
  }

  /**
   * Check if key exists in cache (regardless of staleness).
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Check if cached data is stale (expired or doesn't exist).
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > this.ttl;
  }

  /**
   * Store data in cache with current timestamp.
   */
  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Remove a specific key from cache.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get pending promise for a key (for request deduplication).
   */
  getPending(key: string): Promise<T> | null {
    return this.pending.get(key) || null;
  }

  /**
   * Set pending promise for a key.
   */
  setPending(key: string, promise: Promise<T>): void {
    this.pending.set(key, promise);
  }

  /**
   * Clear pending promise for a key.
   */
  clearPending(key: string): void {
    this.pending.delete(key);
  }
}
