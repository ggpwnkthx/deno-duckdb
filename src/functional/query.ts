/**
 * Functional query operations
 */

import type {
  ColumnInfo,
  ConnectionHandle,
  DuckDBTypeValue,
  ResultHandle,
  RowData,
} from "../types.ts";
import {
  createPointerView,
  createResultBuffer,
  getPointer,
  isValidHandle,
  stringToPointer,
  validateConnectionHandle,
  validateResultHandle,
} from "../helpers.ts";
import { QueryError } from "../errors.ts";
import { getLibraryFast, getLibrarySync } from "../lib.ts";
import * as value from "./value.ts";

/**
 * Execute a SQL query
 *
 * @param connHandle - Connection handle
 * @param sql - SQL query string
 * @returns ResultHandle
 * @throws QueryError if query fails or handle is invalid
 */
export function execute(
  connHandle: ConnectionHandle,
  sql: string,
): ResultHandle {
  validateConnectionHandle(connHandle);
  if (!sql || !sql.trim()) {
    throw new QueryError("SQL query cannot be empty", sql);
  }

  const lib = getLibraryFast();
  const handle = createResultBuffer();
  const connPtr = getPointer(connHandle);
  const sqlPtr = stringToPointer(sql);

  const result = lib.symbols.duckdb_query(connPtr, sqlPtr, handle);

  if (result !== 0) {
    const errorPtr = lib.symbols.duckdb_result_error(handle);
    const view = createPointerView(errorPtr);
    const errorMsg = view ? view.getCString() : "Query failed";
    lib.symbols.duckdb_destroy_result(handle);
    throw new QueryError(errorMsg, sql);
  }

  return handle;
}

/**
 * Execute a SQL query and fetch all rows with automatic cleanup
 *
 * This is a convenience function that executes a query and automatically
 * destroys the result handle when done, returning just the rows.
 * Use this when you don't need to keep the result handle for further operations.
 *
 * @param connHandle - Connection handle
 * @param sql - SQL query string
 * @returns Array of rows
 * @throws QueryError if query fails
 */
export function executeAndFetchAll(
  connHandle: ConnectionHandle,
  sql: string,
): RowData[] {
  const resultHandle = execute(connHandle, sql);
  try {
    return value.fetchAll(resultHandle);
  } finally {
    destroyResult(resultHandle);
  }
}

/**
 * Get the number of rows in a result
 *
 * @param handle - Result handle
 * @returns Number of rows
 */
export function rowCount(
  handle: ResultHandle,
): bigint {
  validateResultHandle(handle);
  const lib = getLibraryFast();
  return lib.symbols.duckdb_row_count(handle);
}

/**
 * Get the number of columns in a result
 *
 * @param handle - Result handle
 * @returns Number of columns
 */
export function columnCount(
  handle: ResultHandle,
): bigint {
  validateResultHandle(handle);
  const lib = getLibraryFast();
  return lib.symbols.duckdb_column_count(handle);
}

/**
 * Get the name of a column
 *
 * @param handle - Result handle
 * @param index - Column index (0-based)
 * @returns Column name
 */
export function columnName(
  handle: ResultHandle,
  index: number,
): string {
  validateResultHandle(handle);
  const lib = getLibraryFast();
  const ptr = lib.symbols.duckdb_column_name(handle, BigInt(index));
  if (!ptr) return "";

  const view = createPointerView(ptr);
  if (!view) return "";

  return view.getCString();
}

/**
 * Get the type of a column
 *
 * @param handle - Result handle
 * @param index - Column index (0-based)
 * @returns Column type enum value
 */
export function columnType(
  handle: ResultHandle,
  index: number,
): DuckDBTypeValue {
  validateResultHandle(handle);
  const lib = getLibraryFast();
  return lib.symbols.duckdb_column_type(
    handle,
    BigInt(index),
  ) as DuckDBTypeValue;
}

/**
 * Get all column information
 *
 * @param handle - Result handle
 * @returns Array of ColumnInfo
 */
export function columnInfos(
  handle: ResultHandle,
): ColumnInfo[] {
  validateResultHandle(handle);
  const count = Number(columnCount(handle));
  const infos: ColumnInfo[] = [];

  for (let i = 0; i < count; i++) {
    infos.push({
      name: columnName(handle, i),
      type: columnType(handle, i),
    });
  }

  return infos;
}

/**
 * Destroy a query result
 *
 * @param handle - Result handle to destroy
 * @throws Error if handle is invalid
 */
export function destroyResult(
  handle: ResultHandle,
): void {
  validateResultHandle(handle);
  const lib = getLibraryFast();
  if (isValidHandle(handle)) {
    lib.symbols.duckdb_destroy_result(handle);
  }
}

/**
 * Destroy a query result (synchronous version)
 *
 * @param handle - Result handle to destroy
 */
export function destroyResultSync(
  handle: ResultHandle,
): void {
  validateResultHandle(handle);
  const lib = getLibrarySync();
  if (lib && isValidHandle(handle)) {
    lib.symbols.duckdb_destroy_result(handle);
  }
}
