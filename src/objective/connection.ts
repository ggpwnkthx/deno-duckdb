/**
 * Object-Oriented Connection class
 */

import type { ConnectionHandle, RowData } from "../types.ts";
import type { DuckDBLibrary } from "../lib.ts";
import { DatabaseError } from "../errors.ts";
import { isValidHandle } from "../helpers.ts";
import * as functional from "@ggpwnkthx/duckdb/functional";
import type { Database } from "./database.ts";
import { QueryResult } from "./query.ts";
import { PreparedStatement } from "./prepared.ts";

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
  query(sql: string): QueryResult {
    this.checkNotClosed();
    if (!sql || !sql.trim()) {
      throw new DatabaseError("SQL query cannot be empty");
    }
    const handle = functional.query(this.handle!, sql);
    return new QueryResult(handle);
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
   */
  queryTyped<T>(
    sql: string,
    mapper?: (row: RowData, columns: string[]) => T,
  ): T[] {
    this.checkNotClosed();
    if (!sql || !sql.trim()) {
      throw new DatabaseError("SQL query cannot be empty");
    }
    const handle = functional.query(this.handle!, sql);

    try {
      const rows = functional.fetchAll(handle);
      const columns = functional.columnInfos(handle).map((c) => c.name);

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
      functional.destroyResult(handle);
    }
  }

  /**
   * Execute a query and fetch all rows
   *
   * @param sql - SQL query string
   * @returns Array of rows
   */
  queryAll(sql: string): RowData[] {
    const result = this.query(sql);
    return result.fetchAll();
  }

  /**
   * Prepare a statement
   *
   * @param sql - SQL statement to prepare
   * @returns PreparedStatement instance
   */
  prepare(sql: string): PreparedStatement {
    this.checkNotClosed();
    if (!sql || !sql.trim()) {
      throw new DatabaseError("SQL statement cannot be empty");
    }
    const handle = functional.prepare(this.handle!, sql);
    return new PreparedStatement(handle);
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
