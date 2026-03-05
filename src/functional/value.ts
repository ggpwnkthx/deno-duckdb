/**
 * Functional value extraction operations
 */

import {
  DuckDBType,
  type DuckDBTypeValue,
  type ResultHandle,
  type RowData,
  type ValueType,
} from "../types.ts";
import {
  BYTE_SIZE_32,
  BYTE_SIZE_64,
  createPointerView,
  isNullFromMask,
  isStringType,
} from "../helpers.ts";
import * as query from "./query.ts";
import { getLibraryFast } from "../lib.ts";

/**
 * Check if a value at row and column is NULL
 *
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns Whether the value is NULL
 */
export function isNull(
  handle: ResultHandle,
  row: number,
  col: number,
): boolean {
  const lib = getLibraryFast();
  // Use duckdb_nullmask_data to get the null mask pointer
  const nullMaskPtr = lib.symbols.duckdb_nullmask_data(
    handle,
    BigInt(col),
  );

  if (!nullMaskPtr) {
    return false;
  }

  const view = createPointerView(nullMaskPtr);
  return isNullFromMask(view, row);
}

/**
 * Get an INT32 value from a result
 *
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns INT32 value or null if NULL
 */
export function getInt32(
  handle: ResultHandle,
  row: number,
  col: number,
): number | null {
  // Check null first
  if (isNull(handle, row, col)) {
    return null;
  }
  const lib = getLibraryFast();
  // Use duckdb_column_data to get the actual column data
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  if (!dataPtr) {
    return null;
  }

  const view = createPointerView(dataPtr);
  if (!view) {
    return null;
  }

  // Read the int32 at the row offset (4 bytes per int32)
  const offset = row * BYTE_SIZE_32;
  return view.getInt32(offset);
}

/**
 * Get an INT64 value from a result
 *
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns INT64 value or null if NULL
 */
export function getInt64(
  handle: ResultHandle,
  row: number,
  col: number,
): bigint | null {
  // Check null first
  if (isNull(handle, row, col)) {
    return null;
  }
  const lib = getLibraryFast();
  // Use duckdb_column_data to get the actual column data
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  if (!dataPtr) {
    return null;
  }

  const view = createPointerView(dataPtr);
  if (!view) {
    return null;
  }

  // Read the int64 at the row offset (8 bytes per int64)
  const offset = row * BYTE_SIZE_64;
  return view.getBigInt64(offset);
}

/**
 * Get a DOUBLE value from a result
 *
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns DOUBLE value or null if NULL
 */
export function getDouble(
  handle: ResultHandle,
  row: number,
  col: number,
): number | null {
  // Check null first
  if (isNull(handle, row, col)) {
    return null;
  }
  const lib = getLibraryFast();
  // Use duckdb_column_data to get the actual column data
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  if (!dataPtr) {
    return null;
  }

  const view = createPointerView(dataPtr);
  if (!view) {
    return null;
  }

  // Read the double at the specified row offset (each double is 8 bytes)
  const offset = row * BYTE_SIZE_64;
  return view.getFloat64(offset);
}

/**
 * Get a VARCHAR value from a result
 * Uses duckdb_column_data to get the actual string data
 *
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns VARCHAR value or null if NULL
 */
export function getString(
  handle: ResultHandle,
  row: number,
  col: number,
): string | null {
  const lib = getLibraryFast();
  // Check if NULL first
  if (isNull(handle, row, col)) {
    return null;
  }

  // Use duckdb_column_data to get the column data pointer
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  if (!dataPtr) {
    return null;
  }

  const view = createPointerView(dataPtr);
  if (!view) {
    return null;
  }

  // Read the pointer at the row offset (8 bytes per pointer)
  const offset = row * BYTE_SIZE_64;
  const innerPtr = view.getPointer(offset);

  if (!innerPtr) {
    return null;
  }

  const innerView = createPointerView(innerPtr);
  if (!innerView) {
    return null;
  }
  return innerView.getCString();
}

/**
 * Fetch all rows from a result
 * Optimized version with cached column metadata
 *
 * @param handle - Result handle
 * @returns Array of rows
 */
