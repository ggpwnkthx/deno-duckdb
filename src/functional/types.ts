/**
 * Shared utilities for DuckDB type handling
 *
 * This module consolidates type handling logic that was previously
 * duplicated across value.ts and stream.ts.
 */

import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type { ResultHandle, ValueType } from "../types.ts";
import {
  BYTE_SIZE_128,
  BYTE_SIZE_16,
  BYTE_SIZE_32,
  BYTE_SIZE_64,
  BYTE_SIZE_8,
  createPointerView,
  isNullFromMask,
  isStringType,
  validateResultHandle,
} from "../helpers.ts";
import { getLibraryFast } from "../lib.ts";

/**
 * Decode a HUGEINT value from a data view at the given row offset
 *
 * HUGEINT format in DuckDB: 16 bytes = { lower: uint64, upper: int64 }
 * Compute: value = (BigInt(upper) << 64n) + BigInt(lower)
 */
export function decodeHugeInt(
  dataView: Deno.UnsafePointerView | null,
  row: number,
): bigint {
  if (!dataView) return 0n;
  const offset = row * BYTE_SIZE_128;
  const lower = dataView.getBigUint64(offset);
  const upper = dataView.getBigInt64(offset + 8);
  return (upper << 64n) + lower;
}

/**
 * Convert days since epoch (1970-01-01) to ISO date string
 */
