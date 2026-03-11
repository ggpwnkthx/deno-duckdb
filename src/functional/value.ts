/**
 * Functional value extraction operations
 */

import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type {
  ResultHandle,
  RowData,
  ValueType,
} from "../types.ts";
import {
  BYTE_SIZE_32,
  BYTE_SIZE_64,
  createPointerView,
  isNullFromMask,
} from "../helpers.ts";
import { getLibraryFast } from "../lib.ts";
import { decodeValueByType } from "./types.ts";

/**
 * Validate row and column indices are within bounds
 *
 * @param handle - Result handle
 * @param row - Row index
 * @param col - Column index
 */
function validateIndices(
  handle: ResultHandle,
  row: number,
  col: number,
): void {
  // Check for non-integer values first (NaN, Infinity, fractional)
  if (!Number.isInteger(row)) {
    throw new RangeError(
      `Row index must be an integer, got ${row}`,
    );
  }

  if (!Number.isInteger(col)) {
    throw new RangeError(
      `Column index must be an integer, got ${col}`,
    );
  }

  const lib = getLibraryFast();
  const rowCount = lib.symbols.duckdb_row_count(handle);
  const colCount = lib.symbols.duckdb_column_count(handle);;

  if (row < 0 || row >= rowCount) {
    throw new RangeError(
      `Row index ${row} is out of bounds (valid range: 0-${
        Number(rowCount) - 1
      })`,
    );
  }

  if (col < 0 || col >= colCount) {
    throw new RangeError(
      `Column index ${col} is out of bounds (valid range: 0-${
        Number(colCount) - 1
      })`,
    );
  }
}

/**
 * Check if a value at row and column is NULL
 *
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns Whether the value is NULL
 * @throws RangeError if row or column index is out of bounds
 */
export function isNull(
  handle: ResultHandle,
  row: number,
  col: number,
): boolean {
  validateIndices(handle, row, col);

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
 * @throws RangeError if row or column index is out of bounds
 */
export function getInt32(
  handle: ResultHandle,
  row: number,
  col: number,
): number | null {
  validateIndices(handle, row, col);
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
 * @throws RangeError if row or column index is out of bounds
 */
export function getInt64(
  handle: ResultHandle,
  row: number,
  col: number,
): bigint | null {
  validateIndices(handle, row, col);
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
 * @throws RangeError if row or column index is out of bounds
 */
export function getDouble(
  handle: ResultHandle,
  row: number,
  col: number,
): number | null {
  validateIndices(handle, row, col);
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
 * @throws RangeError if row or column index is out of bounds
 */
export function getString(
  handle: ResultHandle,
  row: number,
  col: number,
): string | null {
  validateIndices(handle, row, col);
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
 * Get column type for a result handle
 *
 * @param handle - Result handle
 * @param index - Column index (0-based)
 * @returns Column type
 */
export function getColumnType(
  handle: ResultHandle,
  index: number,
): DUCKDB_TYPE {
  const lib = getLibraryFast();
  return lib.symbols.duckdb_column_type(handle, BigInt(index)) as DUCKDB_TYPE;
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
  const lib = getLibraryFast();

  const rowCount = lib.symbols.duckdb_row_count(handle);
  const colCount = lib.symbols.duckdb_column_count(handle);

  if (rowCount === 0n || colCount === 0n) {
    return [];
  }

  // Pre-fetch column metadata (cached per column, not per cell)
  const columnTypes: DUCKDB_TYPE[] = [];
  const dataViews: (Deno.UnsafePointerView | null)[] = [];
  const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

  for (let c = 0; c < colCount; c++) {
    columnTypes[c] = getColumnType(handle, c);

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
  const rows: RowData[] = new Array(Number(rowCount));

  for (let r = 0; r < rowCount; r++) {
    // Pre-allocate row array
    const row: RowData = new Array(Number(colCount));
    for (let c = 0; c < colCount; c++) {
      // Use unified decoder
      row[c] = decodeValueByType(
        r,
        columnTypes[c],
        dataViews[c],
        nullMaskViews[c],
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
  type: DUCKDB_TYPE,
  dataView: Deno.UnsafePointerView | null,
  nullMaskView: Deno.UnsafePointerView | null,
  checkNull = true,
): ValueType {
  // Use unified decoder
  return decodeValueByType(row, type, dataView, nullMaskView, checkNull);
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
 * @throws RangeError if row or column index is out of bounds
 */
export function getValueByType(
  handle: ResultHandle,
  row: number,
  col: number,
  type: DUCKDB_TYPE,
  checkNull = true,
): ValueType {
  validateIndices(handle, row, col);
  const lib = getLibraryFast();

  // NULL type is 0, check for NULL values
  if (
    type === DUCKDB_TYPE.DUCKDB_TYPE_INVALID ||
    (checkNull && isNull(handle, row, col))
  ) {
    return null;
  }

  // Get column data and null mask
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  const nullMaskPtr = lib.symbols.duckdb_nullmask_data(handle, BigInt(col));

  const dataView = dataPtr ? createPointerView(dataPtr) : null;
  const nullMaskView = nullMaskPtr ? createPointerView(nullMaskPtr) : null;

  // Use unified decoder
  return decodeValueByType(row, type, dataView, nullMaskView, checkNull);
}
