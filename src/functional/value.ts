/**
 * Functional result value extraction.
 */

import type { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type { ObjectRow, ResultHandle, RowData, ValueType } from "../types.ts";
import { createResultReader } from "../core/result.ts";

export { createResultReader, ResultReader } from "../core/result.ts";

export function isNull(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): boolean {
  return createResultReader(handle).isNull(rowIndex, columnIndex);
}

export function getValue(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): ValueType {
  return createResultReader(handle).getValue(rowIndex, columnIndex);
}

export function getValueByType(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
  _type: DUCKDB_TYPE,
): ValueType {
  // The cached reader already knows the column type, so the explicit `_type`
  // argument remains only for backward-compatible call sites.
  return createResultReader(handle).getValue(rowIndex, columnIndex);
}

export function getInt32(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): number | null {
  const value = getValue(handle, rowIndex, columnIndex);
  return typeof value === "number" ? Math.trunc(value) : null;
}

export function getInt64(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): bigint | null {
  const value = getValue(handle, rowIndex, columnIndex);
  return typeof value === "bigint" ? value : null;
}

export function getDouble(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): number | null {
  const value = getValue(handle, rowIndex, columnIndex);
  return typeof value === "number" ? value : null;
}

export function getString(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): string | null {
  const value = getValue(handle, rowIndex, columnIndex);
  return typeof value === "string" ? value : null;
}

export function fetchAll(handle: ResultHandle): RowData[] {
  return createResultReader(handle).toArray();
}

export function fetchObjects(handle: ResultHandle): ObjectRow[] {
  return createResultReader(handle).toObjectArray();
}

export function* iterateRows(handle: ResultHandle): IterableIterator<RowData> {
  yield* createResultReader(handle).rows();
}

export function* iterateObjects(
  handle: ResultHandle,
): IterableIterator<ObjectRow> {
  yield* createResultReader(handle).objects();
}
