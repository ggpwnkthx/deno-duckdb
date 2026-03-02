/**
 * Functional prepared statement operations
 */

import type {
  ConnectionHandle,
  DuckDBLibrary,
  PreparedResult,
  PreparedStatementHandle,
  QueryResult,
} from "../types.ts";
import {
  createPointerBuffer,
  createResultBuffer,
  getPointer,
  isValidHandle,
  stringToPointer,
} from "../helpers.ts";
import { getErrorMessage } from "../errors.ts";

/**
 * Prepare a SQL statement
 *
 * @param lib - The loaded DuckDB library
 * @param connHandle - Connection handle
 * @param sql - SQL statement to prepare
 * @returns PreparedResult with handle or error
 */
export function prepare(
  lib: DuckDBLibrary,
  connHandle: ConnectionHandle,
  sql: string,
): PreparedResult {
  const handle = createPointerBuffer();
  const connPtr = getPointer(connHandle);
  const sqlPtr = stringToPointer(sql);

  const result = lib.symbols.duckdb_prepare(connPtr, sqlPtr, handle);

  if (result !== 0) {
    const stmtPtr = getPointer(handle);
    const errorPtr = lib.symbols.duckdb_prepare_error(stmtPtr);
    const errorMsg = errorPtr
      ? getErrorMessage(errorPtr as unknown as Deno.PointerValue<unknown>)
      : "Failed to prepare statement";
    lib.symbols.duckdb_destroy_prepare(handle);
    return {
      handle,
      success: false,
      error: errorMsg ?? "Failed to prepare statement",
    };
  }

  return {
    handle,
    success: true,
  };
}

/**
 * Prepare a SQL statement (throws on error)
 *
 * @param lib - The loaded DuckDB library
 * @param connHandle - Connection handle
 * @param sql - SQL statement to prepare
 * @returns PreparedStatementHandle
 * @throws Error if preparation fails
 */
export function prepareOrThrow(
  lib: DuckDBLibrary,
  connHandle: ConnectionHandle,
  sql: string,
): PreparedStatementHandle {
  const result = prepare(lib, connHandle, sql);
  if (!result.success) {
    throw new Error(result.error ?? "Failed to prepare statement");
  }
  return result.handle;
}

/**
 * Execute a prepared statement
 *
 * @param lib - The loaded DuckDB library
 * @param stmtHandle - Prepared statement handle
 * @returns QueryResult with handle or error
 */
export function executePrepared(
  lib: DuckDBLibrary,
  stmtHandle: PreparedStatementHandle,
): QueryResult {
  const handle = createResultBuffer();
  const stmtPtr = getPointer(stmtHandle);

  const result = lib.symbols.duckdb_execute_prepared(stmtPtr, handle);

  if (result !== 0) {
    const errorPtr = lib.symbols.duckdb_result_error(handle);
    const errorMsg = getErrorMessage(
      errorPtr as unknown as Deno.PointerValue<unknown>,
    );
    lib.symbols.duckdb_destroy_result(handle);
    return {
      handle,
      success: false,
      error: errorMsg ?? "Execution failed",
      query: "",
    };
  }

  return {
    handle,
    success: true,
    query: "",
  };
}

/**
 * Execute a prepared statement (throws on error)
 *
 * @param lib - The loaded DuckDB library
 * @param stmtHandle - Prepared statement handle
 * @returns QueryResult
 * @throws Error if execution fails
 */
export function executePreparedOrThrow(
  lib: DuckDBLibrary,
  stmtHandle: PreparedStatementHandle,
): QueryResult {
  const result = executePrepared(lib, stmtHandle);
  if (!result.success) {
    throw new Error(result.error ?? "Execution failed");
  }
  return result;
}

/**
 * Get the number of columns in a prepared statement result
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Prepared statement handle
 * @returns Number of columns
 */
export function preparedColumnCount(
  lib: DuckDBLibrary,
  handle: PreparedStatementHandle,
): bigint {
  const ptr = getPointer(handle);
  return lib.symbols.duckdb_prepared_statement_column_count(ptr);
}

/**
 * Destroy a prepared statement
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Prepared statement handle to destroy
 */
export function destroyPrepared(
  lib: DuckDBLibrary,
  handle: PreparedStatementHandle,
): void {
  if (isValidHandle(handle)) {
    lib.symbols.duckdb_destroy_prepare(handle);
  }
}
