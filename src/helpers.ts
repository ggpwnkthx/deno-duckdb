/**
 * Shared helpers for DuckDB API
 */

import type { DuckDBLibrary } from "./lib.ts";
import { DuckDBType, type DuckDBTypeValue } from "./types.ts";

/** Size of a pointer in bytes (64-bit) */
const POINTER_SIZE = 8;

/** Size of duckdb_result struct */
const RESULT_SIZE = 48;

/** Byte size for 32-bit values (INT32, FLOAT) */
const BYTE_SIZE_32 = 4;

/** Byte size for 64-bit values (INT64, DOUBLE, pointers) */
const BYTE_SIZE_64 = 8;

/**
 * Check if a DuckDB type is a string type (requires pointer dereferencing)
 * String types: VARCHAR, BLOB, DECIMAL, TIMESTAMP, DATE, TIME
 */
export function isStringType(type: DuckDBTypeValue): boolean {
  return (
    type === DuckDBType.VARCHAR ||
    type === DuckDBType.BLOB ||
    type === DuckDBType.DECIMAL ||
    type === DuckDBType.TIMESTAMP ||
    type === DuckDBType.DATE ||
    type === DuckDBType.TIME
  );
}

/** Export byte size constants */
export { BYTE_SIZE_32, BYTE_SIZE_64, POINTER_SIZE, RESULT_SIZE };

/** TextEncoder instance - reused for string encoding */
const encoder = new TextEncoder();

/** Cache for encoded SQL strings - LRU with max size */
const stringCache = new Map<string, Deno.PointerObject<unknown>>();
const MAX_STRING_CACHE_SIZE = 1000;

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
 * @param str - The string to convert
 * @param lib - Optional DuckDB library for freeing evicted cache entries
 */
export function stringToPointer(
  str: string,
  _lib?: DuckDBLibrary,
): Deno.PointerObject<unknown> {
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
  // Deno.UnsafePointer can be safely cast to PointerObject for our use case
  const ptr = Deno.UnsafePointer.of(encoded) as Deno.PointerObject<unknown>;

  // Evict oldest entry if at capacity
  if (stringCache.size >= MAX_STRING_CACHE_SIZE) {
    const firstKey = stringCache.keys().next().value;
    if (firstKey) {
      // Note: We don't call duckdb_free() here because the pointer refers to
      // JS-managed memory (Uint8Array), not DuckDB-allocated memory.
      // The Uint8Array will be garbage collected when evicted from cache.
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
 * Convert Deno.PointerValue to Deno.PointerObject safely
 */
export function pointerValueToObject(
  ptr: Deno.PointerValue<unknown>,
): Deno.PointerObject<unknown> {
  if (!ptr) {
    // Return null pointer for null case
    return null as unknown as Deno.PointerObject<unknown>;
  }
  return ptr as Deno.PointerObject<unknown>;
}

/**
 * Safely create UnsafePointerView from Deno.PointerValue
 */
export function createPointerView(
  ptr: Deno.PointerValue<unknown>,
): Deno.UnsafePointerView | null {
  if (!ptr) return null;
  return new Deno.UnsafePointerView(ptr as Deno.PointerObject<unknown>);
}
