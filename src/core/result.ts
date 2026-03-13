/**
 * Result decoding and row/object materialization.
 */

import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type {
  ColumnInfo,
  ObjectRow,
  ResultHandle,
  RowData,
  ValueType,
} from "../types.ts";
import {
  BYTE_SIZE_128,
  BYTE_SIZE_16,
  BYTE_SIZE_32,
  BYTE_SIZE_64,
  BYTE_SIZE_8,
  createPointerView,
  validateResultHandle,
} from "./handles.ts";
import {
  getResultColumnData,
  getResultColumnInfos,
  getResultColumnValidity,
  getResultRowCount,
  isResultValueNull,
  readResultValueAsText,
} from "./native.ts";
import { assertIntegerIndex } from "./validate.ts";

interface ColumnVector {
  readonly name: string;
  readonly type: DUCKDB_TYPE;
  readonly dataView: Deno.UnsafePointerView | null;
  readonly validityView: Deno.UnsafePointerView | null;
}

interface ResultView {
  readonly handle: ResultHandle;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly columns: readonly ColumnVector[];
  readonly columnInfos: readonly ColumnInfo[];
}

// Types that need special handling via text fallback
const TEXT_FALLBACK_TYPES = new Set([
  DUCKDB_TYPE.DUCKDB_TYPE_VARCHAR,
  DUCKDB_TYPE.DUCKDB_TYPE_BLOB,
  DUCKDB_TYPE.DUCKDB_TYPE_BIT,
]);

function isTextFallbackType(type: DUCKDB_TYPE): boolean {
  // Check if it's a known type that uses text fallback
  if (TEXT_FALLBACK_TYPES.has(type)) {
    return true;
  }
  // Check if it's not in the standard enum values (unknown type)
  const enumValues = Object.values(DUCKDB_TYPE).filter(
    (v) => typeof v === "number",
  );
  return !enumValues.includes(type);
}

/**
 * Check if a value is null using the cached validity bitmap.
 * Falls back to FFI call when validityView is null (function unavailable).
 * In DuckDB's validity mask: 1 = valid (not null), 0 = null.
 */
function isNullFromBitmap(
  validityView: Deno.UnsafePointerView | null,
  rowIndex: number,
  handle?: ResultHandle,
  columnIndex?: number,
): boolean {
  if (!validityView) {
    // Validity function unavailable - fall back to FFI if handle provided
    if (handle !== undefined && columnIndex !== undefined) {
      return isResultValueNull(handle, rowIndex, columnIndex);
    }
    // No fallback available - assume not null (DuckDB optimization case)
    return false;
  }

  const bitmapIndex = Math.floor(rowIndex / 8);
  const bitIndex = rowIndex % 8;
  const byte = validityView.getUint8(bitmapIndex);
  // In DuckDB's validity mask: 1 = valid (not null), 0 = null
  return (byte & (1 << bitIndex)) === 0;
}

function readBytes(
  view: Deno.UnsafePointerView | null,
  offset: number,
  length: number,
): Uint8Array {
  if (!view || length <= 0) {
    return new Uint8Array();
  }

  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = view.getUint8(offset + index);
  }
  return bytes;
}

