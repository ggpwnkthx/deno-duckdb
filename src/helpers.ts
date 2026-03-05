/**
 * Shared helpers for DuckDB API
 */

import type { DuckDBLibrary } from "./lib.ts";
import type {
  ConnectionHandle,
  DatabaseHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "./types.ts";
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

/** Cache entry that stores both bytes and pointer to prevent use-after-free */
interface CacheEntry {
  bytes: Uint8Array;
  ptr: Deno.PointerObject<unknown>;
}

/** Cache for encoded SQL strings - LRU with max size */
const stringCache = new Map<string, CacheEntry>();
const MAX_STRING_CACHE_SIZE = 1000;

/**
 * Create an 8-byte pointer buffer for database/connection/prepared handles
 */
export function createPointerBuffer(): DatabaseHandle {
  return new Uint8Array(new ArrayBuffer(POINTER_SIZE)) as DatabaseHandle;
}

/**
 * Create an 8-byte connection handle buffer
 */
export function createConnectionBuffer(): ConnectionHandle {
  return new Uint8Array(new ArrayBuffer(POINTER_SIZE)) as ConnectionHandle;
}

/**
 * Create an 8-byte prepared statement handle buffer
 */
export function createPreparedBuffer(): PreparedStatementHandle {
  return new Uint8Array(
    new ArrayBuffer(POINTER_SIZE),
  ) as PreparedStatementHandle;
}

/**
 * Create a 48-byte result buffer
 */
export function createResultBuffer(): ResultHandle {
  return new Uint8Array(new ArrayBuffer(RESULT_SIZE)) as ResultHandle;
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
 */
export function stringToPointer(
  str: string,
): Deno.PointerObject<unknown> {
  // Check cache first
  const cached = stringCache.get(str);
  if (cached) {
    // Move to end (most recently used)
    stringCache.delete(str);
    stringCache.set(str, cached);
    return cached.ptr;
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

  // Store both bytes and pointer to keep memory alive
  stringCache.set(str, { bytes: encoded, ptr: ptr });
  return ptr;
}

/**
 * Check if a handle is valid (non-zero pointer)
 */
export function isValidHandle(buffer: Uint8Array): boolean {
  return getPointer(buffer) !== 0n;
}

/**
 * Validate that a buffer is a valid handle (has correct byte length)
 * Note: This does NOT check if the handle is valid (non-zero pointer) -
 *       callers should use isValidHandle() for that check if needed.
 * @param buffer - The buffer to validate
 * @param expectedSize - Expected byte size of the handle
 * @param name - Name of the handle type for error messages
 * @throws Error if buffer is not a valid buffer of the expected size
 */
export function validateHandle(
  buffer: unknown,
  expectedSize: number,
  name: string,
): asserts buffer is Uint8Array {
  if (!(buffer instanceof Uint8Array)) {
    throw new Error(`${name} must be a Uint8Array`);
  }
  if (buffer.length !== expectedSize) {
    throw new Error(
      `${name} must be ${expectedSize} bytes, got ${buffer.length}`,
    );
  }
}

/**
 * Validate a database handle
 */
export function validateDatabaseHandle(
  handle: unknown,
): asserts handle is DatabaseHandle {
  validateHandle(handle, POINTER_SIZE, "DatabaseHandle");
}

/**
 * Validate a connection handle
 */
export function validateConnectionHandle(
  handle: unknown,
): asserts handle is ConnectionHandle {
  validateHandle(handle, POINTER_SIZE, "ConnectionHandle");
}

/**
 * Validate a result handle
 */
export function validateResultHandle(
  handle: unknown,
): asserts handle is ResultHandle {
  validateHandle(handle, RESULT_SIZE, "ResultHandle");
}

/**
 * Validate a prepared statement handle
 */
export function validatePreparedHandle(
  handle: unknown,
): asserts handle is PreparedStatementHandle {
  validateHandle(handle, POINTER_SIZE, "PreparedStatementHandle");
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
 * Returns null for null pointer values
 */
export function pointerValueToObject(
  ptr: Deno.PointerValue<unknown>,
): Deno.PointerObject<unknown> | null {
  if (!ptr) {
    return null;
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

/**
 * Check if a value at the given row index is null according to the null mask
 * @param nullMaskView - Pointer view to the null mask (can be null)
 * @param rowIndex - Row index to check
 * @returns true if the value is null, false otherwise
 */
export function isNullFromMask(
  nullMaskView: Deno.UnsafePointerView | null,
  rowIndex: number,
): boolean {
  if (!nullMaskView) {
    return false;
  }
  // The null mask is a bitmap stored as uint64_t array
  // Each bit indicates if the corresponding row is NULL
  // wordIndex = row / 64, bitIndex = row % 64
  const wordIndex = rowIndex >>> 6; // rowIndex / 64
  const bitIndex = rowIndex & 63; // rowIndex % 64
  const nullMask = nullMaskView.getBigUint64(wordIndex * 8);
  return (nullMask & (1n << BigInt(bitIndex))) !== 0n;
}
