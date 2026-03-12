/**
 * Functional value extraction operations
 */

import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type { ResultHandle, RowData, ValueType } from "../types.ts";
import {
  BYTE_SIZE_32,
  BYTE_SIZE_64,
  createPointerView,
  emptyLazyRowData,
  isNullFromMask,
} from "../helpers.ts";
import { getLibraryFast } from "../lib.ts";
import { decodeValueByType } from "./types.ts";
import { columnName } from "./query.ts";

/**
 * LazyRowData - a lazy array that materializes values on demand
 *
 * This is an array-like object where:
 * - length is available immediately (cheap)
 * - indexed access materializes values only when accessed
 * - supports iteration (for...of, spread, Array.from())
 */
export interface LazyRowData extends Array<LazyRow> {
  /** The result handle (for materialization) */
  _handle: ResultHandle;
  /** Column types */
  _types: DUCKDB_TYPE[];
  /** Column names */
  _names: string[];
  /** Pre-fetched data pointer views */
  _dataViews: (Deno.UnsafePointerView | null)[];
  /** Pre-fetched null mask pointer views */
  _nullMaskViews: (Deno.UnsafePointerView | null)[];
  /** Cached materialized rows */
  _cachedRows?: RowData[];
  /** Explicit length property for TypeScript */
  length: number;
  /** Index signature for numeric access */
  [index: number]: LazyRow;
}

/**
 * LazyRow - a lazy row that materializes values on demand
 */
export interface LazyRow extends Array<ValueType> {
  /** Row index in the result set (optional for type compatibility) */
  _rowIndex?: number;
}

/**
 * Create a lazy row proxy that materializes values on access
 */
/**
 * Create a lazy row proxy that materializes values on access
 */
function createLazyRow(
  _handle: ResultHandle,
  rowIndex: number,
  colCount: number,
  types: DUCKDB_TYPE[],
  names: string[],
  dataViews: (Deno.UnsafePointerView | null)[],
  nullMaskViews: (Deno.UnsafePointerView | null)[],
): LazyRow {
  // Create an object that acts like an array
  const row = {
    length: colCount,
    _rowIndex: rowIndex,
  } as LazyRow;

  // Create a proxy to materialize values on access
  return new Proxy(row, {
    get(target, prop) {
      // Handle special properties
      if (prop === "_rowIndex") {
        return rowIndex;
      }
      if (prop === "length") {
        return colCount;
      }
      if (prop === Symbol.iterator) {
        // Materialize entire row when iterated
        return function* () {
          for (let c = 0; c < colCount; c++) {
            yield decodeValueByType(
              rowIndex,
              types[c],
              dataViews[c],
              nullMaskViews[c],
            );
          }
        };
      }

      // Handle numeric index access - convert to string key
      const propStr = String(prop);
      const index = Number(propStr);
      if (Number.isInteger(index) && index >= 0 && index < colCount) {
        // Materialize the value
        return decodeValueByType(
          rowIndex,
          types[index],
          dataViews[index],
          nullMaskViews[index],
        );
      }

      // Handle string property access (column name lookup)
      if (typeof prop === "string" && !Number.isInteger(Number(prop))) {
        const colIndex = names.indexOf(prop);
        if (colIndex >= 0) {
          return decodeValueByType(
            rowIndex,
            types[colIndex],
            dataViews[colIndex],
            nullMaskViews[colIndex],
          );
        }
      }

      return target[prop as keyof typeof target];
    },
  });
}

/**
 * Create a lazy array that materializes values on demand
 */
