/**
 * Functional database operations
 */

import type {
  DatabaseConfig,
  DatabaseHandle,
  DuckDBLibrary,
  OpenResult,
} from "../types.ts";
import {
  createPointerBuffer,
  getPointer,
  isValidHandle,
  stringToPointer,
} from "../helpers.ts";
import { DatabaseError } from "../errors.ts";

/**
 * Open a DuckDB database
 *
 * @param lib - The loaded DuckDB library
 * @param config - Database configuration options
 * @returns OpenResult with handle or error
 */
export function open(
  lib: DuckDBLibrary,
  config?: DatabaseConfig,
): OpenResult {
  const handle = createPointerBuffer();
  const path = config?.path ?? ":memory:";

  const pathPtr = stringToPointer(path);
  const result = lib.symbols.duckdb_open(pathPtr, handle);

  if (result !== 0) {
    return {
      handle,
      success: false,
      error: "Failed to open database",
    };
  }

  return {
    handle,
    success: true,
  };
}

/**
 * Open a DuckDB database (throws on error)
 *
 * @param lib - The loaded DuckDB library
 * @param config - Database configuration options
 * @returns DatabaseHandle
 * @throws DatabaseError if opening fails
 */
export function openOrThrow(
  lib: DuckDBLibrary,
  config?: DatabaseConfig,
): DatabaseHandle {
  const result = open(lib, config);
  if (!result.success) {
    throw new DatabaseError(result.error ?? "Failed to open database");
  }
  return result.handle;
}

/**
 * Close a DuckDB database
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Database handle to close
 */
export function closeDatabase(
  lib: DuckDBLibrary,
  handle: DatabaseHandle,
): void {
  if (isValidHandle(handle)) {
    lib.symbols.duckdb_close(handle);
  }
}

/**
 * Check if a database handle is valid
 */
export function isValidDatabase(handle: DatabaseHandle): boolean {
  return isValidHandle(handle);
}

/**
 * Get the database pointer value
 */
export function getPointerValue(handle: DatabaseHandle): bigint {
  return getPointer(handle);
}
