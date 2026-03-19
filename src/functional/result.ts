/**
 * Result decoding and row/object decode.
 *
 * Implements the ResultReader class for reading typed values from DuckDB result sets.
 * Handles type-specific decoding including dates, times, intervals, and blobs.
 * Caches column metadata for efficient repeated access.
 */

import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type {
  ColumnInfo,
  ObjectRow,
  ResultHandle,
  RowData,
  ValueType,
} from "../types.ts";
import { createPointerView, validateResultHandle } from "../core/handles.ts";
import {
  checkRowCountLimit,
  getEffectiveLimits,
  type MaterializationLimits,
} from "../core/config/limits.ts";

/**
 * Fixed-width byte sizes used by DuckDB's legacy result memory layout.
 *
 * These sizes match the libduckdb C ABI targeted by
 * `@ggpwnkthx/libduckdb@1.0.15` (DuckDB 1.5.0).
 * @internal
 */
const BYTE_SIZE_8 = 1;
/** @internal */
const BYTE_SIZE_16 = 2;
/** @internal */
const BYTE_SIZE_32 = 4;
/** @internal */
const BYTE_SIZE_64 = 8;
/** @internal */
const BYTE_SIZE_128 = 16;
import {
  getResultColumnData,
  getResultColumnInfos,
  getResultColumnValidity,
  getResultRowCount,
  isResultValueNull,
  readResultValueAsText,
} from "./native.ts";
import { assertIntegerIndex } from "../core/validate.ts";

const textDecoder = new TextDecoder();

interface ColumnVector {
  readonly name: string;
  readonly type: DUCKDB_TYPE;
  readonly dataView: Deno.UnsafePointerView | null;
  readonly validityView: Deno.UnsafePointerView | null;
}

interface ResultView {
  readonly handle: ResultHandle;
  readonly rowCount: bigint;
  readonly columnCount: number;
  readonly columns: readonly ColumnVector[];
  readonly columnInfos: readonly ColumnInfo[];
}

/** Types that should use text-based fallback decoding. */
const TEXT_FALLBACK_TYPES = new Set([
  DUCKDB_TYPE.DUCKDB_TYPE_VARCHAR,
  DUCKDB_TYPE.DUCKDB_TYPE_BLOB,
  DUCKDB_TYPE.DUCKDB_TYPE_BIT,
]);

// Pre-compute all valid DUCKDB_TYPE enum values at module load time
// This avoids creating a new array and filtering on every call
/** @internal */
const ALL_VALID_TYPES = new Set(
  Object.values(DUCKDB_TYPE).filter((v) => typeof v === "number"),
);

/**
 * Check if a type should use text fallback decoding.
 *
 * @internal
 * @param type - DuckDB type enum
 * @returns true if type needs text fallback
 */
function isTextFallbackType(type: DUCKDB_TYPE): boolean {
  if (TEXT_FALLBACK_TYPES.has(type)) {
    return true;
  }
  // Only check if it's NOT a valid enum value (custom/extension type)
  return !ALL_VALID_TYPES.has(type);
}

/**
 * Check if a value is null using the validity bitmap.
 *
 * @internal
 * @param validityView - Pointer to null bitmap, or null if no nulls
 * @param rowIndex - Row index to check
 * @param handle - Result handle for fallback check
 * @param columnIndex - Column index for fallback check
 * @returns true if value is null
 */
function isNullFromBitmap(
  validityView: Deno.UnsafePointerView | null,
  rowIndex: number,
  handle?: ResultHandle,
  columnIndex?: number,
): boolean {
  if (!validityView) {
    if (handle !== undefined && columnIndex !== undefined) {
      return isResultValueNull(handle, rowIndex, columnIndex);
    }
    return false;
  }

  const bitmapIndex = Math.floor(rowIndex / 8);
  const bitIndex = rowIndex % 8;
  const byte = validityView.getUint8(bitmapIndex);
  return (byte & (1 << bitIndex)) === 0;
}

/**
 * Read bytes from a column data view.
 *
 * @internal
 * @param view - Pointer view to column data
 * @param offset - Byte offset to start reading
 * @param length - Number of bytes to read
 * @returns Uint8Array of requested bytes
 */