function createLazyArray(
  handle: ResultHandle,
  rowCount: bigint,
  colCount: bigint,
  types: DUCKDB_TYPE[],
  names: string[],
  dataViews: (Deno.UnsafePointerView | null)[],
  nullMaskViews: (Deno.UnsafePointerView | null)[],
): LazyRowData {
  const numRows = Number(rowCount);
  const numCols = Number(colCount);

  // Pre-allocate array with length
  const arr: LazyRowData = new Array(numRows) as LazyRowData;
  arr._handle = handle;
  arr._types = types;
  arr._names = names;
  arr._dataViews = dataViews;
  arr._nullMaskViews = nullMaskViews;

  // Create proxy for lazy access
  return new Proxy(arr, {
    get(target, prop) {
      // Handle special properties
      if (prop === "_handle") return handle;
      if (prop === "_types") return types;
      if (prop === "_dataViews") return dataViews;
      if (prop === "_nullMaskViews") return nullMaskViews;
      if (prop === "length") return numRows;

      // Handle Symbol properties BEFORE numeric conversion (for...of iteration)
      if (typeof prop === "symbol") {
        // Handle iteration
        if (prop === Symbol.iterator) {
          return function* () {
            for (let r = 0; r < numRows; r++) {
              yield createLazyRow(
                handle,
                r,
                numCols,
                types,
                names,
                dataViews,
                nullMaskViews,
              );
            }
          };
        }
        return target[prop as keyof typeof target];
      }

      // Handle numeric index access - lazy materialization
      const index = Number(prop);
      if (Number.isInteger(index) && index >= 0 && index < numRows) {
        // Materialize the row on access
        return createLazyRow(
          handle,
          index,
          numCols,
          types,
          names,
          dataViews,
          nullMaskViews,
        );
      }

      // For array methods, we need to materialize or provide lazy versions
      if (prop === "map") {
        return function (callback: (row: LazyRow, index: number) => unknown) {
          const result: unknown[] = [];
          for (let r = 0; r < numRows; r++) {
            const row = createLazyRow(
              handle,
              r,
              numCols,
              types,
              names,
              dataViews,
              nullMaskViews,
            );
            result.push(callback(row, r));
          }
          return result;
        };
      }

      if (prop === "forEach") {
        return function (callback: (row: LazyRow, index: number) => void) {
          for (let r = 0; r < numRows; r++) {
            const row = createLazyRow(
              handle,
              r,
              numCols,
              types,
              names,
              dataViews,
              nullMaskViews,
            );
            callback(row, r);
          }
        };
      }

      if (prop === "filter") {
        return function (predicate: (row: LazyRow, index: number) => boolean) {
          const result: LazyRow[] = [];
          for (let r = 0; r < numRows; r++) {
            const row = createLazyRow(
              handle,
              r,
              numCols,
              types,
              names,
              dataViews,
              nullMaskViews,
            );
            if (predicate(row, r)) {
              result.push(row);
            }
          }
          return result;
        };
      }

      if (prop === "slice") {
        return function (start?: number, end?: number) {
          const s = start ?? 0;
          const e = end ?? numRows;
          const result: LazyRow[] = [];
          for (let r = s; r < e && r < numRows; r++) {
            result.push(
              createLazyRow(
                handle,
                r,
                numCols,
                types,
                names,
                dataViews,
                nullMaskViews,
              ),
            );
          }
          return result;
        };
      }

      if (prop === "at") {
        return function (index: number) {
          const idx = index < 0 ? numRows + index : index;
          if (idx < 0 || idx >= numRows) return undefined;
          return createLazyRow(
            handle,
            idx,
            numCols,
            types,
            names,
            dataViews,
            nullMaskViews,
          );
        };
      }

      if (prop === "find") {
        return function (predicate: (row: LazyRow, index: number) => boolean) {
          for (let r = 0; r < numRows; r++) {
            const row = createLazyRow(
              handle,
              r,
              numCols,
              types,
              names,
              dataViews,
              nullMaskViews,
            );
            if (predicate(row, r)) {
              return row;
            }
          }
          return undefined;
        };
      }

      if (prop === "findIndex") {
        return function (predicate: (row: LazyRow, index: number) => boolean) {
          for (let r = 0; r < numRows; r++) {
            const row = createLazyRow(
              handle,
              r,
              numCols,
              types,
              names,
              dataViews,
              nullMaskViews,
            );
            if (predicate(row, r)) {
              return r;
            }
          }
          return -1;
        };
      }

      if (prop === "every") {
        return function (predicate: (row: LazyRow, index: number) => boolean) {
          for (let r = 0; r < numRows; r++) {
            const row = createLazyRow(
              handle,
              r,
              numCols,
              types,
              names,
              dataViews,
              nullMaskViews,
            );
            if (!predicate(row, r)) {
              return false;
            }
          }
          return true;
        };
      }

      if (prop === "some") {
        return function (predicate: (row: LazyRow, index: number) => boolean) {
          for (let r = 0; r < numRows; r++) {
            const row = createLazyRow(
              handle,
              r,
              numCols,
              types,
              names,
              dataViews,
              nullMaskViews,
            );
            if (predicate(row, r)) {
              return true;
            }
          }
          return false;
        };
      }

      if (prop === "reduce") {
        return function (
          callback: (acc: unknown, row: LazyRow, index: number) => unknown,
          initial?: unknown,
        ) {
          let acc = initial;
          for (let r = 0; r < numRows; r++) {
            const row = createLazyRow(
              handle,
              r,
              numCols,
              types,
              names,
              dataViews,
              nullMaskViews,
            );
            acc = callback(acc, row, r);
          }
          return acc;
        };
      }

      return target[prop as keyof typeof target];
    },
  });
}

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
  const colCount = lib.symbols.duckdb_column_count(handle);

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
 * Returns a lazy array that materializes values on demand
 *
 * @param handle - Result handle
 * @returns Lazy array of rows
 */
export function fetchAll(
  handle: ResultHandle,
): LazyRowData {
  const lib = getLibraryFast();

  const rowCount = lib.symbols.duckdb_row_count(handle);
  const colCount = lib.symbols.duckdb_column_count(handle);

  // Return empty array for empty results
  if (rowCount === 0n || colCount === 0n) {
    return emptyLazyRowData<LazyRowData>();
  }

  // Pre-fetch column metadata (cached per column, not per cell)
  const columnTypes: DUCKDB_TYPE[] = [];
  const columnNames: string[] = [];
  const dataViews: (Deno.UnsafePointerView | null)[] = [];
  const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

  for (let c = 0; c < colCount; c++) {
    columnTypes[c] = getColumnType(handle, c);
    columnNames[c] = columnName(handle, c);

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

  // Return lazy array - values materialize on access
  return createLazyArray(
    handle,
    rowCount,
    colCount,
    columnTypes,
    columnNames,
    dataViews,
    nullMaskViews,
  );
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
