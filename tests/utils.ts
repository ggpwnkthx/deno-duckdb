/**
 * Shared test helpers for the package.
 *
 * This module provides utilities for writing tests against the DuckDB wrapper.
 * All tests must use `sanitizeResources: false` and `sanitizeOps: false` because
 * Deno's resource sanitizer cannot track FFI-allocated resources (native pointers
 * and memory from DuckDB). Resources are properly cleaned up in `finally` blocks.
 *
 * @example
 * ```ts
 * import { test, withFunctionalConnection } from "./utils.ts";
 *
 * test("my test", () =>
 *   withFunctionalConnection((conn) => {
 *     // test code
 *   }));
 * ```
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import type { ConnectionHandle, ObjectRow, RowData } from "@ggpwnkthx/duckdb";

/**
 * Wrapper around Deno.test that disables resource and ops sanitization.
 *
 * This is required because Deno's sanitizer cannot track FFI-allocated resources
 * (native pointers/memory from DuckDB). All cleanup happens in `finally` blocks.
 *
 * @param name - Test name
 * @param fn - Test function
 */
export function test(
  name: string,
  fn: () => void | Promise<void>,
): void {
  Deno.test({
    name,
    sanitizeResources: false,
    sanitizeOps: false,
    fn,
  });
}

/**
 * Execute a test function with a functional API connection.
 *
 * Handles database/connection lifecycle - opens database, creates connection,
 * passes it to the test function, then properly closes resources in finally.
 *
 * @param fn - Test function receiving a connection handle
 * @returns The result of the test function
 *
 * @example
 * ```ts
 * test("my test", () =>
 *   withFunctionalConnection((conn) => {
 *     const result = functional.query(conn, "SELECT 1");
 *     assertEquals(result, [[1]]);
 *   }));
 * ```
 */
export async function withFunctionalConnection<T>(
  fn: (connection: ConnectionHandle) => Promise<T> | T,
): Promise<T> {
  const database = await functional.open();

  try {
    const connection = await functional.connect(database);

    try {
      return await fn(connection);
    } finally {
      functional.closeConnection(connection);
    }
  } finally {
    functional.closeDatabase(database);
  }
}

/**
 * Execute a test function with an objective API connection.
 *
 * Handles database/connection lifecycle using Symbol.dispose for automatic cleanup.
 *
 * @param fn - Test function receiving database and connection instances
 * @returns The result of the test function
 *
 * @example
 * ```ts
 * test("my test", () =>
 *   withObjectiveConnection((db, conn) => {
 *     const result = conn.query("SELECT 1");
 *     assertEquals([...result.rows()], [[1]]);
 *   }));
 * ```
 */
export async function withObjectiveConnection<T>(
  fn: (
    database: objective.Database,
    connection: objective.Connection,
  ) => Promise<T> | T,
): Promise<T> {
  const database = new objective.Database();

  try {
    const connection = await database.connect();

    try {
      return await fn(database, connection);
    } finally {
      connection.close();
    }
  } finally {
    database.close();
  }
}

/**
 * Execute DDL or mutation query using a prepared statement.
 *
 * Uses prepared statements to execute schema-modifying queries (CREATE TABLE,
 * INSERT, etc.) which don't return results. This avoids the cached query's
 * null return behavior for such queries.
 *
 * @param connection - Connection handle
 * @param sql - SQL statement to execute
 */
export function execFunctional(
  connection: ConnectionHandle,
  sql: string,
): void {
  const stmt = functional.prepare(connection, sql);
  const result = functional.executePrepared(stmt);

  try {
    // DDL side effects happen during execution
  } finally {
    functional.destroy(result);
    functional.destroyPrepared(stmt);
  }
}

/**
 * Execute a SELECT query and return rows as arrays.
 *
 * Uses the cached query function which returns null on query failure
 * (not for empty results).
 *
 * @param connection - Connection handle
 * @param sql - SELECT query
 * @returns Array of rows or null if query fails
 */
export function queryCachedRows(
  connection: ConnectionHandle,
  sql: string,
): RowData[] | null {
  const result = functional.query(connection, sql);
  return result ? [...result] : null;
}

/**
 * Execute a SELECT query and return rows as objects.
 *
 * Uses the cached query function which returns null on query failure
 * (not for empty results).
 *
 * @param connection - Connection handle
 * @param sql - SELECT query
 * @returns Array of object rows or null if query fails
 */
export function queryCachedObjects(
  connection: ConnectionHandle,
  sql: string,
): ObjectRow[] | null {
  const result = functional.queryObjects(connection, sql);
  return result ? [...result] : null;
}

/**
 * Execute a query and materialize results as object rows.
 *
 * Uses executeSqlResult for full control over result lifecycle.
 * Returns defensive copies of values including Uint8Array (BLOB).
 *
 * @param reader - ResultReader from executeSqlResult
 * @returns Array of object rows
 */
export function materializeResultObjects(
  reader: functional.ResultReader,
): ObjectRow[] {
  return [...functional.iterateObjects(reader)].map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        value instanceof Uint8Array ? value.slice() : value,
      ]),
    ) as ObjectRow
  );
}

/**
 * Execute a query and materialize results as row arrays.
 *
 * Uses executeSqlResult for full control over result lifecycle.
 * Returns defensive copies of Uint8Array (BLOB) values.
 *
 * @param reader - ResultReader from executeSqlResult
 * @returns Array of row arrays
 */
export function materializeResultRows(
  reader: functional.ResultReader,
): RowData[] {
  return [...functional.iterateRows(reader)].map((row) =>
    row.map((value) => value instanceof Uint8Array ? value.slice() : value)
  );
}

/**
 * Schema for creating test tables.
 */
export type TestTable = {
  /** Name of the table */
  name: string;
  /** Column definitions (e.g., "id INTEGER, name TEXT") */
  schema: string;
  /** Initial rows to insert */
  rows: unknown[][];
};

/**
 * Create a table and optionally insert rows.
 *
 * Uses prepared statements for both table creation and row insertion
 * to properly handle all value types.
 *
 * @param connection - Connection handle
 * @param table - Table definition including name, schema, and rows
 *
 * @example
 * ```ts
 * createTable(connection, {
 *   name: "users",
 *   schema: "id INTEGER PRIMARY KEY, name TEXT",
 *   rows: [[1, "Alice"], [2, "Bob"]],
 * });
 * ```
 */
export function createTable(
  connection: ConnectionHandle,
  table: TestTable,
): void {
  execFunctional(connection, `CREATE TABLE ${table.name}(${table.schema})`);
  if (table.rows.length > 0) {
    const placeholders = table.rows[0].map(() => "?").join(", ");
    const stmt = functional.prepare(
      connection,
      `INSERT INTO ${table.name} VALUES (${placeholders})`,
    );
    for (const row of table.rows) {
      functional.bind(stmt, row as never[]);
      functional.executePrepared(stmt);
    }
    functional.destroyPrepared(stmt);
  }
}

/**
 * Execute multiple SQL statements in sequence.
 *
 * Useful for test setup that requires multiple DDL statements.
 *
 * @param connection - Connection handle
 * @param statements - Array of SQL statements to execute
 */
export function executeSetup(
  connection: ConnectionHandle,
  statements: string[],
): void {
  for (const sql of statements) {
    execFunctional(connection, sql);
  }
}
