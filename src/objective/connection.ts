/**
 * Object-Oriented Connection class
 */

import type { ConnectionHandle, DuckDBLibrary, RowData } from "../types.ts";
import * as conn from "../functional/connection.ts";
import * as query from "../functional/query.ts";
import * as prep from "../functional/prepared.ts";
import type { Database } from "./database.ts";
import { QueryResult as QueryResultClass } from "./query.ts";
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
  query(sql: string): QueryResultClass {
    this.checkNotClosed();
    const result = query.execute(this.lib, this.handle!, sql);
    return new QueryResultClass(this.lib, result.handle, result, this);
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
    const result = prep.prepare(this.lib, this.handle!, sql);
    if (!result.success) {
      throw new Error(result.error ?? "Failed to prepare statement");
    }
    return new PreparedStatement(this.lib, result.handle, this);
  }

  /**
   * Close the connection
   */
  close(): void {
    if (this.closed || !this.handle) return;
    conn.closeConnection(this.lib, this.handle);
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
      throw new Error("Connection is closed");
    }
  }
}
