/**
 * Functional query operations
 */

import type { ColumnInfo, ConnectionHandle, ResultHandle } from "../types.ts";
import {
  getPointer,
  getResultBuffer,
  isValidHandle,
  stringToPointer,
} from "../helpers.ts";
import { QueryError } from "../errors.ts";
import { getLibrary } from "../lib.ts";

/**
 * Execute a SQL query
 *
 * @param connHandle - Connection handle
 * @param sql - SQL query string
 * @returns ResultHandle
 * @throws QueryError if query fails
 */
export async function execute(
  connHandle: ConnectionHandle,
  sql: string,
): Promise<ResultHandle> {
  const lib = await getLibrary();
  const handle = getResultBuffer();
  const connPtr = getPointer(connHandle);
  const sqlPtr = stringToPointer(sql);

  const result = lib.symbols.duckdb_query(connPtr, sqlPtr, handle);

  if (result !== 0) {
    const errorPtr = lib.symbols.duckdb_result_error(handle);
    const errorMsg = errorPtr
      ? new Deno.UnsafePointerView(
        errorPtr as unknown as Deno.PointerObject<unknown>,
      ).getCString()
      : "Query failed";
    lib.symbols.duckdb_destroy_result(handle);
    throw new QueryError(errorMsg, sql);
  }

  return handle;
}

/**
 * Get the number of rows in a result
 *
 * @param handle - Result handle
 * @returns Number of rows
 */
export async function rowCount(
  handle: Uint8Array<ArrayBuffer>,
): Promise<bigint> {
  const lib = await getLibrary();
  return lib.symbols.duckdb_row_count(handle);
}

/**
 * Get the number of columns in a result
 *
 * @param handle - Result handle
 * @returns Number of columns
 */
export async function columnCount(
  handle: Uint8Array<ArrayBuffer>,
): Promise<bigint> {
  const lib = await getLibrary();
  return lib.symbols.duckdb_column_count(handle);
}

/**
 * Get the name of a column
 *
 * @param handle - Result handle
 * @param index - Column index (0-based)
 * @returns Column name
 */
export async function columnName(
  handle: Uint8Array<ArrayBuffer>,
  index: number,
): Promise<string> {
  const lib = await getLibrary();
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
 * @param handle - Result handle
 * @param index - Column index (0-based)
 * @returns Column type enum value
 */
export async function columnType(
  handle: Uint8Array<ArrayBuffer>,
  index: number,
): Promise<number> {
  const lib = await getLibrary();
  return lib.symbols.duckdb_column_type(handle, BigInt(index)) as number;
}

/**
 * Get all column information
 *
 * @param handle - Result handle
 * @returns Array of ColumnInfo
 */
export async function columnInfos(
  handle: Uint8Array<ArrayBuffer>,
): Promise<ColumnInfo[]> {
  const count = await columnCount(handle);
  const infos: ColumnInfo[] = [];

  for (let i = 0; i < count; i++) {
    infos.push({
      name: await columnName(handle, i),
      type: await columnType(handle, i),
    });
  }

  return infos;
}

/**
 * Destroy a query result
 *
 * @param handle - Result handle to destroy
 */
export async function destroyResult(
  handle: Uint8Array<ArrayBuffer>,
): Promise<void> {
  const lib = await getLibrary();
  if (isValidHandle(handle)) {
    lib.symbols.duckdb_destroy_result(handle);
  }
}
