/**
 * Shared helpers for DuckDB API
 */

import type { DuckDBLibrary } from "./types.ts";

/** Size of a pointer in bytes (64-bit) */
const POINTER_SIZE = 8;

/** Size of duckdb_result struct */
const RESULT_SIZE = 48;

/** Pooled pointer buffer - reused across calls */
const pooledPointerBuffer = new Uint8Array(new ArrayBuffer(POINTER_SIZE));

/** Pooled result buffer - reused across calls */
const pooledResultBuffer = new Uint8Array(new ArrayBuffer(RESULT_SIZE));

/** TextEncoder instance - reused for string encoding */
const encoder = new TextEncoder();

/** Cache for encoded SQL strings - LRU with max size */
const stringCache = new Map<string, Deno.PointerObject<unknown>>();
const MAX_STRING_CACHE_SIZE = 1000;

/**
 * Get a pooled 8-byte pointer buffer
 * Note: Not thread-safe, but Deno FFI is single-threaded
 */
export function getPointerBuffer(): Uint8Array<ArrayBuffer> {
  return pooledPointerBuffer;
}

/**
 * Get a pooled 48-byte result buffer
 * Note: Not thread-safe, but Deno FFI is single-threaded
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
