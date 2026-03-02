/**
 * Functional query operations
 */

import type {
  ColumnInfo,
  ConnectionHandle,
  DuckDBLibrary,
  QueryResult,
} from "../types.ts";
import {
  createResultBuffer,
  getPointer,
  isValidHandle,
  stringToPointer,
} from "../helpers.ts";
import { getErrorMessage } from "../errors.ts";

/**
 * Execute a SQL query
 *
 * @param lib - The loaded DuckDB library
 * @param connHandle - Connection handle
 * @param sql - SQL query string
 * @returns QueryResult with handle or error
 */
export function execute(
  lib: DuckDBLibrary,
  connHandle: ConnectionHandle,
  sql: string,
): QueryResult {
  const handle = createResultBuffer();
  const connPtr = getPointer(connHandle);
  const sqlPtr = stringToPointer(sql);

  const result = lib.symbols.duckdb_query(connPtr, sqlPtr, handle);

  if (result !== 0) {
    const errorPtr = lib.symbols.duckdb_result_error(handle);
    const errorMsg = getErrorMessage(errorPtr);
    lib.symbols.duckdb_destroy_result(handle);
    return {
      handle,
      success: false,
      error: errorMsg ?? "Query failed",
      query: sql,
    };
  }

  return {
    handle,
    success: true,
    query: sql,
  };
}

/**
 * Execute a SQL query (throws on error)
 *
 * @param lib - The loaded DuckDB library
 * @param connHandle - Connection handle
 * @param sql - SQL query string
 * @returns QueryResult
 * @throws Error if query fails
 */
export function executeOrThrow(
  lib: DuckDBLibrary,
  connHandle: ConnectionHandle,
  sql: string,
): QueryResult {
  const result = execute(lib, connHandle, sql);
  if (!result.success) {
    throw new Error(result.error ?? "Query failed");
  }
  return result;
}

/**
 * Get the number of rows in a result
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @returns Number of rows
 */
export function rowCount(
  lib: DuckDBLibrary,
  handle: Uint8Array<ArrayBuffer>,
): bigint {
  return lib.symbols.duckdb_row_count(handle);
}

/**
 * Get the number of columns in a result
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @returns Number of columns
 */
export function columnCount(
  lib: DuckDBLibrary,
  handle: Uint8Array<ArrayBuffer>,
): bigint {
  return lib.symbols.duckdb_column_count(handle);
}

/**
 * Get the name of a column
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @param index - Column index (0-based)
 * @returns Column name
 */
export function columnName(
  lib: DuckDBLibrary,
  handle: Uint8Array<ArrayBuffer>,
  index: number,
): string {
  const ptr = lib.symbols.duckdb_column_name(handle, BigInt(index));
  if (!ptr) return "";

  const ptrObj = ptr as unknown as Deno.PointerObject<unknown>;
  const view = new Deno.UnsafePointerView(ptrObj);
  const name = view.getCString();

  return name;
}

/**
 * Get the type of a column
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @param index - Column index (0-based)
 * @returns Column type enum value
 */
export function columnType(
  lib: DuckDBLibrary,
  handle: Uint8Array<ArrayBuffer>,
  index: number,
): number {
  return lib.symbols.duckdb_column_type(handle, BigInt(index)) as number;
}

/**
 * Get all column information
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @returns Array of ColumnInfo
 */
export function columnInfos(
  lib: DuckDBLibrary,
  handle: Uint8Array<ArrayBuffer>,
): ColumnInfo[] {
  const count = columnCount(lib, handle);
  const infos: ColumnInfo[] = [];

  for (let i = 0; i < count; i++) {
    infos.push({
      name: columnName(lib, handle, i),
      type: columnType(lib, handle, i),
    });
  }

  return infos;
}

/**
 * Destroy a query result
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle to destroy
 */
export function destroyResult(
  lib: DuckDBLibrary,
  handle: Uint8Array<ArrayBuffer>,
): void {
  if (isValidHandle(handle)) {
    lib.symbols.duckdb_destroy_result(handle);
  }
}
