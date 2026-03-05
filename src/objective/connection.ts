/**
 * Object-Oriented Connection class
 */

import type { ConnectionHandle, RowData } from "../types.ts";
import type { DuckDBLibrary } from "../lib.ts";
import { DatabaseError } from "../errors.ts";
import { isValidHandle } from "../helpers.ts";
import * as query from "../functional/query.ts";
import * as prep from "../functional/prepared.ts";
import * as value from "../functional/value.ts";
import { stream } from "../functional/stream.ts";
import type { Database } from "./database.ts";
import { QueryResult as QueryResultClass } from "./query.ts";
import { PreparedStatement } from "./prepared.ts";

/** Async generator type for streaming rows */
export type RowStream = AsyncGenerator<RowData, void, unknown>;

/**
 * Connection class - represents a connection to a DuckDB database
 */
export class Connection {
  private lib: DuckDBLibrary;
  private handle: ConnectionHandle | null = null;
  private closed = false;
  private database: Database;

  /**
   * Create a new Connection instance (internal use)
   *
   * @param lib - The loaded DuckDB library
   * @param handle - Connection handle
   * @param database - Parent database
   */
  constructor(
    lib: DuckDBLibrary,
    handle: ConnectionHandle,
    database: Database,
  ) {
    this.lib = lib;
    this.handle = handle;
    this.database = database;
  }

  /**
   * Execute a query and return results
   *
   * @param sql - SQL query string
   * @returns QueryResult instance
   */
  async query(sql: string): Promise<QueryResultClass> {
    this.checkNotClosed();
    if (!sql || !sql.trim()) {
      throw new DatabaseError("SQL query cannot be empty");
    }
    const handle = await query.execute(this.handle!, sql);
    return new QueryResultClass(handle, this);
  }

  /**
   * Execute a query and return typed results
   *
   * This method automatically maps rows to objects with column names as keys.
   * You can optionally provide a custom mapper function to transform the data.
   *
   * @param sql - SQL query string
   * @param mapper - Optional function to transform each row (defaults to mapping column names)
   * @returns Array of typed objects
   *
   * @example
   * ```typescript
   * // Basic usage - returns array of objects with column names
   * const rows = conn.queryTyped<{ id: number; name: string }>(
   *   "SELECT id, name FROM users"
   * );
   *
   * // With custom mapper
   * const rows = conn.queryTyped(
   *   "SELECT id, name, created_at FROM users",
   *   (row, cols) => ({
   *     userId: row[cols.indexOf("id")],
   *     displayName: row[cols.indexOf("name")],
   *     createdAt: new Date(row[cols.indexOf("created_at")]),
   *   })
   * );
   * ```
   */
  async queryTyped<T>(
    sql: string,
    mapper?: (row: RowData, columns: string[]) => T,
  ): Promise<T[]> {
    this.checkNotClosed();
    if (!sql || !sql.trim()) {
      throw new DatabaseError("SQL query cannot be empty");
    }
    const handle = await query.execute(this.handle!, sql);

    try {
      const rows = await value.fetchAll(handle);
      const columns = (await query.columnInfos(handle)).map(
        (c) => c.name,
      );

      if (mapper) {
        return rows.map((row) => mapper(row, columns));
      }

      // Default mapper: convert to object with column names as keys
      return rows.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj as T;
      });
    } finally {
      await query.destroyResult(handle);
    }
  }

  /**
   * Execute a query and fetch all rows
   *
   * @param sql - SQL query string
   * @returns Array of rows
   */
  async queryAll(sql: string): Promise<RowData[]> {
    const result = await this.query(sql);
    return result.fetchAll();
  }

  /**
   * Execute a query and stream rows lazily
   *
   * This method returns an async generator that yields rows one at a time,
   * avoiding loading all rows into memory at once. Useful for large result sets.
   *
   * @param sql - SQL query string
   * @returns AsyncGenerator yielding rows
   */
  async *stream(sql: string): RowStream {
    this.checkNotClosed();
    if (!sql || !sql.trim()) {
      throw new DatabaseError("SQL query cannot be empty");
    }
    // Delegate to functional stream
    yield* stream(this.handle!, sql);
  }

  /**
   * Prepare a statement
   *
   * @param sql - SQL statement to prepare
   * @returns PreparedStatement instance
   */
  async prepare(sql: string): Promise<PreparedStatement> {
    this.checkNotClosed();
    if (!sql || !sql.trim()) {
      throw new DatabaseError("SQL statement cannot be empty");
    }

    // Prepare new statement - throws on error
    const handle = await prep.prepare(this.handle!, sql);

    return new PreparedStatement(handle, this);
  }

  /**
   * Close the connection (synchronous for use with Symbol.dispose)
   */
  close(): void {
    if (this.closed || !this.handle) return;

    // Call FFI directly - synchronous since library is already loaded
    if (isValidHandle(this.handle)) {
      this.lib.symbols.duckdb_disconnect(this.handle);
    }
    this.handle = null;
    this.closed = true;
    this.database._onConnectionClose(this);
  }

  /**
   * Check if connection is closed
   */
  isClosed(): boolean {
    return this.closed;
  }

  /**
   * Auto-cleanup using Symbol.dispose
   */
  [Symbol.dispose](): void {
    this.close();
  }

  private checkNotClosed(): void {
    if (this.closed) {
      throw new DatabaseError("Connection is closed");
    }
  }
}
