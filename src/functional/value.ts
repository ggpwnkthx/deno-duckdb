/**
 * Functional result value extraction.
 */

import type { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type { ObjectRow, RowData, ValueType } from "../types.ts";
import { LazyResult } from "../core/execution.ts";
import type { ResultReader } from "../core/result.ts";

export { LazyResult } from "../core/execution.ts";
export { createResultReader, ResultReader } from "../core/result.ts";

function toReader(result: LazyResult | ResultReader): ResultReader {
  return result instanceof LazyResult ? result.reader() : result;
}

export function isNull(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): boolean {
  return toReader(result).isNull(rowIndex, columnIndex);
}

export function getValue(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): ValueType {
  return toReader(result).getValue(rowIndex, columnIndex);
}

export function getValueByType(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
  _type: DUCKDB_TYPE,
): ValueType {
  return toReader(result).getValue(rowIndex, columnIndex);
}

export function getInt32(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): number | null {
  const value = toReader(result).getValue(rowIndex, columnIndex);
  return typeof value === "number" ? Math.trunc(value) : null;
}

export function getInt64(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): bigint | null {
  const value = toReader(result).getValue(rowIndex, columnIndex);
  return typeof value === "bigint" ? value : null;
}

export function getDouble(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): number | null {
  const value = toReader(result).getValue(rowIndex, columnIndex);
  return typeof value === "number" ? value : null;
}

export function getString(
  result: LazyResult | ResultReader,
  rowIndex: number,
  columnIndex: number,
): string | null {
  const value = toReader(result).getValue(rowIndex, columnIndex);
  return typeof value === "string" ? value : null;
}

export function fetchAll(result: LazyResult | ResultReader): IterableIterator<RowData> {
  return toReader(result).rows();
}

export function fetchObjects(
  result: LazyResult | ResultReader,
): IterableIterator<ObjectRow> {
  return toReader(result).objects();
}

export function iterateRows(
  result: LazyResult | ResultReader,
): IterableIterator<RowData> {
  return toReader(result).rows();
}

export function iterateObjects(
  result: LazyResult | ResultReader,
): IterableIterator<ObjectRow> {
  return toReader(result).objects();
}
