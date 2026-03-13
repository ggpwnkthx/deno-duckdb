/**
 * Functional prepared-statement operations.
 */

import type {
  ConnectionHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "../types.ts";
import {
  bindPreparedParameters,
  destroyPreparedStatement,
  destroyPreparedStatementSync,
  executePreparedStatement,
  preparedColumnCount as preparedColumnCountInternal,
  prepareStatement,
  resetPreparedStatement,
  resetPreparedStatementSync,
} from "../core/native.ts";
import type { BindValue } from "../core/native.ts";

export type { BindValue } from "../core/native.ts";

export function prepare(
  connectionHandle: ConnectionHandle,
  sql: string,
): PreparedStatementHandle {
  return prepareStatement(connectionHandle, sql);
}

export function bind(
  handle: PreparedStatementHandle,
  params: readonly BindValue[],
): void {
  bindPreparedParameters(handle, params);
}

export function executePrepared(
  handle: PreparedStatementHandle,
): ResultHandle {
  return executePreparedStatement(handle);
}

export function preparedColumnCount(
  handle: PreparedStatementHandle,
): bigint {
  return preparedColumnCountInternal(handle);
}

export function resetPrepared(handle: PreparedStatementHandle): void {
  resetPreparedStatement(handle);
}

export function resetPreparedSync(handle: PreparedStatementHandle): void {
  resetPreparedStatementSync(handle);
}

export function destroyPrepared(handle: PreparedStatementHandle): void {
  destroyPreparedStatement(handle);
}

export function destroyPreparedSync(handle: PreparedStatementHandle): void {
  destroyPreparedStatementSync(handle);
}
