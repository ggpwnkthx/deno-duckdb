/**
 * Functional database operations
 */

import type { DatabaseConfig, DatabaseHandle } from "../types.ts";
import {
  createPointerBuffer,
  createPointerView,
  getPointer,
  isValidHandle,
  stringToPointer,
  validateDatabaseHandle,
} from "../helpers.ts";
import { DatabaseError } from "../errors.ts";
import { getLibrary, getLibraryFast } from "../lib.ts";

/**
 * Open a DuckDB database
 *
 * @param config - Database configuration options
 * @returns DatabaseHandle
 * @throws DatabaseError if opening fails
 */
export async function open(
  config?: DatabaseConfig,
): Promise<DatabaseHandle> {
  const lib = await getLibrary();
  const handle = createPointerBuffer();
  const path = config?.path ?? ":memory:";
  const pathPtr = stringToPointer(path);

  // Determine if we need to use extended open API
  // Use it properties other than 'path' when config has any
  const configKeys = config
    ? Object.keys(config).filter((k) => k !== "path")
    : [];
  const useExtendedApi = configKeys.length > 0;

  if (useExtendedApi) {
    const configPtrPtr = createPointerBuffer();
    const configResult = lib.symbols.duckdb_create_config(configPtrPtr);

    if (configResult !== 0) {
      throw new DatabaseError("Failed to create database config");
    }

    // Get the actual config pointer from the output buffer
    const configPtr = getPointer(configPtrPtr);

    // Iterate through all config properties except 'path'
    for (const key of configKeys) {
      let name = key;
      let value = config?.[key] ?? "";

      // Handle special accessMode -> access_mode conversion
      if (key === "accessMode") {
        name = "access_mode";
        const normalizedValue = String(value).toLowerCase();
        value = normalizedValue === "read_only" ? "READ_ONLY" : "READ_WRITE";
      }

      // Skip undefined or empty values
      if (!value) continue;

      const namePtr = stringToPointer(name);
      const valuePtr = stringToPointer(value);

      // duckdb_set_config(config, name, value)
      const setConfigResult = lib.symbols.duckdb_set_config(
        configPtr,
        namePtr,
        valuePtr,
      );

      if (setConfigResult !== 0) {
        lib.symbols.duckdb_destroy_config(configPtrPtr);
        throw new DatabaseError(`Failed to set config option: ${key}`);
      }
    }

    // duckdb_open_ext(path, out_database, config, error)
    const errorBuffer = createPointerBuffer();
    const openResult = lib.symbols.duckdb_open_ext(
      pathPtr,
      handle,
      configPtr,
      errorBuffer,
    );
    lib.symbols.duckdb_destroy_config(configPtrPtr);

    if (openResult !== 0) {
      const errorPtr = getPointer(errorBuffer);
      let errorMsg = "Failed to open database";
      if (errorPtr !== 0n) {
        const errorView = createPointerView(
          errorPtr as unknown as Deno.PointerValue<unknown>,
        );
        if (errorView) {
          errorMsg = errorView.getCString();
        }
        // Free the error message allocated by DuckDB
        lib.symbols.duckdb_free(
          errorPtr as unknown as Deno.PointerValue<unknown>,
        );
      }
      throw new DatabaseError(errorMsg);
    }

    return handle;
  }

  // Use simple open API when no config options
  const result = lib.symbols.duckdb_open(pathPtr, handle);

  if (result !== 0) {
    throw new DatabaseError("Failed to open database");
  }

  return handle;
}

/**
 * Close a DuckDB database
 *
 * @param handle - Database handle to close
 * @throws Error if handle is not a valid buffer (type check failure)
 */
export function closeDatabase(
  handle: DatabaseHandle,
): void {
  // Validate the handle type and size, but not validity (for backward compatibility)
  validateDatabaseHandle(handle);
  const lib = getLibraryFast();
  if (isValidHandle(handle)) {
    lib.symbols.duckdb_close(handle);
  }
}

/**
 * Check if a database handle is valid
 */
export function isValidDatabase(handle: DatabaseHandle): boolean {
  validateDatabaseHandle(handle);
  return isValidHandle(handle);
}

/**
 * Get the database pointer value
 */
export function getPointerValue(handle: DatabaseHandle): bigint {
  validateDatabaseHandle(handle);
  return getPointer(handle);
}
