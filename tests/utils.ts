/**
 * Shared test helpers for the package.
 */

import * as functional from "../src/functional/mod.ts";
import { type Connection, Database } from "../src/objective/mod.ts";
import type {
  ConnectionHandle,
  ObjectRow,
  ResultHandle,
  RowData,
} from "../src/types.ts";

export type { ObjectRow, RowData } from "../src/types.ts";

export async function withFunctionalConnection<T>(
  fn: (connection: ConnectionHandle) => Promise<T> | T,
): Promise<T> {
  const database = await functional.open();

  try {
    const connection = await functional.create(database);

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
  fn: (database: Database, connection: Connection) => Promise<T> | T,
): Promise<T> {
  const database = new Database();

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

export function execFunctional(
  connection: ConnectionHandle,
  sql: string,
): void {
  const result = functional.query(connection, sql);

  try {
    // DDL / INSERT side effects happen during execution.
  } finally {
    functional.destroyResult(result);
  }
}

export function materializeResultRows(
  handle: ResultHandle,
): RowData[] {
  return functional.fetchAll(handle).map((row) =>
    row.map((value) => value instanceof Uint8Array ? value.slice() : value)
  );
}

export function materializeResultObjects(
  handle: ResultHandle,
): ObjectRow[] {
  return functional.fetchObjects(handle).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        value instanceof Uint8Array ? value.slice() : value,
      ]),
    ) as ObjectRow
  );
}
