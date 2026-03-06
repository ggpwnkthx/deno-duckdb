/**
 * Test utilities for DuckDB tests
 *
 * Provides helper functions for managing database connections and resources
 * with automatic cleanup to prevent resource leaks.
 */

import * as duckdb from "@ggpwnkthx/duckdb/functional";
import type { ConnectionHandle, DatabaseHandle } from "@ggpwnkthx/duckdb";

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
): unknown[][] {
  const handle = duckdb.execute(conn, sql);
  try {
    return duckdb.fetchAll(handle);
  } finally {
    duckdb.destroyResult(handle);
  }
}
