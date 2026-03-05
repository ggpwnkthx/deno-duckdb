/**
 * Test utilities for DuckDB tests
 *
 * Provides helper functions for managing database connections and resources
 * with automatic cleanup to prevent resource leaks.
 */

import { functional as duckdb } from "@ggpwnkthx/duckdb";
import type { ConnectionHandle, DatabaseHandle } from "../src/types.ts";

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
    await duckdb.closeDatabase(db);
  }
}

/**
 * Open a database, create a connection, and run a function,
 * always cleaning up in finally
 */
export function withConn<T>(
  fn: (conn: ConnectionHandle) => Promise<T>,
): Promise<T> {
  return withDb(async (db) => {
    const conn = await duckdb.create(db);
    try {
      return await fn(conn);
    } finally {
      await duckdb.closeConnection(conn);
    }
  });
}

/**
 * Execute SQL (including DDL/INSERT) and automatically destroy the ResultHandle
 */
export async function exec(conn: ConnectionHandle, sql: string): Promise<void> {
  const handle = await duckdb.execute(conn, sql);
  await duckdb.destroyResult(handle);
}

/**
 * Run a SELECT query, return rows with automatic result destruction
 */
export async function query(
  conn: ConnectionHandle,
  sql: string,
): Promise<unknown[][]> {
  const handle = await duckdb.execute(conn, sql);
  try {
    return await duckdb.fetchAll(handle);
  } finally {
    await duckdb.destroyResult(handle);
  }
}
