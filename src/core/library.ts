/**
 * Cached DuckDB library loader.
 *
 * Provides async/sync caching for the DuckDB native library to avoid
 * redundant loads. Supports both eager loading and lazy access patterns.
 */

import { load } from "@ggpwnkthx/libduckdb";
import type { symbols } from "@ggpwnkthx/libduckdb/symbols";
import { DuckDBError } from "../errors.ts";

/** DuckDB native library type. */
export type DuckDBLibrary = Deno.DynamicLibrary<typeof symbols>;

const loadedLibraries = new Map<string, DuckDBLibrary>();
const loadingLibraries = new Map<string, Promise<DuckDBLibrary>>();

/**
 * Generate a cache key from a library path.
 *
 * @param libPath - Optional path to the native library
 * @returns Normalized cache key string
 */
function libraryKey(libPath?: string): string {
  return libPath?.trim() ?? "";
}

/**
 * Load a DuckDB library with caching.
 *
 * Loads the native library asynchronously with deduplication - if a load
 * is already in progress for the same path, returns the existing promise.
 *
 * @param libPath - Optional path to the native library file
 * @param signal - Optional abort signal for cancellation
 * @returns Promise resolving to the loaded library
 * @throws {DuckDBError} if loading fails
 */
export async function getLibrary(
  libPath?: string,
  signal?: AbortSignal,
): Promise<DuckDBLibrary> {
  const key = libraryKey(libPath);
  const cached = loadedLibraries.get(key);
  if (cached) {
    return cached;
  }

  const inflight = loadingLibraries.get(key);
  if (inflight) {
    return inflight;
  }

  const promise = load(libPath, signal).then((library) => {
    loadedLibraries.set(key, library);
    return library;
  }).catch((cause) => {
    throw new DuckDBError({
      code: "LIBRARY_LOAD_FAILED",
      message: "Failed to load DuckDB native library",
      cause,
      context: { libPath },
    });
  }).finally(() => {
    loadingLibraries.delete(key);
  });

  loadingLibraries.set(key, promise);
  return await promise;
}

/**
 * Synchronously retrieve a cached library if available.
 *
 * @param libPath - Optional path to the native library
 * @returns Library if already loaded, null otherwise
 */
export function getLibrarySync(libPath?: string): DuckDBLibrary | null {
  return loadedLibraries.get(libraryKey(libPath)) ?? null;
}

/**
 * Synchronously retrieve a cached library, throwing if not loaded.
 *
 * Use this for fast path access when library is guaranteed to be loaded.
 *
 * @param libPath - Optional path to the native library
 * @returns The loaded library
 * @throws {DuckDBError} if the library hasn't been loaded yet
 */
export function getLibraryFast(libPath?: string): DuckDBLibrary {
  const library = loadedLibraries.get(libraryKey(libPath));
  if (!library) {
    throw new DuckDBError({
      code: "LIBRARY_LOAD_FAILED",
      message: "DuckDB library has not been loaded yet",
      context: { libPath },
    });
  }

  return library;
}
