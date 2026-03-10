/**
 * Shared types for the DuckDB API
 */

import type { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";

/**
 * Helper to create a branded type with exact byte size
 */
type SizedHandle<T, N extends number> = T & {
  __byteSize: N;
  __brand: never;
};

type Handle<N extends number> = SizedHandle<Uint8Array<ArrayBuffer>, N>;

/** 8-byte pointer buffer for database handle */
export type DatabaseHandle = Handle<8>;

/** 8-byte pointer buffer for connection handle */
export type ConnectionHandle = Handle<8>;

/** 48-byte buffer for query result */
export type ResultHandle = Handle<48>;

/** 8-byte pointer buffer for prepared statement */
export type PreparedStatementHandle = Handle<8>;

/** 8-byte pointer buffer for data chunk */
export type DataChunkHandle = Handle<8>;

/** 8-byte pointer buffer for Arrow result handle */
export type ArrowHandle = Handle<8>;

/** 8-byte pointer buffer for Arrow schema handle */
export type ArrowSchemaHandle = Handle<8>;

/** 8-byte pointer buffer for Arrow array handle */
export type ArrowArrayHandle = Handle<8>;

/** 8-byte pointer buffer for Arrow stream handle */
export type ArrowStreamHandle = Handle<8>;

/** Database configuration options */
export interface DatabaseConfig {
  /** Path to database file, or ":memory:" for in-memory database */
  path?: string;
  /** Additional DuckDB config options (e.g., threads, max_memory, access_mode) */
  [key: string]: string | undefined;
}

/** Options for query execution */
export interface QueryOptions {
  /** Number of rows to return (0 = all) */
  limit?: number;
}

/** Column information */
export interface ColumnInfo {
  /** Column name */
  name: string;
  /** Column type (DuckDB type enum value) */
  type: DUCKDB_TYPE;
}

/** Row data as array of values */
export type RowData = unknown[];

/** Query result wrapper */
export interface QueryResult<T = RowData[]> {
  /** Handle to the result (must be destroyed) */
  handle: ResultHandle;
  /** Whether the query succeeded */
  success: boolean;
  /** Error message if query failed */
  error?: string;
  /** Query that was executed */
  query: string;
  /** Result data */
  data?: T;
}

/** Prepared statement result */
export interface PreparedResult {
  /** Handle to the prepared statement (must be destroyed) */
  handle: PreparedStatementHandle;
  /** Whether preparation succeeded */
  success: boolean;
  /** Error message if preparation failed */
  error?: string;
}

/** Interval value type */
export type IntervalValue = {
  months: number;
  days: number;
  micros: bigint;
};

/** Value types that can be retrieved from results */
export type ValueType =
  | number
  | bigint
  | string
  | boolean
  | null
  | Uint8Array
  | IntervalValue;

/** Result of opening a database */
export interface OpenResult {
  /** Handle to the database */
  handle: DatabaseHandle;
  /** Whether opening succeeded */
  success: boolean;
  /** Error message if opening failed */
  error?: string;
}

/** Result of creating a connection */
export interface ConnectResult {
  /** Handle to the connection */
  handle: ConnectionHandle;
  /** Whether connection succeeded */
  success: boolean;
  /** Error message if connection failed */
  error?: string;
}
