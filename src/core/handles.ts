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
 * @returns Pointer value as bigint (little-endian)
 */
export function getPointerValue(handle: Uint8Array<ArrayBuffer>): bigint {
  return new DataView(handle.buffer, handle.byteOffset, handle.byteLength)
    .getBigUint64(0, true);
}

/**
 * Convert a bigint pointer value to a Deno pointer object.
 *
 * @param value - Pointer value as bigint
 * @returns Deno pointer object for FFI calls
 */
export function toPointerValue(
  value: bigint,
): Deno.PointerObject<unknown> {
  return value as unknown as Deno.PointerObject<unknown>;
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
