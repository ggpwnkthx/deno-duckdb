/**
 * Shared test helpers for the package.
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import type { ConnectionHandle, ObjectRow, RowData } from "@ggpwnkthx/duckdb";

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
    functional.destroy(result);
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

/**
 * Execute a SELECT query using executeSqlResult and materialize as object rows.
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

export function materializeResultRows(
  reader: functional.ResultReader,
): RowData[] {
  return [...functional.iterateRows(reader)].map((row) =>
    row.map((value) => value instanceof Uint8Array ? value.slice() : value)
  );
}

export type TestTable = {
  name: string;
  schema: string;
  rows: unknown[][];
};

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

export function executeSetup(
  connection: ConnectionHandle,
  statements: string[],
): void {
  for (const sql of statements) {
    execFunctional(connection, sql);
  }
}
