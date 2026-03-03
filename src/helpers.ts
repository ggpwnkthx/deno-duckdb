/**
 * Shared helpers for DuckDB API
 */

import type { DuckDBLibrary } from "./types.ts";

/** Size of a pointer in bytes (64-bit) */
const POINTER_SIZE = 8;

/** Size of duckdb_result struct */
const RESULT_SIZE = 48;

/**
 * Pooled pointer buffer - reused across calls
 * Note: Deno FFI is single-threaded, so this is safe. Callers MUST copy
 * data from the buffer immediately, as subsequent calls will overwrite it.
 */
const pooledPointerBuffer = new Uint8Array(new ArrayBuffer(POINTER_SIZE));

/**
 * Pooled result buffer - reused across calls
 * Note: Deno FFI is single-threaded, so this is safe. Callers MUST copy
 * data from the buffer immediately, as subsequent calls will overwrite it.
 */
const pooledResultBuffer = new Uint8Array(new ArrayBuffer(RESULT_SIZE));

/** TextEncoder instance - reused for string encoding */
const encoder = new TextEncoder();

/** Cache for encoded SQL strings - LRU with max size */
const stringCache = new Map<string, Deno.PointerObject<unknown>>();
const MAX_STRING_CACHE_SIZE = 1000;

/**
 * Get a pooled 8-byte pointer buffer
 * @deprecated Use createPointerBuffer() for fresh buffers when you need to retain data
 * Note: Deno FFI is single-threaded, so this is safe. Callers MUST copy
 * data from the buffer immediately, as subsequent calls will overwrite it.
 */
export function getPointerBuffer(): Uint8Array<ArrayBuffer> {
  return pooledPointerBuffer;
}

/**
 * Get a pooled 48-byte result buffer
 * @deprecated Use createResultBuffer() for fresh buffers when you need to retain data
 * Note: Deno FFI is single-threaded, so this is safe. Callers MUST copy
 * data from the buffer immediately, as subsequent calls will overwrite it.
 */
export function getResultBuffer(): Uint8Array<ArrayBuffer> {
  return pooledResultBuffer;
}

/**
 * Create an 8-byte pointer buffer (for cases where you need a fresh buffer)
 */
export function createPointerBuffer(): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new ArrayBuffer(POINTER_SIZE));
}

/**
 * Create a 48-byte result buffer (for cases where you need a fresh buffer)
 */
export function createResultBuffer(): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new ArrayBuffer(RESULT_SIZE));
}

/**
 * Extract pointer value from handle buffer
 */
export function getPointer(buffer: Uint8Array): bigint {
  return new DataView(buffer.buffer).getBigUint64(0, true);
}

/**
 * Convert string to FFI pointer
 * Uses LRU caching to avoid repeated encoding of the same strings
 */
export function stringToPointer(str: string): Deno.PointerObject<unknown> {
  // Check cache first
  const cached = stringCache.get(str);
  if (cached) {
    // Move to end (most recently used)
    stringCache.delete(str);
    stringCache.set(str, cached);
    return cached;
  }

  // Encode string with null terminator
  const encoded = encoder.encode(str + "\0");
  const ptr = Deno.UnsafePointer.of(encoded) as unknown as Deno.PointerObject<
    unknown
  >;

  // Evict oldest entry if at capacity
  if (stringCache.size >= MAX_STRING_CACHE_SIZE) {
    const firstKey = stringCache.keys().next().value;
    if (firstKey) {
      stringCache.delete(firstKey);
    }
  }

  stringCache.set(str, ptr);
  return ptr;
}

/**
 * Check if a handle is valid (non-zero pointer)
 */
export function isValidHandle(buffer: Uint8Array): boolean {
  return getPointer(buffer) !== 0n;
}

/**
 * Free a string allocated by DuckDB
 */
export function freeString(
  lib: DuckDBLibrary,
  ptr: Deno.PointerValue<unknown>,
): void {
  lib.symbols.duckdb_free(ptr);
}

/**
 * Get available DuckDB configuration options
 * @param lib - The loaded DuckDB library
 * @returns Array of valid config option names
 */
export function getConfigOptions(lib: DuckDBLibrary): string[] {
  const count = lib.symbols.duckdb_config_count();
  const options: string[] = [];

  for (let i = 0; i < count; i++) {
    const nameBuffer = createPointerBuffer();
    const descBuffer = createPointerBuffer();

    lib.symbols.duckdb_get_config_flag(
      BigInt(i),
      nameBuffer,
      descBuffer,
    );

    // Read the name pointer from the output buffer
    const namePtr = getPointer(nameBuffer);
    if (namePtr !== 0n) {
      const view = new Deno.UnsafePointerView(
        namePtr as unknown as Deno.PointerObject<unknown>,
      );
      const name = view.getCString();
      if (name) {
        options.push(name);
      }
    }

    // Free the description string
    const descPtr = getPointer(descBuffer);
    if (descPtr !== 0n) {
      lib.symbols.duckdb_free(descPtr as unknown as Deno.PointerValue<unknown>);
    }
  }

  return options;
}
