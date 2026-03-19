/**
 * Shared test helpers for the package.
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import type { ConnectionHandle, ObjectRow, RowData } from "@ggpwnkthx/duckdb";

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
 * This avoids the cached query's null return for schema-modifying queries.
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
    functional.destroyResult(result);
    functional.destroyPrepared(stmt);
  }
}

/**
 * Execute a cached SELECT query and return the rows.
 * Returns null if query fails (not for empty results).
 */
export function queryCachedRows(
  connection: ConnectionHandle,
  sql: string,
): RowData[] | null {
  const result = functional.query(connection, sql);
  return result ? [...result] : null;
}

/**
 * Execute a cached SELECT query and return object rows.
 * Returns null if query fails (not for empty results).
 */
export function queryCachedObjects(
  connection: ConnectionHandle,
  sql: string,
): ObjectRow[] | null {
  const result = functional.queryObjects(connection, sql);
  return result ? [...result] : null;
}

export function materializeResultRows(
  reader: functional.ResultReader,
): RowData[] {
  return [...functional.iterateRows(reader)].map((row) =>
    row.map((value) => value instanceof Uint8Array ? value.slice() : value)
  );
}

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
