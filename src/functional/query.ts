/**
 * Functional query/result metadata operations.
 */

import type { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type { ColumnInfo, ConnectionHandle, ResultHandle } from "../types.ts";
import {
  destroyResult as destroyResultInternal,
  destroyResultSync as destroyResultSyncInternal,
  executeQuery,
  getResultColumnCount,
  getResultColumnInfos,
  getResultColumnName,
  getResultColumnType,
  getResultRowCount,
} from "../core/native.ts";

export function query(
  connectionHandle: ConnectionHandle,
  sql: string,
): ResultHandle {
  return executeQuery(connectionHandle, sql);
}

export function rowCount(handle: ResultHandle): bigint {
  return getResultRowCount(handle);
}

export function columnCount(handle: ResultHandle): bigint {
  return getResultColumnCount(handle);
}

export function columnName(handle: ResultHandle, index: number): string {
  return getResultColumnName(handle, index);
}

export function columnType(handle: ResultHandle, index: number): DUCKDB_TYPE {
  return getResultColumnType(handle, index);
}

export function columnInfos(handle: ResultHandle): ColumnInfo[] {
  return getResultColumnInfos(handle);
}

export function destroyResult(handle: ResultHandle): void {
  destroyResultInternal(handle);
}

export function destroyResultSync(handle: ResultHandle): void {
  destroyResultSyncInternal(handle);
}
