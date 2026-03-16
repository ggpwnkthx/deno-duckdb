/**
 * Shared types for the DuckDB wrapper.
 *
 * Defines branded handle types (DatabaseHandle, ConnectionHandle, ResultHandle,
 * PreparedStatementHandle) and value types (ValueType, RowData, ObjectRow, ColumnInfo).
 */

import type { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";

type Handle<ByteSize extends number, Brand extends string> = Uint8Array<ArrayBuffer> & {
  readonly __byteSize: ByteSize;
  readonly __brand: Brand;
};

/** 8-byte pointer buffer for a database handle. */
export type DatabaseHandle = Handle<8, "DatabaseHandle">;

/** 8-byte pointer buffer for a connection handle. */
export type ConnectionHandle = Handle<8, "ConnectionHandle">;

/** 48-byte `duckdb_result` struct buffer. */
export type ResultHandle = Handle<48, "ResultHandle">;

/** 8-byte pointer buffer for a prepared statement handle. */
export type PreparedStatementHandle = Handle<8, "PreparedStatementHandle">;

/** DuckDB interval payload. */
export interface IntervalValue {
  months: number;
  days: number;
  micros: bigint;
}

/** Scalar values surfaced by the wrapper. */
export type ValueType =
  | boolean
  | number
  | bigint
  | string
  | Uint8Array
  | null
  | IntervalValue;

/** A row as an ordered value array. */
export type RowData = ValueType[];

/** A row as a name-keyed object. */
export type ObjectRow = Record<string, ValueType>;

/** Metadata for one result column. */
export interface ColumnInfo {
  name: string;
  type: DUCKDB_TYPE;
}

/**
 * Database configuration.
 *
 * Known ergonomic fields such as `accessMode` are normalized to the names
 * expected by DuckDB (`access_mode`) before FFI calls.
 */
export interface DatabaseConfig {
  /** Database path, or `:memory:`. */
  path?: string;
  /** Ergonomic alias for DuckDB's `access_mode` option. */
  accessMode?: "read_only" | "read_write" | string;
  /** Any additional DuckDB config key/value pair. */
  readonly [key: string]: string | undefined;
}
