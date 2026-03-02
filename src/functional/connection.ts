/**
 * Functional connection operations
 */

import type {
  ConnectionHandle,
  ConnectResult,
  DatabaseHandle,
  DuckDBLibrary,
} from "../types.ts";
import { createPointerBuffer, getPointer, isValidHandle } from "../helpers.ts";

/**
 * Create a connection to a database
 *
 * @param lib - The loaded DuckDB library
 * @param dbHandle - Database handle
 * @returns ConnectResult with handle or error
 */
export function create(
  lib: DuckDBLibrary,
  dbHandle: DatabaseHandle,
): ConnectResult {
  const handle = createPointerBuffer();
  const dbPtr = getPointer(dbHandle);

  const result = lib.symbols.duckdb_connect(dbPtr, handle);

  if (result !== 0) {
    return {
      handle,
      success: false,
      error: "Failed to connect to database",
    };
  }

  return {
    handle,
    success: true,
  };
}

/**
 * Create a connection (throws on error)
 *
 * @param lib - The loaded DuckDB library
 * @param dbHandle - Database handle
 * @returns ConnectionHandle
 * @throws Error if connection fails
 */
export function createOrThrow(
  lib: DuckDBLibrary,
  dbHandle: DatabaseHandle,
): ConnectionHandle {
  const result = create(lib, dbHandle);
  if (!result.success) {
    throw new Error(result.error ?? "Failed to connect to database");
  }
  return result.handle;
}

/**
 * Close a connection
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Connection handle to close
 */
export function closeConnection(
  lib: DuckDBLibrary,
  handle: ConnectionHandle,
): void {
  if (isValidHandle(handle)) {
    lib.symbols.duckdb_disconnect(handle);
  }
}

/**
 * Check if a connection handle is valid
 */
export function isValidConnection(handle: ConnectionHandle): boolean {
  return isValidHandle(handle);
}

/**
 * Get the connection pointer value
 */
export function getPointerValueConnection(handle: ConnectionHandle): bigint {
  return getPointer(handle);
}
