/**
 * Functional value extraction operations
 */

import type {
  DuckDBLibrary,
  ResultHandle,
  RowData,
  ValueType,
} from "../types.ts";
import * as query from "./query.ts";

/**
 * Check if a value at row and column is NULL
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns Whether the value is NULL
 */
export function isNull(
  lib: DuckDBLibrary,
  handle: ResultHandle,
  row: number,
  col: number,
): boolean {
  // Use duckdb_nullmask_data to get the null mask pointer
  const nullMaskPtr = lib.symbols.duckdb_nullmask_data(
    handle,
    BigInt(col),
  );

  if (!nullMaskPtr) {
    return false;
  }

  // The null mask is a bitmap where each bit indicates if the value is NULL
  const ptrObj = nullMaskPtr as unknown as Deno.PointerObject<unknown>;
  const view = new Deno.UnsafePointerView(ptrObj);

  // Read the null mask as Uint64 (the null mask is stored as uint64_t array)
  // Each bit in the mask represents whether a value is NULL
  const nullMask = view.getBigUint64(0);

  // Check if the bit for this row is set
  return (nullMask & (1n << BigInt(row))) !== 0n;
}

/**
 * Get an INT32 value from a result
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns INT32 value
 */
export function getInt32(
  lib: DuckDBLibrary,
  handle: ResultHandle,
  row: number,
  col: number,
): number {
  // Use duckdb_column_data to get the actual column data
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  if (!dataPtr) {
    return 0;
  }

  const ptrObj = dataPtr as unknown as Deno.PointerObject<unknown>;
  const view = new Deno.UnsafePointerView(ptrObj);

  // Read the int32 at the row offset (4 bytes per int32)
  const offset = row * 4;
  return view.getInt32(offset);
}

/**
 * Get an INT64 value from a result
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns INT64 value
 */
export function getInt64(
  lib: DuckDBLibrary,
  handle: ResultHandle,
  row: number,
  col: number,
): bigint {
  // Use duckdb_column_data to get the actual column data
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  if (!dataPtr) {
    return 0n;
  }

  const ptrObj = dataPtr as unknown as Deno.PointerObject<unknown>;
  const view = new Deno.UnsafePointerView(ptrObj);

  // Read the int64 at the row offset (8 bytes per int64)
  const offset = row * 8;
  return view.getBigInt64(offset);
}

/**
 * Get a DOUBLE value from a result
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns DOUBLE value
 */
export function getDouble(
  lib: DuckDBLibrary,
  handle: ResultHandle,
  row: number,
  col: number,
): number {
  // Use duckdb_column_data to get the actual column data
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  if (!dataPtr) {
    return 0;
  }

  const ptrObj = dataPtr as unknown as Deno.PointerObject<unknown>;
  const view = new Deno.UnsafePointerView(ptrObj);

  // Read the double at the specified row offset (each double is 8 bytes)
  const offset = row * 8;
  return view.getFloat64(offset);
}

/**
 * Get a VARCHAR value from a result
 * Uses duckdb_column_data to get the actual string data
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns VARCHAR value
 */
export function getString(
  lib: DuckDBLibrary,
  handle: ResultHandle,
  row: number,
  col: number,
): string {
  // Check if NULL first
  if (isNull(lib, handle, row, col)) {
    return "";
  }

  // Use duckdb_column_data to get the column data pointer
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  if (!dataPtr) {
    return "";
  }

  const ptrObj = dataPtr as unknown as Deno.PointerObject<unknown>;
  const view = new Deno.UnsafePointerView(ptrObj);

  // Read the pointer at the row offset (8 bytes per pointer)
  const offset = row * 8;
  const innerPtr = view.getPointer(offset);

  if (!innerPtr) {
    return "";
  }

  const innerView = new Deno.UnsafePointerView(
    innerPtr as Deno.PointerObject<unknown>,
  );
  return innerView.getCString();
}

/**
 * Fetch all rows from a result
 *
 * @param lib - The loaded DuckDB library
 * @param handle - Result handle
 * @returns Array of rows
 */
export function fetchAll(
  lib: DuckDBLibrary,
  handle: ResultHandle,
): RowData[] {
  const rowCount = query.rowCount(lib, handle);
  const colCount = query.columnCount(lib, handle);
  const rows: RowData[] = [];

  for (let r = 0; r < Number(rowCount); r++) {
    const row: RowData = [];
    for (let c = 0; c < Number(colCount); c++) {
      const type = query.columnType(lib, handle, c);
      const value = getValueByType(lib, handle, r, c, type);
      row.push(value);
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Get a value by its DuckDB type
 * Note: String extraction from result sets has limited support
 * (requires vector API for full functionality)
 */
export function getValueByType(
  lib: DuckDBLibrary,
  handle: ResultHandle,
  row: number,
  col: number,
  type: number,
): ValueType {
  // NULL type is 0, check for NULL values
  if (type === 0 || isNull(lib, handle, row, col)) {
    return null;
  }

  // String types: VARCHAR=17, BLOB=18, etc.
  // Also check for time-related types that return strings
  if (type === 17 || type === 18 || type >= 19) {
    return getString(lib, handle, row, col);
  }

  switch (type) {
    case 1: // BOOLEAN
    case 2: // TINYINT
    case 3: // SMALLINT
    case 4: // INTEGER
      return getInt32(lib, handle, row, col);
    case 5: // BIGINT
      return getInt64(lib, handle, row, col);
    case 6: // HUGEINT
    case 7: // FLOAT (type 10)
    case 10: // FLOAT
    case 11: // DOUBLE
    case 19: // DECIMAL
      return getDouble(lib, handle, row, col);
    default:
      // Fallback to string for unknown types
      return getString(lib, handle, row, col);
  }
}