export function fetchAll(
  handle: ResultHandle,
): RowData[] {
  const rowCount = Number(query.rowCount(handle));
  const colCount = Number(query.columnCount(handle));

  if (rowCount === 0 || colCount === 0) {
    return [];
  }

  const lib = getLibraryFast();

  // Pre-fetch column metadata (cached per column, not per cell)
  const columnTypes: DuckDBTypeValue[] = [];
  const dataViews: (Deno.UnsafePointerView | null)[] = [];
  const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

  for (let c = 0; c < colCount; c++) {
    columnTypes[c] = query.columnType(handle, c);

    // Pre-fetch column data pointer and create view
    const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(c));
    if (dataPtr) {
      dataViews[c] = createPointerView(dataPtr);
    } else {
      dataViews[c] = null;
    }

    // Pre-fetch null mask pointer and create view
    const nullMaskPtr = lib.symbols.duckdb_nullmask_data(handle, BigInt(c));
    if (nullMaskPtr) {
      nullMaskViews[c] = createPointerView(nullMaskPtr);
    } else {
      nullMaskViews[c] = null;
    }
  }

  // Pre-allocate rows array
  const rows: RowData[] = new Array(rowCount);

  for (let r = 0; r < rowCount; r++) {
    // Pre-allocate row array
    const row: RowData = new Array(colCount);
    for (let c = 0; c < colCount; c++) {
      const type = columnTypes[c];
      const dataView = dataViews[c];
      const nullMaskView = nullMaskViews[c];
      row[c] = getValueByTypeOptimized(
        r,
        type,
        dataView,
        nullMaskView,
      );
    }
    rows[r] = row;
  }

  return rows;
}

/**
 * Optimized getValueByType with pre-fetched column data and null mask views
 *
 * @param row - Row index
 * @param type - DuckDB type
 * @param dataView - Pre-fetched data pointer view
 * @param nullMaskView - Pre-fetched null mask pointer view
 * @param checkNull - If true (default), check null mask for all types. Set to false for performance.
 * @returns The value at the specified row and column
 */
export function getValueByTypeOptimized(
  row: number,
  type: DuckDBTypeValue,
  dataView: Deno.UnsafePointerView | null,
  nullMaskView: Deno.UnsafePointerView | null,
  checkNull = true,
): ValueType {
  // NULL type is 0
  if (type === DuckDBType.NULL) {
    return null;
  }

  // Use shared helper for null mask check
  const isNullValue = (): boolean => {
    return checkNull && isNullFromMask(nullMaskView, row);
  };

  // Use shared helper for string type check
  if (isStringType(type)) {
    // Check null for strings
    if (isNullValue()) {
      return null;
    }
    return getStringWithView(dataView, row);
  }

  // For numeric types, check null if enabled (default)
  switch (type) {
    case DuckDBType.BOOLEAN:
    case DuckDBType.TINYINT:
    case DuckDBType.SMALLINT:
    case DuckDBType.INTEGER:
      if (isNullValue()) return null;
      return dataView ? dataView.getInt32(row * BYTE_SIZE_32) : 0;
    case DuckDBType.BIGINT:
      if (isNullValue()) return null;
      return dataView ? dataView.getBigInt64(row * BYTE_SIZE_64) : 0n;
    case DuckDBType.HUGEINT:
    case DuckDBType.FLOAT:
    case DuckDBType.DOUBLE:
      if (isNullValue()) return null;
      return dataView ? dataView.getFloat64(row * BYTE_SIZE_64) : 0;
    default:
      // Fallback to string for unknown types
      if (isNullValue()) {
        return null;
      }
      return getStringWithView(dataView, row);
  }
}

/**
 * Get VARCHAR value with pre-fetched view
 */
function getStringWithView(
  dataView: Deno.UnsafePointerView | null,
  row: number,
): string {
  if (!dataView) return "";

  const innerPtr = dataView.getPointer(row * BYTE_SIZE_64);
  if (!innerPtr) return "";

  const innerView = createPointerView(innerPtr);
  if (!innerView) return "";

  return innerView.getCString();
}

/**
 * Get a value by its DuckDB type
 * Note: String extraction from result sets has limited support
 * (requires vector API for full functionality)
 *
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @param type - DuckDB type
 * @param checkNull - If true (default), check null mask for all types including numeric
 * @returns The value at the specified row and column
 */
export function getValueByType(
  handle: ResultHandle,
  row: number,
  col: number,
  type: DuckDBTypeValue,
  checkNull = true,
): ValueType {
  // NULL type is 0, check for NULL values
  if (
    type === DuckDBType.NULL || (checkNull && isNull(handle, row, col))
  ) {
    return null;
  }

  // Use shared helper for string type check
  if (isStringType(type)) {
    return getString(handle, row, col);
  }

  switch (type) {
    case DuckDBType.BOOLEAN:
    case DuckDBType.TINYINT:
    case DuckDBType.SMALLINT:
    case DuckDBType.INTEGER:
      return getInt32(handle, row, col);
    case DuckDBType.BIGINT:
      return getInt64(handle, row, col);
    case DuckDBType.HUGEINT:
    case DuckDBType.FLOAT:
    case DuckDBType.DOUBLE:
      return getDouble(handle, row, col);
    default:
      // Fallback to string for unknown types
      return getString(handle, row, col);
  }
}