function readBytes(
  view: Deno.UnsafePointerView | null,
  offset: number,
  length: number,
): Uint8Array {
  if (!view || length <= 0) {
    return new Uint8Array();
  }

  // For small strings, the byte-by-byte loop is fast enough
  if (length <= 16) {
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = view.getUint8(offset + i);
    }
    return result;
  }

  // For larger strings, use bulk copy via typed array using documented getArrayBuffer
  const buffer = view.getArrayBuffer(length, offset);
  if (buffer) {
    return new Uint8Array(buffer);
  }
  // Fallback to byte-by-byte if getArrayBuffer returns null
  const result = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = view.getUint8(offset + i);
  }
  return result;
}

function parseHexToBytes(hex: string): Uint8Array | null {
  const cleanHex = hex.replace(/\\x|0x/gi, "");
  if (cleanHex.length % 2 !== 0) {
    return null;
  }

  try {
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = parseInt(cleanHex.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes;
  } catch {
    return null;
  }
}

function getStringLikeValue(
  dataView: Deno.UnsafePointerView | null,
  row: number,
  asBlob: boolean,
  handle?: ResultHandle,
  columnIndex?: number,
): string | Uint8Array {
  if (!dataView) {
    return asBlob ? new Uint8Array() : "";
  }

  const headerOffset = row * BYTE_SIZE_64;
  const length = Number(dataView.getBigUint64(headerOffset));

  if (length > 10 * 1024 * 1024) {
    if (handle !== undefined && columnIndex !== undefined) {
      const fallback = readResultValueAsText(handle, row, columnIndex);
      if (fallback !== null) {
        return fallback;
      }
    }
    return asBlob ? new Uint8Array() : "";
  }

  if (length === 0) {
    return asBlob ? new Uint8Array() : "";
  }

  const innerPtr = dataView.getPointer(headerOffset + BYTE_SIZE_64);
  if (!innerPtr) {
    return asBlob ? new Uint8Array() : "";
  }

  const innerView = createPointerView(innerPtr);
  if (!innerView) {
    return asBlob ? new Uint8Array() : "";
  }

  if (asBlob) {
    return readBytes(innerView, 0, length);
  }

  const bytes = readBytes(innerView, 0, length);
  return textDecoder.decode(bytes);
}

/**
 * Decode a 128-bit signed integer (HugeInt) from column data.
 *
 * @internal
 * @param dataView - Pointer view to column data
 * @param row - Row index
 * @returns Decoded bigint value
 */
function decodeHugeInt(
  dataView: Deno.UnsafePointerView | null,
  row: number,
): bigint {
  if (!dataView) {
    return 0n;
  }

  const offset = row * BYTE_SIZE_128;
  const lower = dataView.getBigUint64(offset);
  const upper = dataView.getBigInt64(offset + BYTE_SIZE_64);
  return (upper << 64n) + lower;
}

function decodeUnsignedHugeInt(
  dataView: Deno.UnsafePointerView | null,
  row: number,
): bigint {
  if (!dataView) {
    return 0n;
  }

  const offset = row * BYTE_SIZE_128;
  const lower = dataView.getBigUint64(offset);
  const upper = dataView.getBigUint64(offset + BYTE_SIZE_64);
  return (upper << 64n) + lower;
}

/**
 * Convert a day count (days since 1970-01-01) to an ISO date string.
 *
 * Uses pure arithmetic to avoid JavaScript Date precision/overflow limits.
 * Follows the ISO 8601 format: YYYY-MM-DD
 *
 * @param days - Number of days since 1970-01-01 (can be negative)
 * @returns ISO-formatted date string
 */
function daysToDateString(days: number): string {
  // Pure arithmetic date calculation avoiding JS Date limits
  // Uses the fact that 400-year cycles have exactly 146097 days
  // (97 leap years * 366 + 303 normal years * 365 = 146097)

  const daysSince1970 = days;

  // Calculate year using 400-year cycles
  // Each 400-year cycle = 146097 days
  const cycles400 = Math.floor(daysSince1970 / 146097);
  const daysInCycles = cycles400 * 146097;
  let remainingDays = daysSince1970 - daysInCycles;

  // Handle negative years (before 1970)
  let year = cycles400 * 400 + 1970;

  // Each 100-year cycle (except the last in a 400-year cycle) = 36524 days
  // The last 100-year cycle in a 400-year cycle has 36525 days (1 leap year)
  const cycles100 = remainingDays >= 36525 ? 3 : Math.floor(remainingDays / 36524);
  year += cycles100 * 100;
  remainingDays -= cycles100 * (cycles100 === 3 ? 36525 : 36524);

  // Each 4-year cycle (except the last in a 100-year cycle) = 1461 days
  // The last 4-year cycle in a 100-year cycle has 1460 days (no leap years)
  const cycles4 = remainingDays >= 1461
    ? Math.floor((remainingDays - 1) / 1461)
    : Math.floor(remainingDays / 1461);
  year += cycles4 * 4;
  remainingDays -= cycles4 * (cycles4 === 24 ? 1460 : 1461);

  // Each year is either 365 or 366 days
  // A year is a leap year if divisible by 4, except if divisible by 100 unless divisible by 400
  const isLeapYear = (y: number) => (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
  let yearDays = isLeapYear(year) ? 366 : 365;

  while (remainingDays < 0) {
    year--;
    yearDays = isLeapYear(year) ? 366 : 365;
    remainingDays += yearDays;
  }

  while (remainingDays >= yearDays) {
    remainingDays -= yearDays;
    year++;
    yearDays = isLeapYear(year) ? 366 : 365;
  }

  // Now remainingDays is the day of the year (0-indexed)
  // Calculate month and day
  const daysInMonths = isLeapYear(year)
    ? [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let month = 1;
  for (let i = 0; i < daysInMonths.length; i++) {
    if (remainingDays < daysInMonths[i]) {
      break;
    }
    remainingDays -= daysInMonths[i];
    month++;
  }
  const day = remainingDays + 1;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function microsecondsToTimeString(value: bigint): string {
  const totalSeconds = value / 1_000_000n;
  const hours = totalSeconds / 3600n;
  const minutes = (totalSeconds % 3600n) / 60n;
  const seconds = totalSeconds % 60n;
  const micros = value % 1_000_000n;

  const prefix = `${String(hours).padStart(2, "0")}:${
    String(minutes).padStart(2, "0")
  }:${String(seconds).padStart(2, "0")}`;
  return micros === 0n ? prefix : `${prefix}.${String(micros).padStart(6, "0")}`;
}

/**
 * Convert microseconds since 1970-01-01 00:00:00 to an ISO timestamp string.
 *
 * Uses pure bigint arithmetic to avoid JavaScript Number precision loss.
 * JavaScript Number loses precision beyond 2^53 (approximately 225,179,981,368,5248)
 * which is only about 285,616 years in microseconds.
 *
 * @param value - Microseconds since 1970-01-01 00:00:00 (can be negative)
 * @returns ISO-formatted timestamp string with microseconds precision
 */
function microsecondsToTimestampString(value: bigint): string {
  // Constants for time calculations (all in microseconds)
  const MICROS_PER_DAY = 86_400_000_000_000n; // 86400 * 1_000_000_000
  const MICROS_PER_HOUR = 3_600_000_000_000n; // 3600 * 1_000_000_000
  const MICROS_PER_MINUTE = 60_000_000_000n; // 60 * 1_000_000_000
  const MICROS_PER_SECOND = 1_000_000n;

  // Handle negative values
  const negative = value < 0n;
  const absValue = value < 0n ? -value : value;

  // Calculate total days
  const totalDays = absValue / MICROS_PER_DAY;
  const remainingMicros = absValue % MICROS_PER_DAY;

  // Calculate time components
  const hours = remainingMicros / MICROS_PER_HOUR;
  const mins = (remainingMicros % MICROS_PER_HOUR) / MICROS_PER_MINUTE;
  const secs = (remainingMicros % MICROS_PER_MINUTE) / MICROS_PER_SECOND;
  const micros = remainingMicros % MICROS_PER_SECOND;

  // Convert days to date string (daysSince1970 can be negative)
  const daysSince1970 = totalDays < 0n ? -Number(totalDays) : Number(totalDays);

  const dateStr = daysToDateString(daysSince1970);

  // Format time with microseconds
  const timeStr = negative
    ? `-${dateStr} ${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${
      String(secs).padStart(2, "0")
    }`
    : `${dateStr} ${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${
      String(secs).padStart(2, "0")
    }`;

  return micros === 0n ? timeStr : `${timeStr}.${String(micros).padStart(6, "0")}`;
}

function decodeLegacyTextFallback(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): ValueType {
  return readResultValueAsText(handle, rowIndex, columnIndex) ?? null;
}

function decodeValueByType(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
  type: DUCKDB_TYPE,
  dataView: Deno.UnsafePointerView | null,
  validityView: Deno.UnsafePointerView | null,
): ValueType {
  if (type === DUCKDB_TYPE.DUCKDB_TYPE_INVALID) {
    return null;
  }

  if (isTextFallbackType(type)) {
    if (type === DUCKDB_TYPE.DUCKDB_TYPE_VARCHAR) {
      if (isNullFromBitmap(validityView, rowIndex, handle, columnIndex)) {
        return null;
      }
      return getStringLikeValue(dataView, rowIndex, false, handle, columnIndex);
    }

    if (type === DUCKDB_TYPE.DUCKDB_TYPE_BLOB) {
      if (isNullFromBitmap(validityView, rowIndex, handle, columnIndex)) {
        return null;
      }

      if (dataView) {
        const headerOffset = rowIndex * BYTE_SIZE_64;
        const length = Number(dataView.getBigUint64(headerOffset));
        if (length > 0 && length < 1024 * 1024) {
          const innerPtr = dataView.getPointer(headerOffset + BYTE_SIZE_64);
          if (innerPtr) {
            const innerView = createPointerView(innerPtr);
            if (innerView) {
              return readBytes(innerView, 0, length);
            }
          }
        }
      }

      const text = decodeLegacyTextFallback(handle, rowIndex, columnIndex);
      if (typeof text === "string") {
        const bytes = parseHexToBytes(text);
        if (bytes) {
          return bytes;
        }
      }
      return new Uint8Array();
    }

    if (type === DUCKDB_TYPE.DUCKDB_TYPE_BIT || type === DUCKDB_TYPE.DUCKDB_TYPE_UUID) {
      if (isNullFromBitmap(validityView, rowIndex, handle, columnIndex)) {
        return null;
      }

      if (!dataView) {
        return decodeLegacyTextFallback(handle, rowIndex, columnIndex) ?? "";
      }

      return getStringLikeValue(dataView, rowIndex, false, handle, columnIndex);
    }

    return decodeLegacyTextFallback(handle, rowIndex, columnIndex);
  }

  if (isNullFromBitmap(validityView, rowIndex, handle, columnIndex)) {
    return null;
  }

  switch (type) {
    case DUCKDB_TYPE.DUCKDB_TYPE_BOOLEAN:
      return dataView ? dataView.getInt8(rowIndex * BYTE_SIZE_8) !== 0 : false;
    case DUCKDB_TYPE.DUCKDB_TYPE_TINYINT:
      return dataView ? dataView.getInt8(rowIndex * BYTE_SIZE_8) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_SMALLINT:
      return dataView ? dataView.getInt16(rowIndex * BYTE_SIZE_16) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_INTEGER:
      return dataView ? dataView.getInt32(rowIndex * BYTE_SIZE_32) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_BIGINT:
      return dataView ? dataView.getBigInt64(rowIndex * BYTE_SIZE_64) : 0n;
    case DUCKDB_TYPE.DUCKDB_TYPE_FLOAT:
      return dataView ? dataView.getFloat32(rowIndex * BYTE_SIZE_32) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_DOUBLE:
      return dataView ? dataView.getFloat64(rowIndex * BYTE_SIZE_64) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_HUGEINT:
      return decodeHugeInt(dataView, rowIndex);
    case DUCKDB_TYPE.DUCKDB_TYPE_UTINYINT:
      return dataView ? dataView.getUint8(rowIndex * BYTE_SIZE_8) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_USMALLINT:
      return dataView ? dataView.getUint16(rowIndex * BYTE_SIZE_16) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_UINTEGER:
      return dataView ? dataView.getUint32(rowIndex * BYTE_SIZE_32) : 0;
    case DUCKDB_TYPE.DUCKDB_TYPE_UBIGINT:
      return dataView ? dataView.getBigUint64(rowIndex * BYTE_SIZE_64) : 0n;
    case DUCKDB_TYPE.DUCKDB_TYPE_UHUGEINT:
      return decodeUnsignedHugeInt(dataView, rowIndex);
    case DUCKDB_TYPE.DUCKDB_TYPE_DATE:
      return dataView
        ? daysToDateString(dataView.getInt32(rowIndex * BYTE_SIZE_32))
        : "";
    case DUCKDB_TYPE.DUCKDB_TYPE_TIME:
      return dataView
        ? microsecondsToTimeString(dataView.getBigInt64(rowIndex * BYTE_SIZE_64))
        : "";
    case DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP:
      return dataView
        ? microsecondsToTimestampString(dataView.getBigInt64(rowIndex * BYTE_SIZE_64))
        : "";
    case DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP_S:
      return dataView
        ? microsecondsToTimestampString(
          dataView.getBigInt64(rowIndex * BYTE_SIZE_64) * 1_000_000n,
        )
        : "";
    case DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP_MS:
      return dataView
        ? microsecondsToTimestampString(
          dataView.getBigInt64(rowIndex * BYTE_SIZE_64) * 1_000n,
        )
        : "";
    case DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP_NS:
      return dataView
        ? microsecondsToTimestampString(
          dataView.getBigInt64(rowIndex * BYTE_SIZE_64) / 1_000n,
        )
        : "";
    case DUCKDB_TYPE.DUCKDB_TYPE_INTERVAL: {
      if (!dataView) {
        return { months: 0, days: 0, micros: 0n };
      }

      const offset = rowIndex * BYTE_SIZE_128;
      const months = dataView.getInt32(offset);
      const days = dataView.getInt32(offset + BYTE_SIZE_32);
      const micros = dataView.getBigInt64(offset + BYTE_SIZE_64);

      // Validate months and days are within int32 bounds (they should be since we read them as int32)
      // but sanity check anyway
      if (
        months < -2147483648 || months > 2147483647
        || days < -2147483648 || days > 2147483647
      ) {
        return decodeLegacyTextFallback(handle, rowIndex, columnIndex) ?? {
          months: 0,
          days: 0,
          micros: 0n,
        };
      }

      // Validate micros is reasonable (less than ~10^15 micros = ~11,574 days = ~31 years)
      // If impossibly large, treat as corrupted data
      const MAX_REASONABLE_MICROS = 1_000_000_000_000_000n; // 10^15
      if (micros > MAX_REASONABLE_MICROS || micros < -MAX_REASONABLE_MICROS) {
        return decodeLegacyTextFallback(handle, rowIndex, columnIndex) ?? {
          months: 0,
          days: 0,
          micros: 0n,
        };
      }

      return { months, days, micros };
    }
    default:
      return decodeLegacyTextFallback(handle, rowIndex, columnIndex);
  }
}

/**
 * Build a cached result view from a result handle.
 *
 * @internal
 * @param handle - Valid result handle
 * @returns Cached ResultView with column metadata and data pointers
 */
function buildResultView(handle: ResultHandle): ResultView {
  validateResultHandle(handle);
  const columnInfos = getResultColumnInfos(handle);
  const rowCount = getResultRowCount(handle);

  const columns: ColumnVector[] = columnInfos.map((column, index) => ({
    name: column.name,
    type: column.type,
    dataView: getResultColumnData(handle, index),
    validityView: getResultColumnValidity(handle, index),
  }));

  return {
    handle,
    rowCount,
    columnCount: columnInfos.length,
    columns,
    columnInfos,
  };
}

/**
 * A class for reading values from a result set.
 *
 * Provides methods to access individual values, rows, and iterate
 * over the result set.
 *
 * @example
 * ```ts
 * const reader = createResultReader(resultHandle);
 * const value = reader.getValue(0, 0);
 * const row = reader.getRow(0);
 * for (const row of reader.rows()) {
 *   console.log(row);
 * }
 * ```
 */
export class ResultReader {
  #view: ResultView;

  constructor(handle: ResultHandle) {
    this.#view = buildResultView(handle);
  }

  get rowCount(): bigint {
    return this.#view.rowCount;
  }

  get columnCount(): number {
    return this.#view.columnCount;
  }

  get columns(): readonly ColumnInfo[] {
    return this.#view.columnInfos;
  }

  isNull(rowIndex: number, columnIndex: number): boolean {
    assertIntegerIndex(rowIndex, "Row index", Number(this.#view.rowCount));
    assertIntegerIndex(columnIndex, "Column index", this.#view.columnCount);
    const column = this.#view.columns[columnIndex];
    return isNullFromBitmap(
      column.validityView,
      rowIndex,
      this.#view.handle,
      columnIndex,
    );
  }

  getValue(rowIndex: number, columnIndex: number): ValueType {
    assertIntegerIndex(rowIndex, "Row index", Number(this.#view.rowCount));
    assertIntegerIndex(columnIndex, "Column index", this.#view.columnCount);

    const column = this.#view.columns[columnIndex];
    return decodeValueByType(
      this.#view.handle,
      rowIndex,
      columnIndex,
      column.type,
      column.dataView,
      column.validityView,
    );
  }

  /**
   * Fast path for internal row iteration - skips index validation.
   */
  decodeValueFast(
    rowIndex: number,
    columnIndex: number,
    column: ColumnVector,
  ): ValueType {
    return decodeValueByType(
      this.#view.handle,
      rowIndex,
      columnIndex,
      column.type,
      column.dataView,
      column.validityView,
    );
  }

  getRow(rowIndex: number): RowData {
    assertIntegerIndex(rowIndex, "Row index", Number(this.#view.rowCount));
    const columnCount = this.#view.columnCount;
    const columns = this.#view.columns;
    // Pre-allocate array and fill directly to avoid function mapper overhead
    const row = new Array(columnCount);
    for (let i = 0; i < columnCount; i++) {
      row[i] = this.decodeValueFast(rowIndex, i, columns[i]);
    }
    return row;
  }

  getObjectRow(rowIndex: number): ObjectRow {
    assertIntegerIndex(rowIndex, "Row index", Number(this.#view.rowCount));
    const columns = this.#view.columns;
    const row: ObjectRow = {};
    for (let i = 0; i < columns.length; i++) {
      row[columns[i].name] = this.decodeValueFast(rowIndex, i, columns[i]);
    }
    return row;
  }

  *rows(): IterableIterator<RowData> {
    const rowCount = Number(this.#view.rowCount);
    const columnCount = this.#view.columnCount;
    const columns = this.#view.columns;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      // Pre-allocate array and fill directly to avoid function mapper overhead
      const row = new Array(columnCount);
      for (let i = 0; i < columnCount; i++) {
        row[i] = this.decodeValueFast(rowIndex, i, columns[i]);
      }
      yield row;
    }
  }

  *objects(): IterableIterator<ObjectRow> {
    const rowCount = Number(this.#view.rowCount);
    const columns = this.#view.columns;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row: ObjectRow = {};
      for (let i = 0; i < columns.length; i++) {
        row[columns[i].name] = this.decodeValueFast(rowIndex, i, columns[i]);
      }
      yield row;
    }
  }

  /**
   * Materialize all rows as arrays.
   *
   * @param limits - Optional materialization limits to prevent unbounded allocation
   * @returns Array of row arrays
   * @throws {ValidationError} if row count exceeds limits
   */
  toArray(limits?: MaterializationLimits): RowData[] {
    const rowCount = Number(this.#view.rowCount);
    const effectiveLimits = getEffectiveLimits(limits);
    checkRowCountLimit(rowCount, effectiveLimits.maxRows);

    const columnCount = this.#view.columnCount;
    const columns = this.#view.columns;
    const result = new Array(rowCount);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      // Pre-allocate array and fill directly to avoid function mapper overhead
      const row = new Array(columnCount);
      for (let i = 0; i < columnCount; i++) {
        row[i] = this.decodeValueFast(rowIndex, i, columns[i]);
      }
      result[rowIndex] = row;
    }
    return result;
  }

  /**
   * Materialize all rows as objects.
   *
   * @param limits - Optional materialization limits to prevent unbounded allocation
   * @returns Array of row objects
   * @throws {ValidationError} if row count exceeds limits
   */
  toObjectArray(limits?: MaterializationLimits): ObjectRow[] {
    const rowCount = Number(this.#view.rowCount);
    const effectiveLimits = getEffectiveLimits(limits);
    checkRowCountLimit(rowCount, effectiveLimits.maxRows);

    const columns = this.#view.columns;
    const result = new Array(rowCount);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row: ObjectRow = {};
      for (let i = 0; i < columns.length; i++) {
        row[columns[i].name] = this.decodeValueFast(rowIndex, i, columns[i]);
      }
      result[rowIndex] = row;
    }
    return result;
  }
}

/**
 * Create a result reader from a result handle for value extraction.
 *
 * @param handle - A valid result handle
 * @returns A ResultReader instance
 *
 * @example
 * ```ts
 * const reader = createResultReader(resultHandle);
 * const value = reader.getValue(0, 0);
 * ```
 */
export function createResultReader(handle: ResultHandle): ResultReader {
  return new ResultReader(handle);
}
