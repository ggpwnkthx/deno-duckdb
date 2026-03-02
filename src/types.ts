/**
 * Shared types for the DuckDB API
 */

import type { symbols } from "@ggpwnkthx/libduckdb";

/** The loaded DuckDB library with FFI symbols */
export type DuckDBLibrary = Deno.DynamicLibrary<typeof symbols>;

/** 8-byte pointer buffer for database handle */
export type DatabaseHandle = Uint8Array<ArrayBuffer>;

/** 8-byte pointer buffer for connection handle */
export type ConnectionHandle = Uint8Array<ArrayBuffer>;

/** 48-byte buffer for query result */
export type ResultHandle = Uint8Array<ArrayBuffer>;

/** 8-byte pointer buffer for prepared statement */
export type PreparedStatementHandle = Uint8Array<ArrayBuffer>;

/** Database configuration options */
export interface DatabaseConfig {
  /** Path to database file, or ":memory:" for in-memory database */
  path?: string;
  /** Access mode: "read_write" or "read_only" */
  accessMode?: "read_write" | "read_only";
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
  type: number;
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

/** Value types that can be retrieved from results */
export type ValueType = number | bigint | string | boolean | null | Uint8Array;

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
