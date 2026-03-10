/**
 * Functional Arrow API for DuckDB
 *
 * Provides functions for working with DuckDB's Arrow streaming API,
 * which allows for memory-efficient processing of large result sets.
 */

import type {
  ArrowHandle,
  ArrowSchemaHandle,
  ColumnInfo,
  ConnectionHandle,
} from "../types.ts";
import { QueryError } from "../errors.ts";
import { getLibraryFast } from "../lib.ts";
import {
  createPointerBuffer,
  createPointerView,
  getPointer,
  isValidHandle,
  stringToPointer,
  validateArrowHandle,
  validateConnectionHandle,
} from "../helpers.ts";

/**
 * Execute a query and return an Arrow result handle
 *
 * This function executes a SQL query and returns an Arrow result that can be
 * streamed in chunks for memory-efficient processing of large datasets.
 *
 * @param connHandle - Connection handle
 * @param sql - SQL query string
 * @returns Arrow result handle
 * @throws QueryError if query fails
 */
export function queryArrow(
  connHandle: ConnectionHandle,
  sql: string,
): ArrowHandle {
  validateConnectionHandle(connHandle);
  if (!sql || !sql.trim()) {
    throw new QueryError("SQL query cannot be empty", sql);
  }

  const lib = getLibraryFast();
  const handle = createPointerBuffer();
  const connPtr = getPointer(connHandle);
  const sqlPtr = stringToPointer(sql);

  const result = lib.symbols.duckdb_query_arrow(
    connPtr,
    sqlPtr,
    handle,
  );

  if (result !== 0) {
    const arrowPtr = getPointer(handle);
    const errorPtr = lib.symbols.duckdb_query_arrow_error(arrowPtr);
    if (errorPtr) {
      const view = createPointerView(errorPtr);
      const errorMsg = view ? view.getCString() : "Query failed";
      lib.symbols.duckdb_destroy_arrow(handle);
      throw new QueryError(errorMsg, sql);
    }
    lib.symbols.duckdb_destroy_arrow(handle);
    throw new QueryError("Query failed", sql);
  }

  return handle;
}

/**
 * Get the number of rows from an Arrow result
 *
 * @param handle - Arrow result handle
 * @returns Number of rows
 */
export function arrowRowCount(handle: ArrowHandle): bigint {
  validateArrowHandle(handle);
  const lib = getLibraryFast();
  const ptr = getPointer(handle);
  return lib.symbols.duckdb_arrow_row_count(ptr);
}

/**
 * Get the number of columns from an Arrow result
 *
 * @param handle - Arrow result handle
 * @returns Number of columns
 */
export function arrowColumnCount(handle: ArrowHandle): bigint {
  validateArrowHandle(handle);
  const lib = getLibraryFast();
  const ptr = getPointer(handle);
  return lib.symbols.duckdb_arrow_column_count(ptr);
}

/**
 * Get the Arrow schema from an Arrow result
 *
 * @param handle - Arrow result handle
 * @returns Arrow schema handle
 */
export function arrowSchema(handle: ArrowHandle): ArrowSchemaHandle {
  validateArrowHandle(handle);
  const lib = getLibraryFast();
  const schemaHandle = createPointerBuffer();
  const ptr = getPointer(handle);
  lib.symbols.duckdb_query_arrow_schema(ptr, schemaHandle);
  return schemaHandle;
}

/**
 * Destroy an Arrow result
 *
 * @param handle - Arrow result handle to destroy
 */
export function destroyArrow(handle: ArrowHandle): void {
  if (!handle) return;
  const lib = getLibraryFast();
  if (lib && isValidHandle(handle)) {
    lib.symbols.duckdb_destroy_arrow(handle);
  }
}

/**
 * Destroy an Arrow stream
 *
 * @param handle - Arrow stream handle to destroy
 */
export function destroyArrowStream(handle: ArrowHandle): void {
  if (!handle) return;
  const lib = getLibraryFast();
  if (lib && isValidHandle(handle)) {
    lib.symbols.duckdb_destroy_arrow_stream(handle);
  }
}

/**
 * Get column information from Arrow schema
 * Note: This uses a fallback approach since not all Arrow schema functions
 * may be available in all versions of the DuckDB FFI.
 *
 * @param handle - Arrow result handle
 * @returns Array of ColumnInfo with generic names/types
 */
export function arrowColumnInfos(_handle: ArrowHandle): ColumnInfo[] {
  // Arrow schema extraction requires functions that may not be available
  // Return empty array - actual column info will come from DuckDB
  // through the standard result if needed
  return [];
}
