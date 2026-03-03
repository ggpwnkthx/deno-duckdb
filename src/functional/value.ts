/**
 * Functional value extraction operations
 */

import type { ResultHandle, RowData, ValueType } from "../types.ts";
import * as query from "./query.ts";
import { getLibrary } from "../lib.ts";

/**
 * Check if a value at row and column is NULL
 *
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns Whether the value is NULL
 */
export async function isNull(
  handle: ResultHandle,
  row: number,
  col: number,
): Promise<boolean> {
  const lib = await getLibrary();
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
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns INT32 value
 */
export async function getInt32(
  handle: ResultHandle,
  row: number,
  col: number,
): Promise<number> {
  const lib = await getLibrary();
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
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns INT64 value
 */
export async function getInt64(
  handle: ResultHandle,
  row: number,
  col: number,
): Promise<bigint> {
  const lib = await getLibrary();
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
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns DOUBLE value
 */
export async function getDouble(
  handle: ResultHandle,
  row: number,
  col: number,
): Promise<number> {
  const lib = await getLibrary();
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
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @returns VARCHAR value
 */
export async function getString(
  handle: ResultHandle,
  row: number,
  col: number,
): Promise<string> {
  const lib = await getLibrary();
  // Check if NULL first
  if (await isNull(handle, row, col)) {
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
 * Optimized version with cached column metadata
 *
 * @param handle - Result handle
 * @returns Array of rows
 */
export async function fetchAll(
  handle: ResultHandle,
): Promise<RowData[]> {
  const rowCount = Number(await query.rowCount(handle));
  const colCount = Number(await query.columnCount(handle));

  if (rowCount === 0 || colCount === 0) {
    return [];
  }

  const lib = await getLibrary();

  // Pre-fetch column metadata (cached per column, not per cell)
  const columnTypes: number[] = [];
  const dataViews: Deno.UnsafePointerView[] = [];
  const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

  for (let c = 0; c < colCount; c++) {
    columnTypes[c] = await query.columnType(handle, c);

    // Pre-fetch column data pointer and create view
    const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(c));
    if (dataPtr) {
      dataViews[c] = new Deno.UnsafePointerView(
        dataPtr as unknown as Deno.PointerObject<unknown>,
      );
    } else {
      dataViews[c] = null as unknown as Deno.UnsafePointerView;
    }

    // Pre-fetch null mask pointer and create view
    const nullMaskPtr = lib.symbols.duckdb_nullmask_data(handle, BigInt(c));
    if (nullMaskPtr) {
      nullMaskViews[c] = new Deno.UnsafePointerView(
        nullMaskPtr as unknown as Deno.PointerObject<unknown>,
      );
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
        c,
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
 * For numeric types, skips null checking for performance
 */
export function getValueByTypeOptimized(
  row: number,
  _col: number,
  type: number,
  dataView: Deno.UnsafePointerView,
  nullMaskView: Deno.UnsafePointerView | null,
): ValueType {
  // NULL type is 0
  if (type === 0) {
    return null;
  }

  // For string types, check null using pre-fetched null mask
  // String types: VARCHAR=17, BLOB=18, etc.
  if (type === 17 || type === 18 || type >= 19) {
    // Check null for strings only
    if (nullMaskView) {
      const nullMask = nullMaskView.getBigUint64(0);
      if ((nullMask & (1n << BigInt(row))) !== 0n) {
        return null;
      }
    }
    return getStringWithView(dataView, row);
  }

  // For numeric types (BOOLEAN through DECIMAL), assume no nulls for performance
  // This matches the Direct FFI behavior which doesn't check nulls
  switch (type) {
    case 1: // BOOLEAN
    case 2: // TINYINT
    case 3: // SMALLINT
    case 4: // INTEGER
      return dataView.getInt32(row * 4);
    case 5: // BIGINT
      return dataView.getBigInt64(row * 8);
    case 6: // HUGEINT
    case 7: // FLOAT (type 10)
    case 10: // FLOAT
    case 11: // DOUBLE
    case 19: // DECIMAL
      return dataView.getFloat64(row * 8);
    default:
      // Fallback to string for unknown types
      if (nullMaskView) {
        const nullMask = nullMaskView.getBigUint64(0);
        if ((nullMask & (1n << BigInt(row))) !== 0n) {
          return null;
        }
      }
      return getStringWithView(dataView, row);
  }
}

/**
 * Get VARCHAR value with pre-fetched view
 */
function getStringWithView(
  dataView: Deno.UnsafePointerView,
  row: number,
): string {
  const innerPtr = dataView.getPointer(row * 8);
  if (!innerPtr) return "";

  const innerView = new Deno.UnsafePointerView(
    innerPtr as Deno.PointerObject<unknown>,
  );
  return innerView.getCString();
}

/**
 * Get a value by its DuckDB type
 * Note: String extraction from result sets has limited support
 * (requires vector API for full functionality)
 */
export async function getValueByType(
  handle: ResultHandle,
  row: number,
  col: number,
  type: number,
): Promise<ValueType> {
  // NULL type is 0, check for NULL values
  if (type === 0 || await isNull(handle, row, col)) {
    return null;
  }

  // String types: VARCHAR=17, BLOB=18, etc.
  // Also check for time-related types that return strings
  if (type === 17 || type === 18 || type >= 19) {
    return await getString(handle, row, col);
  }

  switch (type) {
    case 1: // BOOLEAN
    case 2: // TINYINT
    case 3: // SMALLINT
    case 4: // INTEGER
      return await getInt32(handle, row, col);
    case 5: // BIGINT
      return await getInt64(handle, row, col);
    case 6: // HUGEINT
    case 7: // FLOAT (type 10)
    case 10: // FLOAT
    case 11: // DOUBLE
    case 19: // DECIMAL
      return await getDouble(handle, row, col);
    default:
      // Fallback to string for unknown types
      return await getString(handle, row, col);
  }
}
