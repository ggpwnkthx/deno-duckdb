/**
 * Cached DuckDB library loader
 *
 * This module provides automatic loading and caching of the DuckDB library.
 * The library is loaded on first use and cached for subsequent calls.
 */

import { load } from "@ggpwnkthx/libduckdb";
import type { symbols } from "@ggpwnkthx/libduckdb";

/** The loaded DuckDB library with FFI symbols */
export type DuckDBLibrary = Deno.DynamicLibrary<typeof symbols>;

let cachedLib: DuckDBLibrary | null = null;
let loadingPromise: Promise<DuckDBLibrary> | null = null;

/**
 * Get the cached DuckDB library
 *
 * On first call, this loads the library and caches it.
 * Subsequent calls return the cached library.
 *
 * @returns The loaded DuckDB library
 * @throws Error if loading fails
 */
export async function getLibrary(): Promise<DuckDBLibrary> {
  // Return cached library if already loaded
  if (cachedLib !== null) {
    return cachedLib;
  }

  // If already loading, wait for that to complete
  if (loadingPromise !== null) {
    return await loadingPromise;
  }

  // Start loading and cache the promise
  loadingPromise = (async (): Promise<DuckDBLibrary> => {
    const lib = await load();
    cachedLib = lib;
    loadingPromise = null;
    return lib;
  })();

  return await loadingPromise;
}

/**
 * Check if the library has been loaded
 */
export function isLibraryLoaded(): boolean {
  return cachedLib !== null;
}

/**
 * Get the cached library synchronously if already loaded
 * Returns null if library hasn't been loaded yet
 */
export function getLibrarySync(): DuckDBLibrary | null {
  return cachedLib;
}

/**
 * Reset the cached library (mainly for testing)
 */
export function resetLibrary(): void {
  if (cachedLib) {
    cachedLib.close();
    cachedLib = null;
  }
  loadingPromise = null;
}
