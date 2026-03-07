/**
 * Test utilities for DuckDB tests
 *
 * Provides helper functions for managing database connections and resources
 * with automatic cleanup to prevent resource leaks.
 */

import * as duckdb from "@ggpwnkthx/duckdb/functional";
import type {
  ConnectionHandle,
  DatabaseHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "@ggpwnkthx/duckdb";

/** Row data as array of values */
export type RowData = unknown[];

/**
 * Open a database and run a function, always closing the database in finally
 */
export async function withDb<T>(
  fn: (db: DatabaseHandle) => Promise<T>,
): Promise<T> {
  const db = await duckdb.open();
  try {
    return await fn(db);
  } finally {
    duckdb.closeDatabase(db);
  }
}

/**
 * Open a database, create a connection, and run a function,
 * always cleaning up in finally
 */
export function withConn<T>(
  fn: (conn: ConnectionHandle) => Promise<T> | T,
): Promise<T> {
  return withDb(async (db) => {
    const conn = await duckdb.create(db);
    try {
      return await fn(conn);
    } finally {
      duckdb.closeConnection(conn);
    }
  });
}

/**
 * Execute SQL (including DDL/INSERT) and automatically destroy the ResultHandle
 */
export function exec(conn: ConnectionHandle, sql: string): void {
  const handle = duckdb.execute(conn, sql);
  duckdb.destroyResult(handle);
}

/**
 * Run a SELECT query, return rows with automatic result destruction
 */
export function query(
  conn: ConnectionHandle,
  sql: string,
): RowData[] {
  const handle = duckdb.execute(conn, sql);
  try {
    return duckdb.fetchAll(handle);
  } finally {
    duckdb.destroyResult(handle);
  }
}

/**
 * Query a single row. Returns first row or throws if empty.
 */
export function queryOne(conn: ConnectionHandle, sql: string): RowData {
  const rows = query(conn, sql);
  if (rows.length === 0) {
    throw new Error(`Query returned no rows: ${sql}`);
  }
  return rows[0];
}

/**
 * Execute multiple SQL statements (useful for test setup).
 * Throws on first error.
 */
export function execBatch(conn: ConnectionHandle, sql: string): void {
  const stmts = sql.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of stmts) {
    exec(conn, stmt);
  }
}

/**
 * Manage prepared statement lifecycle with automatic cleanup.
 * Calls fn with (preparedHandle, executeResultHandle) and cleans up both.
 */
export function withPrepared<T>(
  conn: ConnectionHandle,
  sql: string,
  fn: (prepHandle: PreparedStatementHandle, execHandle: ResultHandle) => T,
): T {
  const prepHandle = duckdb.prepare(conn, sql);
  const execHandle = duckdb.executePrepared(prepHandle);
  try {
    return fn(prepHandle, execHandle);
  } finally {
    duckdb.destroyResult(execHandle);
    duckdb.destroyPrepared(prepHandle);
  }
}

/**
 * Same as above but with parameter binding support.
 */
export function withPreparedParams<T>(
  conn: ConnectionHandle,
  sql: string,
  params: Parameters<typeof duckdb.bind>[1],
  fn: (prepHandle: PreparedStatementHandle, execHandle: ResultHandle) => T,
): T {
  const prepHandle = duckdb.prepare(conn, sql);
  try {
    duckdb.bind(prepHandle, params);
    const execHandle = duckdb.executePrepared(prepHandle);
    try {
      return fn(prepHandle, execHandle);
    } finally {
      duckdb.destroyResult(execHandle);
    }
  } finally {
    duckdb.destroyPrepared(prepHandle);
  }
}
