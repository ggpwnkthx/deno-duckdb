/**
 * Object-Oriented Connection class
 */

import type {
  ConnectionHandle,
  DuckDBLibrary,
  PreparedStatementHandle,
  RowData,
} from "../types.ts";
import * as conn from "../functional/connection.ts";
import * as query from "../functional/query.ts";
import * as prep from "../functional/prepared.ts";
import type { Database } from "./database.ts";
import { QueryResult as QueryResultClass } from "./query.ts";
import { PreparedStatement } from "./prepared.ts";

/** Cache for prepared statements - maps SQL string to handle */
const preparedStatementCache = new Map<string, PreparedStatementHandle>();

/** Maximum cached prepared statements */
const MAX_CACHED_STATEMENTS = 100;

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
   * Uses caching to avoid re-parsing the same SQL
   *
   * @param sql - SQL statement to prepare
   * @returns PreparedStatement instance
   */
  prepare(sql: string): PreparedStatement {
    this.checkNotClosed();

    // Check cache first
    const cached = preparedStatementCache.get(sql);
    if (cached) {
      return new PreparedStatement(this.lib, cached, this);
    }

    // Prepare new statement
    const result = prep.prepare(this.lib, this.handle!, sql);
    if (!result.success) {
      throw new Error(result.error ?? "Failed to prepare statement");
    }

    // Cache if under limit
    if (preparedStatementCache.size < MAX_CACHED_STATEMENTS) {
      preparedStatementCache.set(sql, result.handle);
    }

    return new PreparedStatement(this.lib, result.handle, this);
  }

  /**
   * Close the connection
   */
  close(): void {
    if (this.closed || !this.handle) return;

    // Clear prepared statement cache on connection close
    for (const cachedHandle of preparedStatementCache.values()) {
      prep.destroyPrepared(this.lib, cachedHandle);
    }
    preparedStatementCache.clear();

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
