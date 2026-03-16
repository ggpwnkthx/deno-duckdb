/**
 * Compatibility shims for the removed eager result cache.
 *
 * The v3 execution model returns lazy results directly, so there is no global
 * materialized-result cache to manage anymore. These helpers remain exported to
 * avoid hard breaks for callers that imported them previously.
 */

export function clearResultCache(): void {
  // Intentionally empty.
}

export function getResultCacheSize(): number {
  return 0;
}

export function invalidateCachedQuery(_sqlPattern: string): void {
  // Intentionally empty.
}
