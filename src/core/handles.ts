/**
 * Handle, pointer, and low-level memory helpers.
 *
 * Provides utilities for creating, validating, and manipulating DuckDB handles
 * and FFI pointer values. Includes type-safe handle creation with branded types.
 */

import type {
  ConnectionHandle,
  DatabaseHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "../types.ts";
import { ValidationError } from "../errors.ts";

/** Size of a pointer in bytes (8 bytes for 64-bit). */
export const POINTER_SIZE = 8;

// Pointer range validation constants
// User-space addresses on 64-bit systems typically start at 0x1000 (page-aligned)
// The maximum addressable space is far larger, but we use a conservative bound
/** Minimum plausible non-null pointer value (page-aligned). */
const MIN_VALID_POINTER = 0x1000n;
/** Maximum plausible pointer value for user-space (256TB, conservative). */
const MAX_VALID_POINTER = 1n << 48n;
/** Size of a duckdb_result struct in bytes. */
export const RESULT_SIZE = 48;

/**
 * Create a zeroed buffer of the specified size.
 *
 * @internal
 * @param size - Size in bytes
 * @returns Zeroed Uint8Array buffer
 */
function createHandle<T extends Uint8Array<ArrayBuffer>>(size: number): T {
  return new Uint8Array(new ArrayBuffer(size)) as T;
}

/**
 * Create an empty database handle.
 *
 * @returns A zeroed 8-byte buffer for database pointer
 */
export function createDatabaseHandle(): DatabaseHandle {
  return createHandle<DatabaseHandle>(POINTER_SIZE);
}

/**
 * Create an empty connection handle.
 *
 * @returns A zeroed 8-byte buffer for connection pointer
 */
export function createConnectionHandle(): ConnectionHandle {
  return createHandle<ConnectionHandle>(POINTER_SIZE);
}

/**
 * Create an empty prepared statement handle.
 *
 * @returns A zeroed 8-byte buffer for prepared statement pointer
 */
export function createPreparedStatementHandle(): PreparedStatementHandle {
  return createHandle<PreparedStatementHandle>(POINTER_SIZE);
}

/**
 * Create an empty result handle.
 *
 * @returns A zeroed 48-byte buffer for duckdb_result struct
 */
export function createResultHandle(): ResultHandle {
  return createHandle<ResultHandle>(RESULT_SIZE);
}

/**
 * Read a 64-bit pointer value from a handle buffer.
 *
 * @param handle - Handle buffer to read from
 * @returns Pointer value as bigint (little-endian), or 0n if null
 */
export function getPointerValue(handle: Uint8Array<ArrayBuffer>): bigint {
  return new DataView(handle.buffer, handle.byteOffset, handle.byteLength)
    .getBigUint64(0, true);
}

/**
 * A raw opaque pointer value returned from DuckDB's C API.
 *
 * This is a bigint representation of a memory address. Zero (0n) represents
 * a null pointer. This type is used internally to represent handles before
 * they are validated and converted to FFI pointer types.
 *
 * @see toDenoPointerValue for conversion to Deno's pointer types
 */
export type OpaquePointer = bigint;

/**
 * Convert a raw opaque pointer to Deno's PointerValue type.
 *
 * This is the FFI boundary conversion: DuckDB returns opaque pointers as bigint
 * addresses, but Deno's FFI functions expect PointerValue. This function validates
 * that the pointer is non-null before converting.
 *
 * @param value - Raw pointer value from DuckDB (bigint)
 * @returns Deno PointerValue for FFI calls
 * @throws {ValidationError} if pointer is null (0n)
 */
export function toDenoPointerValue(
  value: OpaquePointer,
): Deno.PointerValue<unknown> {
  if (value === 0n) {
    throw new ValidationError("Cannot convert null pointer to PointerValue", {
      value: "0n",
    });
  }

  // Validate pointer is in a plausible range to catch corrupted values
  if (value < MIN_VALID_POINTER || value > MAX_VALID_POINTER) {
    throw new ValidationError("Pointer value is out of valid range", {
      value: value.toString(),
      min: MIN_VALID_POINTER.toString(),
      max: MAX_VALID_POINTER.toString(),
    });
  }

  // Deno's PointerObject is fundamentally a wrapper around a pointer address.
  // The cast is necessary because there's no safe way to construct a PointerObject
  // from a raw bigint - they're typically returned from FFI calls. This works
  // because the bigint represents a valid memory address from DuckDB.
  //
  // Boundary semantics: We've validated value !== 0n and is in valid range.
  // The PointerValue type accepts non-null pointers (which become PointerObject at runtime).
  return value as unknown as Deno.PointerValue<unknown>;
}

/**
 * @deprecated Use toDenoPointerValue instead. Kept for backward compatibility.
 * @see toDenoPointerValue
 */
export function toPointerValue(
  value: bigint,
): Deno.PointerObject<unknown> {
  return toDenoPointerValue(value) as Deno.PointerObject<unknown>;
}

/**
 * Require a valid (non-null) opaque pointer value from a handle.
 *
 * @param handle - Handle buffer to extract pointer from
 * @param label - Human-readable label for error messages
 * @returns Pointer value as bigint
 * @throws {ValidationError} if handle is closed or null
 */
export function requireOpaqueHandle(
  handle: Uint8Array<ArrayBuffer>,
  label: string,
): bigint {
  const value = getPointerValue(handle);
  if (value === 0n) {
    throw new ValidationError(`${label} is closed or null`, { label });
  }

  return value;
}

/**
 * Check if a handle points to a valid (non-null) resource.
 *
 * @param handle - Handle buffer to check
 * @returns true if handle has a non-null pointer
 */
export function isValidHandle(handle: Uint8Array<ArrayBuffer>): boolean {
  return getPointerValue(handle) !== 0n;
}

/**
 * Validate that a handle has the expected byte size.
 *
 * @internal
 * @param handle - Value to validate
 * @param expectedSize - Expected size in bytes
 * @param label - Human-readable label for error messages
 * @throws {ValidationError} if validation fails
 */
function validateHandleSize(
  handle: unknown,
  expectedSize: number,
  label: string,
): asserts handle is Uint8Array<ArrayBuffer> {
  if (!(handle instanceof Uint8Array)) {
    throw new ValidationError(`${label} must be a Uint8Array`, {
      expectedSize,
      receivedType: typeof handle,
    });
  }

  if (handle.byteLength !== expectedSize) {
    throw new ValidationError(
      `${label} must be ${expectedSize} bytes, got ${handle.byteLength}`,
      { expectedSize, receivedSize: handle.byteLength },
    );
  }
}

/**
 * Validate a value as a DatabaseHandle.
 *
 * @param handle - Value to validate
 * @throws {ValidationError} if not a valid DatabaseHandle
 */
export function validateDatabaseHandle(
  handle: unknown,
): asserts handle is DatabaseHandle {
  validateHandleSize(handle, POINTER_SIZE, "DatabaseHandle");
}

/**
 * Validate a value as a ConnectionHandle.
 *
 * @param handle - Value to validate
 * @throws {ValidationError} if not a valid ConnectionHandle
 */
export function validateConnectionHandle(
  handle: unknown,
): asserts handle is ConnectionHandle {
  validateHandleSize(handle, POINTER_SIZE, "ConnectionHandle");
}

/**
 * Validate a value as a PreparedStatementHandle.
 *
 * @param handle - Value to validate
 * @throws {ValidationError} if not a valid PreparedStatementHandle
 */
export function validatePreparedStatementHandle(
  handle: unknown,
): asserts handle is PreparedStatementHandle {
  validateHandleSize(handle, POINTER_SIZE, "PreparedStatementHandle");
}

/**
 * Validate a value as a ResultHandle.
 *
 * @param handle - Value to validate
 * @throws {ValidationError} if not a valid ResultHandle
 */
export function validateResultHandle(
  handle: unknown,
): asserts handle is ResultHandle {
  validateHandleSize(handle, RESULT_SIZE, "ResultHandle");
}

/**
 * Create an unsafe pointer view from a pointer value.
 *
 * @param pointer - Pointer value (can be null)
 * @returns UnsafePointerView for reading C data, or null if pointer is null
 */
export function createPointerView(
  pointer: Deno.PointerValue<unknown>,
): Deno.UnsafePointerView | null {
  if (!pointer) {
    return null;
  }

  return new Deno.UnsafePointerView(
    pointer as Deno.PointerObject<unknown>,
  );
}