function daysToDateString(days: number): string {
  const date = new Date(Date.UTC(1970, 0, 1));
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert microseconds since midnight to time string (HH:MM:SS)
 */
function microsecondsToTimeString(us: bigint): string {
  // Convert to total seconds
  const totalSeconds = Number(us / 1000000n);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${
    String(minutes).padStart(2, "0")
  }:${String(seconds).padStart(2, "0")}`;
}

/**
 * Convert microseconds since epoch to ISO timestamp string
 */
function microsecondsToTimestampString(us: bigint): string {
  const ms = Number(us) / 1000; // Convert to milliseconds
  const date = new Date(ms);
  // Format as ISO string without timezone (DuckDB default format)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const msRemainder = Number(us % 1000000n);
  if (msRemainder === 0) {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  const micros = String(msRemainder).padStart(6, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${micros}`;
}

/**
 * Decode a value by type from pre-fetched column data and null mask
 *
 * This is a unified helper function that handles all DuckDB types consistently.
 *
 * @param row - Row index (0-based)
 * @param type - DuckDB type of the column
 * @param dataView - Pre-fetched data pointer view (or null)
 * @param nullMaskView - Pre-fetched null mask pointer view (or null)
 * @param checkNull - If true (default), check null mask for all types
 * @returns The decoded value
 */
export function decodeValueByType(
  row: number,
  type: DUCKDB_TYPE,
  dataView: Deno.UnsafePointerView | null,
  nullMaskView: Deno.UnsafePointerView | null,
  checkNull = true,
): ValueType {
  // NULL type is always null
  if (type === DUCKDB_TYPE.DUCKDB_TYPE_INVALID) {
    return null;
  }

  // Helper to check null
  const isNullValue = (): boolean => {
    return checkNull && isNullFromMask(nullMaskView, row);
  };

  // Handle string types (require pointer dereferencing)
  if (isStringType(type)) {
    if (isNullValue()) {
      return null;
    }
    return getStringValue(dataView, row);
  }

  // Handle numeric types
  switch (type) {
    case DUCKDB_TYPE.DUCKDB_TYPE_BOOLEAN:
      // BOOLEAN - 1 byte, convert to JS boolean
      if (isNullValue()) return null;
      return dataView ? dataView.getInt8(row * BYTE_SIZE_8) !== 0 : false;
    case DUCKDB_TYPE.DUCKDB_TYPE_TINYINT:
      // TINYINT - 1 byte
      if (isNullValue()) return null;
      return dataView ? dataView.getInt8(row * BYTE_SIZE_8) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_SMALLINT:
      // SMALLINT - 2 bytes
      if (isNullValue()) return null;
      return dataView ? dataView.getInt16(row * BYTE_SIZE_16) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_INTEGER:
      // INTEGER - 4 bytes
      if (isNullValue()) return null;
      return dataView ? dataView.getInt32(row * BYTE_SIZE_32) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_BIGINT:
      // BIGINT - 8 bytes
      if (isNullValue()) return null;
      return dataView ? dataView.getBigInt64(row * BYTE_SIZE_64) : 0n;
    case DUCKDB_TYPE.DUCKDB_TYPE_FLOAT:
      // FLOAT - 4 bytes
      if (isNullValue()) return null;
      return dataView ? dataView.getFloat32(row * BYTE_SIZE_32) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_HUGEINT:
      // HUGEINT - 16 bytes (two 64-bit integers: lower and upper)
      if (isNullValue()) return null;
      return decodeHugeInt(dataView, row);
    case DUCKDB_TYPE.DUCKDB_TYPE_DOUBLE:
      // DOUBLE - 8 bytes
      if (isNullValue()) return null;
      return dataView ? dataView.getFloat64(row * BYTE_SIZE_64) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_DATE: {
      // DATE - stored as 32-bit integer (days since 1970-01-01)
      if (isNullValue()) return null;
      if (!dataView) return "";
      const days = dataView.getInt32(row * BYTE_SIZE_32);
      return daysToDateString(days);
    }
    case DUCKDB_TYPE.DUCKDB_TYPE_TIME: {
      // TIME - stored as 64-bit integer (microseconds since midnight)
      if (isNullValue()) return null;
      if (!dataView) return "";
      const timeUs = dataView.getBigInt64(row * BYTE_SIZE_64);
      return microsecondsToTimeString(timeUs);
    }
    case DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP: {
      // TIMESTAMP - stored as 64-bit integer (microseconds since epoch)
      if (isNullValue()) return null;
      if (!dataView) return "";
      const timestampUs = dataView.getBigInt64(row * BYTE_SIZE_64);
      return microsecondsToTimestampString(timestampUs);
    }
    case DUCKDB_TYPE.DUCKDB_TYPE_DECIMAL:
      // DECIMAL - stored as 128-bit integer (same format as HUGEINT)
      if (isNullValue()) return null;
      return decodeHugeInt(dataView, row);
    case DUCKDB_TYPE.DUCKDB_TYPE_UTINYINT:
      // UTINYINT - unsigned 1 byte
      if (isNullValue()) return null;
      return dataView ? dataView.getUint8(row * BYTE_SIZE_8) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_USMALLINT:
      // USMALLINT - unsigned 2 bytes
      if (isNullValue()) return null;
      return dataView ? dataView.getUint16(row * BYTE_SIZE_16) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_UINTEGER:
      // UINTEGER - unsigned 4 bytes
      if (isNullValue()) return null;
      return dataView ? dataView.getUint32(row * BYTE_SIZE_32) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_UBIGINT:
      // UBIGINT - unsigned 8 bytes
      if (isNullValue()) return null;
      return dataView ? dataView.getBigUint64(row * BYTE_SIZE_64) : 0n;
    default:
      // Fallback to string for unknown types
      if (isNullValue()) {
        return null;
      }
      return getStringValue(dataView, row);
  }
}

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
  type: DUCKDB_TYPE,
): unknown {
  validateResultHandle(handle);
  const lib = getLibraryFast();

  // NULL type is always null
  if (type === DUCKDB_TYPE.DUCKDB_TYPE_INVALID) {
    return null;
  }

  // Get column data and null mask
  const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(col));
  const nullMaskPtr = lib.symbols.duckdb_nullmask_data(handle, BigInt(col));

  const dataView = dataPtr ? createPointerView(dataPtr) : null;
  const nullMaskView = nullMaskPtr ? createPointerView(nullMaskPtr) : null;

  // Use the unified decoder
  return decodeValueByType(row, type, dataView, nullMaskView, true);
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
  types: DUCKDB_TYPE[];
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
  validateResultHandle(handle);
  const lib = getLibraryFast();

  // Get column count
  const colCount = Number(lib.symbols.duckdb_column_count(handle));

  const types: DUCKDB_TYPE[] = [];
  const dataViews: (Deno.UnsafePointerView | null)[] = [];
  const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

  for (let c = 0; c < colCount; c++) {
    // Get type
    types[c] = lib.symbols.duckdb_column_type(
      handle,
      BigInt(c),
    ) as DUCKDB_TYPE;

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

  // Use the unified decoder
  return decodeValueByType(row, type, dataView, nullMaskView, true);
}
