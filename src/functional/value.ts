/**
 * Functional result value extraction.
 */

import type { ObjectRow, RowData, ValueType } from "../types.ts";
import { LazyResult } from "./execution.ts";
import type { ResultReader } from "./result.ts";

export { LazyResult } from "./execution.ts";
export { createResultReader, ResultReader } from "./result.ts";

function toReader(result: LazyResult | ResultReader): ResultReader {
  return result instanceof LazyResult ? result.reader() : result;
}

/**
 * Check if a value at a given position is null.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns true if the value is null
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT NULL, 'hello'");
 * console.log(isNull(result, 0, 0)); // true
 * console.log(isNull(result, 0, 1)); // false
 * ```
 */
export function isNull(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): boolean {
  return toReader(result).isNull(rowIndex, columnIndex);
}

/**
 * Get a value at a given position (any type).
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns The value at the position
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 42, 'test'");
 * const value = getValue(result, 0, 0);
 * console.log(value); // 42
 * ```
 */
export function getValue(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): ValueType {
  return toReader(result).getValue(rowIndex, columnIndex);
}

/**
 * Get an integer value at a given position.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns Integer value or null if not an integer
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 42");
 * const value = getInt32(result, 0, 0);
 * console.log(value); // 42
 * ```
 */
export function getInt32(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): number | null {
  const value = toReader(result).getValue(rowIndex, columnIndex);
  return typeof value === "number" ? Math.trunc(value) : null;
}

/**
 * Get a bigint value at a given position.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns BigInt value or null if not a bigint
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 1234567890123");
 * const value = getInt64(result, 0, 0);
 * console.log(value); // 1234567890123n
 * ```
 */
export function getInt64(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): bigint | null {
  const value = toReader(result).getValue(rowIndex, columnIndex);
  return typeof value === "bigint" ? value : null;
}

/**
 * Get a double value at a given position.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns Double value or null if not a number
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 3.14159");
 * const value = getDouble(result, 0, 0);
 * console.log(value); // 3.14159
 * ```
 */
export function getDouble(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): number | null {
  const value = toReader(result).getValue(rowIndex, columnIndex);
  return typeof value === "number" ? value : null;
}

/**
 * Get a string value at a given position.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns String value or null if not a string
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 'hello'");
 * const value = getString(result, 0, 0);
 * console.log(value); // "hello"
 * ```
 */
export function getString(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): string | null {
  const value = toReader(result).getValue(rowIndex, columnIndex);
  return typeof value === "string" ? value : null;
}

/**
 * Iterate over rows as arrays.
 *
 * @param result - A LazyResult or ResultReader
 * @yields Row data arrays
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT * FROM users");
 * for (const row of iterateRows(result)) {
 *   console.log(row);
 * }
 * ```
 */
export function iterateRows(
  result: LazyResult | ResultReader,
): IterableIterator<RowData> {
  return toReader(result).rows();
}

/**
 * Iterate over rows as objects.
 *
 * @param result - A LazyResult or ResultReader
 * @yields Row data objects with column names as keys
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT id, name FROM users");
 * for (const obj of iterateObjects(result)) {
 *   console.log(obj.name);
 * }
 * ```
 */
export function iterateObjects(
  result: LazyResult | ResultReader,
): IterableIterator<ObjectRow> {
  return toReader(result).objects();
}