function parseHexToBytes(hex: string): Uint8Array | null {
  // Handle formats like "\xC0\xFF\xEE" or "C0FFEE"
  const cleanHex = hex.replace(/\\x|0x/gi, "");
  if (cleanHex.length % 2 !== 0) {
    return null;
  }
  try {
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
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

  // DuckDB's string/blob result layout uses 64-byte headers per row
  // The header contains: 8 bytes length + 8 bytes pointer to data
  const headerOffset = row * BYTE_SIZE_64;

  // Get the length from the header (first 8 bytes)
  const length = Number(dataView.getBigUint64(headerOffset));

  // Safety check: if length is unreasonable, use fallback
  if (length > 10 * 1024 * 1024) {
    // > 10MB
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

  // Get the inner pointer to the actual string data (at offset 8 bytes)
  const innerPtr = dataView.getPointer(headerOffset + BYTE_SIZE_64);
  if (!innerPtr) {
    return asBlob ? new Uint8Array() : "";
  }

  const innerView = createPointerView(innerPtr);
  if (!innerView) {
    return asBlob ? new Uint8Array() : "";
  }

  if (asBlob) {
    // For BLOB, read the exact number of bytes specified in the length
    return readBytes(innerView, 0, length);
  }

  // For VARCHAR, read the string with the specified length
  const bytes = readBytes(innerView, 0, length);
  return new TextDecoder().decode(bytes);
}

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

function daysToDateString(days: number): string {
  const date = new Date(Date.UTC(1970, 0, 1));
  date.setUTCDate(date.getUTCDate() + days);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function microsecondsToTimestampString(value: bigint): string {
  const millis = Number(value / 1_000n);
  const micros = value % 1_000_000n;
  const date = new Date(millis);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  const prefix = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return micros === 0n ? prefix : `${prefix}.${String(micros).padStart(6, "0")}`;
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

  // For VARCHAR, BLOB, and unknown types, use text fallback directly
  // to avoid issues with null detection for some types
  if (isTextFallbackType(type)) {
    // Handle VARCHAR and BLOB with direct reading when possible
    if (type === DUCKDB_TYPE.DUCKDB_TYPE_VARCHAR) {
      // Check null via cached bitmap
      if (isNullFromBitmap(validityView, rowIndex, handle, columnIndex)) {
        return null;
      }
      return getStringLikeValue(dataView, rowIndex, false, handle, columnIndex);
    }
    if (type === DUCKDB_TYPE.DUCKDB_TYPE_BLOB) {
      // Check null via cached bitmap
      if (isNullFromBitmap(validityView, rowIndex)) {
        return null;
      }
      // Try direct read first
      if (dataView) {
        const headerOffset = rowIndex * BYTE_SIZE_64;
        const length = Number(dataView.getBigUint64(headerOffset));
        // Safety check: only read if length is reasonable (< 1MB)
        if (length > 0 && length < 1024 * 1024) {
          const innerPtr = dataView.getPointer(headerOffset + BYTE_SIZE_64);
          if (innerPtr) {
            const innerView = createPointerView(innerPtr);
            if (innerView) {
              const bytes = readBytes(innerView, 0, length);
              // Check if we got reasonable data
              let hasNull = false;
              for (let i = 0; i < Math.min(length, bytes.length); i++) {
                if (bytes[i] === 0 && i < bytes.length - 1) {
                  hasNull = true;
                  break;
                }
              }
              if (!hasNull || bytes.length === length) {
                return bytes;
              }
            }
          }
        }
      }
      // Fallback: try to parse hex string from text API
      const text = decodeLegacyTextFallback(handle, rowIndex, columnIndex);
      if (typeof text === "string") {
        const bytes = parseHexToBytes(text);
        if (bytes) {
          return bytes;
        }
      }
      return new Uint8Array();
    }
    // Handle BIT as a string type (like VARCHAR)
    // Note: BIT type (id 29) has no direct column data in DuckDB FFI and
    // duckdb_value_varchar returns null. Users should use CAST to VARCHAR
    // in their queries for reliable results.
    if (type === DUCKDB_TYPE.DUCKDB_TYPE_BIT) {
      // Check null via cached bitmap
      if (isNullFromBitmap(validityView, rowIndex)) {
        return null;
      }
      // If dataView is null (no direct data pointer), try text fallback
      if (!dataView) {
        const textResult = decodeLegacyTextFallback(handle, rowIndex, columnIndex);
        // Text fallback also returns null for BIT - return empty string to avoid null confusion
        return textResult ?? "";
      }
      return getStringLikeValue(dataView, rowIndex, false, handle, columnIndex);
    }
    // Handle UUID as a string type
    // Note: UUID type (id 27) has no direct column data in DuckDB FFI and
    // duckdb_value_varchar returns null. Users should use CAST to VARCHAR
    // in their queries for reliable results.
    if (type === DUCKDB_TYPE.DUCKDB_TYPE_UUID) {
      // Check null via cached bitmap
      if (isNullFromBitmap(validityView, rowIndex)) {
        return null;
      }
      // If dataView is null, try text fallback
      if (!dataView) {
        const textResult = decodeLegacyTextFallback(handle, rowIndex, columnIndex);
        // Text fallback also returns null for UUID - return empty string
        return textResult ?? "";
      }
      return getStringLikeValue(dataView, rowIndex, false, handle, columnIndex);
    }
    // For unknown types, use text fallback
    return decodeLegacyTextFallback(handle, rowIndex, columnIndex);
  }

  // Check null via cached bitmap for primitive types
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
        ? microsecondsToTimeString(
          dataView.getBigInt64(rowIndex * BYTE_SIZE_64),
        )
        : "";
    case DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP:
      return dataView
        ? microsecondsToTimestampString(
          dataView.getBigInt64(rowIndex * BYTE_SIZE_64),
        )
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
      return {
        months: dataView.getInt32(offset),
        days: dataView.getInt32(offset + BYTE_SIZE_32),
        micros: dataView.getBigInt64(offset + BYTE_SIZE_64),
      };
    }
    default:
      return decodeLegacyTextFallback(handle, rowIndex, columnIndex);
  }
}

function buildResultView(handle: ResultHandle): ResultView {
  validateResultHandle(handle);
  const columnInfos = getResultColumnInfos(handle);
  const rowCount = Number(getResultRowCount(handle));

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
 * Cached result reader that avoids re-reading column metadata for every cell.
 */
export class ResultReader {
  #view: ResultView;

  constructor(handle: ResultHandle) {
    this.#view = buildResultView(handle);
  }

  get rowCount(): number {
    return this.#view.rowCount;
  }

  get columnCount(): number {
    return this.#view.columnCount;
  }

  get columns(): readonly ColumnInfo[] {
    return this.#view.columnInfos;
  }

  isNull(rowIndex: number, columnIndex: number): boolean {
    assertIntegerIndex(rowIndex, "Row index", this.#view.rowCount);
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
    assertIntegerIndex(rowIndex, "Row index", this.#view.rowCount);
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

  getRow(rowIndex: number): RowData {
    assertIntegerIndex(rowIndex, "Row index", this.#view.rowCount);
    const row: RowData = new Array(this.#view.columnCount);

    for (
      let columnIndex = 0;
      columnIndex < this.#view.columnCount;
      columnIndex += 1
    ) {
      row[columnIndex] = this.getValue(rowIndex, columnIndex);
    }

    return row;
  }

  getObjectRow(rowIndex: number): ObjectRow {
    assertIntegerIndex(rowIndex, "Row index", this.#view.rowCount);
    const row: ObjectRow = {};

    for (
      let columnIndex = 0;
      columnIndex < this.#view.columnCount;
      columnIndex += 1
    ) {
      const column = this.#view.columns[columnIndex];
      row[column.name] = this.getValue(rowIndex, columnIndex);
    }

    return row;
  }

  *rows(): IterableIterator<RowData> {
    for (let index = 0; index < this.#view.rowCount; index += 1) {
      yield this.getRow(index);
    }
  }

  *objects(): IterableIterator<ObjectRow> {
    for (let index = 0; index < this.#view.rowCount; index += 1) {
      yield this.getObjectRow(index);
    }
  }

  toArray(): RowData[] {
    return Array.from(this.rows());
  }

  toObjectArray(): ObjectRow[] {
    return Array.from(this.objects());
  }
}

export function createResultReader(handle: ResultHandle): ResultReader {
  return new ResultReader(handle);
}
