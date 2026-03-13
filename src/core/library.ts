/**
 * Cached DuckDB library loader.
 */

import { load } from "@ggpwnkthx/libduckdb";
import type { symbols } from "@ggpwnkthx/libduckdb/symbols";
import { DuckDBError } from "../errors.ts";

export type DuckDBLibrary = Deno.DynamicLibrary<typeof symbols>;

const loadedLibraries = new Map<string, DuckDBLibrary>();
const loadingLibraries = new Map<string, Promise<DuckDBLibrary>>();

function libraryKey(libPath?: string): string {
  return libPath?.trim() ?? "";
}

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

export function getLibrarySync(libPath?: string): DuckDBLibrary | null {
  return loadedLibraries.get(libraryKey(libPath)) ?? null;
}

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

export function isLibraryLoaded(libPath?: string): boolean {
  return loadedLibraries.has(libraryKey(libPath));
}

export function resetLibrary(libPath?: string): void {
  if (libPath !== undefined) {
    const key = libraryKey(libPath);
    const library = loadedLibraries.get(key);
    if (library) {
      library.close();
      loadedLibraries.delete(key);
    }
    loadingLibraries.delete(key);
    return;
  }

  for (const library of loadedLibraries.values()) {
    library.close();
  }

  loadedLibraries.clear();
  loadingLibraries.clear();
}
