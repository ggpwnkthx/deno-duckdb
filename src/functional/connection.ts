/**
 * Functional connection operations
 */

import type { ConnectionHandle, DatabaseHandle } from "../types.ts";
import {
  createConnectionBuffer,
  getPointer,
  isValidHandle,
  validateConnectionHandle,
} from "../helpers.ts";
import { DatabaseError } from "../errors.ts";
import { getLibrary, getLibraryFast } from "../lib.ts";

/**
 * Create a connection to a database
 *
 * @param dbHandle - Database handle
 * @returns ConnectionHandle
 * @throws DatabaseError if connection fails
 */
export async function create(
  dbHandle: DatabaseHandle,
): Promise<ConnectionHandle> {
  const lib = await getLibrary();
  const handle = createConnectionBuffer();
  const dbPtr = getPointer(dbHandle);

  const result = lib.symbols.duckdb_connect(dbPtr, handle);

  if (result !== 0) {
    throw new DatabaseError("Failed to connect to database");
  }

  return handle;
}

/**
 * Close a connection
 *
 * @param handle - Connection handle to close
 * @throws Error if handle is invalid
 */
export function closeConnection(
  handle: ConnectionHandle,
): void {
  validateConnectionHandle(handle);
  const lib = getLibraryFast();
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
