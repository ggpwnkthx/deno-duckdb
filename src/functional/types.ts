/**
 * Shared utilities for DuckDB type handling
 *
 * This module consolidates type handling logic that was previously
 * duplicated across value.ts and stream.ts.
 */

import {
  DuckDBType,
  type DuckDBTypeValue,
  type ResultHandle,
} from "../types.ts";
import {
  BYTE_SIZE_32,
  BYTE_SIZE_64,
  createPointerView,
  isNullFromMask,
  isStringType,
} from "../helpers.ts";
import { getLibraryFast } from "../lib.ts";

/**
 * Get a value from a result by row and column index with type
 *
 * @param handle - Result handle
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @param type - DuckDB type of the column
 * @returns The value at the specified position
 */
export function getValueByTypeFromHandle(
  handle: ResultHandle,
  row: number,
  col: number,
  type: DuckDBTypeValue,
): unknown {
  const lib = getLibraryFast();

  // NULL type is always null
  if (type === DuckDBType.NULL) {
    return null;
  }

  // Get column data and null mask
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  const nullMaskPtr = lib.symbols.duckdb_nullmask_data(handle, BigInt(col));

  const dataView = dataPtr ? createPointerView(dataPtr) : null;
  const nullMaskView = nullMaskPtr ? createPointerView(nullMaskPtr) : null;

  // Check null for all types
  if (isNullFromMask(nullMaskView, row)) {
    return null;
  }

  // Handle string types (require pointer dereferencing)
  if (isStringType(type)) {
    return getStringValue(dataView, row);
  }

  // Handle numeric types
  switch (type) {
    case DuckDBType.BOOLEAN:
    case DuckDBType.TINYINT:
    case DuckDBType.SMALLINT:
    case DuckDBType.INTEGER:
      return dataView ? dataView.getInt32(row * BYTE_SIZE_32) : 0;
    case DuckDBType.BIGINT:
      return dataView ? dataView.getBigInt64(row * BYTE_SIZE_64) : 0n;
    case DuckDBType.HUGEINT:
    case DuckDBType.FLOAT:
    case DuckDBType.DOUBLE:
      return dataView ? dataView.getFloat64(row * BYTE_SIZE_64) : 0;
    default:
      // Fallback to string for unknown types
      return getStringValue(dataView, row);
  }
}

/**
 * Get a string value from a data view at the given row offset
 */
function getStringValue(
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
 * Get column metadata for a result (types and views)
 */
export interface ColumnMetadata {
  types: DuckDBTypeValue[];
  dataViews: (Deno.UnsafePointerView | null)[];
  nullMaskViews: (Deno.UnsafePointerView | null)[];
}

/**
 * Build column metadata cache for a result
 *
 * @param handle - Result handle
 * @returns Column metadata with types and views for each column
 */
export function buildColumnMetadata(
  handle: ResultHandle,
): ColumnMetadata {
  const lib = getLibraryFast();

  // Get column count
  const colCount = Number(lib.symbols.duckdb_column_count(handle));

  const types: DuckDBTypeValue[] = [];
  const dataViews: (Deno.UnsafePointerView | null)[] = [];
  const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

  for (let c = 0; c < colCount; c++) {
    // Get type
    types[c] = lib.symbols.duckdb_column_type(
      handle,
      BigInt(c),
    ) as DuckDBTypeValue;

    // Get data pointer
    const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(c));
    dataViews[c] = dataPtr ? createPointerView(dataPtr) : null;

    // Get null mask pointer
    const nullMaskPtr = lib.symbols.duckdb_nullmask_data(handle, BigInt(c));
    nullMaskViews[c] = nullMaskPtr ? createPointerView(nullMaskPtr) : null;
  }

  return { types, dataViews, nullMaskViews };
}

/**
 * Get a value using pre-fetched column metadata
 *
 * This is more efficient than getValueByType when reading multiple rows
 * because it avoids repeated FFI calls for column metadata.
 *
 * @param row - Row index (0-based)
 * @param col - Column index (0-based)
 * @param metadata - Pre-fetched column metadata
 * @returns The value at the specified position
 */
export function getValueFromMetadata(
  row: number,
  col: number,
  metadata: ColumnMetadata,
): unknown {
  const type = metadata.types[col];
  const dataView = metadata.dataViews[col];
  const nullMaskView = metadata.nullMaskViews[col];

  // NULL type is always null
  if (type === DuckDBType.NULL) {
    return null;
  }

  // Check null mask
  if (isNullFromMask(nullMaskView, row)) {
    return null;
  }

  // Handle string types
  if (isStringType(type)) {
    return getStringValue(dataView, row);
  }

  // Handle numeric types
  switch (type) {
    case DuckDBType.BOOLEAN:
    case DuckDBType.TINYINT:
    case DuckDBType.SMALLINT:
    case DuckDBType.INTEGER:
      return dataView ? dataView.getInt32(row * BYTE_SIZE_32) : 0;
    case DuckDBType.BIGINT:
      return dataView ? dataView.getBigInt64(row * BYTE_SIZE_64) : 0n;
    case DuckDBType.HUGEINT:
    case DuckDBType.FLOAT:
    case DuckDBType.DOUBLE:
      return dataView ? dataView.getFloat64(row * BYTE_SIZE_64) : 0;
    default:
      return getStringValue(dataView, row);
  }
}
