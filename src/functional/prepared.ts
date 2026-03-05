/**
 * Functional prepared statement operations
 */

import type {
  ConnectionHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "../types.ts";
import {
  createPointerBuffer,
  createPointerView,
  createResultBuffer,
  getPointer,
  isValidHandle,
  stringToPointer,
} from "../helpers.ts";
import { DatabaseError } from "../errors.ts";
import { getLibrary, getLibrarySync } from "../lib.ts";

/** Value types that can be bound to prepared statements */
export type BindValue = boolean | number | bigint | string | null;

/**
 * Prepare a SQL statement
 *
 * @param connHandle - Connection handle
 * @param sql - SQL statement to prepare
 * @returns PreparedStatementHandle
 * @throws DatabaseError if preparation fails
 */
export async function prepare(
  connHandle: ConnectionHandle,
  sql: string,
): Promise<PreparedStatementHandle> {
  const lib = await getLibrary();
  const handle = createPointerBuffer();
  const connPtr = getPointer(connHandle);
  const sqlPtr = stringToPointer(sql);

  const result = lib.symbols.duckdb_prepare(connPtr, sqlPtr, handle);

  if (result !== 0) {
    const stmtPtr = getPointer(handle);
    const errorPtr = lib.symbols.duckdb_prepare_error(stmtPtr);
    const view = createPointerView(errorPtr);
    const errorMsg = view ? view.getCString() : "Failed to prepare statement";
    lib.symbols.duckdb_destroy_prepare(handle);
    throw new DatabaseError(errorMsg ?? "Failed to prepare statement");
  }

  return handle;
}

/**
 * Execute a prepared statement
 *
 * @param stmtHandle - Prepared statement handle
 * @returns ResultHandle
 * @throws DatabaseError if execution fails
 */
export async function executePrepared(
  stmtHandle: PreparedStatementHandle,
): Promise<ResultHandle> {
  const lib = await getLibrary();
  const handle = createResultBuffer();
  const stmtPtr = getPointer(stmtHandle);

  const result = lib.symbols.duckdb_execute_prepared(stmtPtr, handle);

  if (result !== 0) {
    const errorPtr = lib.symbols.duckdb_result_error(handle);
    const view = createPointerView(errorPtr);
    const errorMsg = view ? view.getCString() : "Execution failed";
    lib.symbols.duckdb_destroy_result(handle);
    throw new DatabaseError(errorMsg ?? "Execution failed");
  }

  return handle;
}

/**
 * Get the number of columns in a prepared statement result
 *
 * @param handle - Prepared statement handle
 * @returns Number of columns
 */
export async function preparedColumnCount(
  handle: PreparedStatementHandle,
): Promise<bigint> {
  const lib = await getLibrary();
  const ptr = getPointer(handle);
  return lib.symbols.duckdb_prepared_statement_column_count(ptr);
}

/**
 * Get the number of parameters in a prepared statement
 *
 * @param handle - Prepared statement handle
 * @returns Number of parameters
 */
export async function preparedParameterCount(
  handle: PreparedStatementHandle,
): Promise<bigint> {
  const lib = await getLibrary();
  const ptr = getPointer(handle);
  return lib.symbols.duckdb_bind_get_parameter_count(
    ptr as unknown as Deno.PointerValue<unknown>,
  );
}

/**
 * Bind parameters to a prepared statement
 *
 * @param handle - Prepared statement handle
 * @param params - Array of values to bind (in order)
 * @throws DatabaseError if binding fails
 */
export async function bind(
  handle: PreparedStatementHandle,
  params: BindValue[],
): Promise<void> {
  const lib = await getLibrary();
  const stmtPtr = getPointer(handle);

  // Set each parameter by index
  for (let i = 0; i < params.length; i++) {
    const idx = BigInt(i + 1); // DuckDB uses 1-based indexing
    const value = params[i];

    let result: number;

    if (value === null) {
      result = lib.symbols.duckdb_bind_null(stmtPtr, idx);
    } else if (typeof value === "boolean") {
      result = lib.symbols.duckdb_bind_boolean(stmtPtr, idx, value ? 1 : 0);
    } else if (typeof value === "number") {
      if (Number.isInteger(value)) {
        if (value >= -2147483648 && value <= 2147483647) {
          result = lib.symbols.duckdb_bind_int32(stmtPtr, idx, value);
        } else {
          result = lib.symbols.duckdb_bind_int64(stmtPtr, idx, BigInt(value));
        }
      } else {
        result = lib.symbols.duckdb_bind_double(stmtPtr, idx, value);
      }
    } else if (typeof value === "bigint") {
      result = lib.symbols.duckdb_bind_int64(stmtPtr, idx, value);
    } else if (typeof value === "string") {
      const ptr = stringToPointer(value);
      result = lib.symbols.duckdb_bind_varchar(
        stmtPtr,
        idx,
        ptr as Deno.PointerValue<unknown>,
      );
    } else {
      throw new DatabaseError(`Unsupported parameter type: ${typeof value}`);
    }

    if (result !== 0) {
      throw new DatabaseError(`Failed to bind parameter at index ${idx}`);
    }
  }
}

/**
 * Destroy a prepared statement
 *
 * @param handle - Prepared statement handle to destroy
 */
export async function destroyPrepared(
  handle: PreparedStatementHandle,
): Promise<void> {
  const lib = await getLibrary();
  if (isValidHandle(handle)) {
    lib.symbols.duckdb_destroy_prepare(handle);
  }
}

/**
 * Destroy a prepared statement (synchronous version)
 *
 * @param handle - Prepared statement handle to destroy
 */
export function destroyPreparedSync(
  handle: PreparedStatementHandle,
): void {
  const lib = getLibrarySync();
  if (lib && isValidHandle(handle)) {
    lib.symbols.duckdb_destroy_prepare(handle);
  }
}
