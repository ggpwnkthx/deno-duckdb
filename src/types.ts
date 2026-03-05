/**
 * Shared types for the DuckDB API
 */

/**
 * DuckDB type enum values
 * These constants represent the internal DuckDB type identifiers returned by duckdb_column_type
 */
export const DuckDBType = {
  /** NULL type */
  NULL: 0,
  /** Boolean type */
  BOOLEAN: 1,
  /** 8-bit integer */
  TINYINT: 2,
  /** 16-bit integer */
  SMALLINT: 3,
  /** 32-bit integer */
  INTEGER: 4,
  /** 64-bit integer */
  BIGINT: 5,
  /** 128-bit integer */
  HUGEINT: 6,
  /** 32-bit floating point */
  FLOAT: 10,
  /** 64-bit floating point */
  DOUBLE: 11,
  /** Variable-length string */
  VARCHAR: 17,
  /** Binary large object */
  BLOB: 18,
  /** Decimal type */
  DECIMAL: 19,
  /** Timestamp type */
  TIMESTAMP: 20,
  /** Date type */
  DATE: 21,
  /** Time type */
  TIME: 22,
  /** Interval type */
  INTERVAL: 23,
  /** UUID type */
  UUID: 24,
  /** List type */
  LIST: 32,
  /** Struct type */
  STRUCT: 33,
  /** Map type */
  MAP: 34,
  /** Array type */
  ARRAY: 35,
  /** Enum type */
  ENUM: 36,
} as const;

/** Type alias for DuckDB type constants */
export type DuckDBTypeValue = typeof DuckDBType[keyof typeof DuckDBType];

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
  type: DuckDBTypeValue;
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
