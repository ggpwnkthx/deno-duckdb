/**
 * Shared helpers for DuckDB API
 */

import type { DuckDBLibrary } from "./types.ts";

/** Size of a pointer in bytes (64-bit) */
const POINTER_SIZE = 8;

/** Size of duckdb_result struct */
const RESULT_SIZE = 48;

/**
 * Create an 8-byte pointer buffer
 */
export function createPointerBuffer(): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new ArrayBuffer(POINTER_SIZE));
}

/**
 * Create a 48-byte result buffer
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
 */
export function stringToPointer(str: string): Deno.PointerObject<unknown> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str + "\0");
  return Deno.UnsafePointer.of(encoded) as unknown as Deno.PointerObject<
    unknown
  >;
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
