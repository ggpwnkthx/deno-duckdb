/**
 * Cached DuckDB library loader
 *
 * This module provides automatic loading and caching of the DuckDB library.
 * The library is loaded on first use and cached for subsequent calls.
 */

import { load } from "@ggpwnkthx/libduckdb";
import type { symbols } from "@ggpwnkthx/libduckdb/symbols";
import { DatabaseError } from "./errors.ts";

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
 * @throws DatabaseError if loading fails
 */
export async function getLibrary(): Promise<DuckDBLibrary> {
  // Return cached library if already loaded
  if (cachedLib !== null) {
    return cachedLib;
  }

  // If already loading, wait for that to complete
  if (loadingPromise !== null) {
    return loadingPromise;
  }

  // Start loading and cache the promise
  loadingPromise = (async (): Promise<DuckDBLibrary> => {
    try {
      const lib = await load();
      cachedLib = lib;
      return lib;
    } finally {
      loadingPromise = null;
    }
  })();

  // Await to satisfy linter - loadingPromise needs to be awaited somewhere
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
 * Get the cached library synchronously, throwing if not loaded
 * This is the fastest path - use this in internal functions after library is loaded
 *
 * @returns The cached DuckDB library
 * @throws DatabaseError if library hasn't been loaded yet
 */
export function getLibraryFast(): DuckDBLibrary {
  if (!cachedLib) {
    throw new DatabaseError("Library not loaded. Call getLibrary() first.");
  }
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
