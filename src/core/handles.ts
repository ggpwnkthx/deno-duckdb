/**
 * Handle, pointer, and low-level memory helpers.
 */

import type {
  ConnectionHandle,
  DatabaseHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "../types.ts";
import { ValidationError } from "../errors.ts";

export const POINTER_SIZE = 8;
export const RESULT_SIZE = 48;

/**
 * Fixed-width byte sizes used by DuckDB's legacy result memory layout.
 *
 * These sizes match the libduckdb C ABI targeted by
 * `@ggpwnkthx/libduckdb@1.0.14` (DuckDB 1.4.4).
 */
export const BYTE_SIZE_8 = 1;
export const BYTE_SIZE_16 = 2;
export const BYTE_SIZE_32 = 4;
export const BYTE_SIZE_64 = 8;
export const BYTE_SIZE_128 = 16;

function createHandle<T extends Uint8Array<ArrayBuffer>>(size: number): T {
  return new Uint8Array(new ArrayBuffer(size)) as T;
}

export function createDatabaseHandle(): DatabaseHandle {
  return createHandle<DatabaseHandle>(POINTER_SIZE);
}

export function createConnectionHandle(): ConnectionHandle {
  return createHandle<ConnectionHandle>(POINTER_SIZE);
}

export function createPreparedStatementHandle(): PreparedStatementHandle {
  return createHandle<PreparedStatementHandle>(POINTER_SIZE);
}

export function createResultHandle(): ResultHandle {
  return createHandle<ResultHandle>(RESULT_SIZE);
}

export function getPointerValue(handle: Uint8Array<ArrayBuffer>): bigint {
  return new DataView(handle.buffer, handle.byteOffset, handle.byteLength)
    .getBigUint64(0, true);
}

export function toPointerValue(
  value: bigint,
): Deno.PointerObject<unknown> {
  return value as unknown as Deno.PointerObject<unknown>;
}

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

export function isValidHandle(handle: Uint8Array<ArrayBuffer>): boolean {
  return getPointerValue(handle) !== 0n;
}

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

export function validateDatabaseHandle(
  handle: unknown,
): asserts handle is DatabaseHandle {
  validateHandleSize(handle, POINTER_SIZE, "DatabaseHandle");
}

export function validateConnectionHandle(
  handle: unknown,
): asserts handle is ConnectionHandle {
  validateHandleSize(handle, POINTER_SIZE, "ConnectionHandle");
}

export function validatePreparedStatementHandle(
  handle: unknown,
): asserts handle is PreparedStatementHandle {
  validateHandleSize(handle, POINTER_SIZE, "PreparedStatementHandle");
}

export function validateResultHandle(
  handle: unknown,
): asserts handle is ResultHandle {
  validateHandleSize(handle, RESULT_SIZE, "ResultHandle");
}

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
