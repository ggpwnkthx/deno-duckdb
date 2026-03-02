/**
 * Object-Oriented Database class
 */

import type {
  DatabaseConfig,
  DatabaseHandle,
  DuckDBLibrary,
} from "../types.ts";
import * as db from "../functional/database.ts";
import * as conn from "../functional/connection.ts";
import { Connection } from "./connection.ts";

/**
 * Database class - represents a DuckDB database
 */
export class Database {
  private lib: DuckDBLibrary;
  private handle: DatabaseHandle | null = null;
  private closed = false;
  private connections: Connection[] = [];

  /**
   * Create a new Database instance
   *
   * @param lib - The loaded DuckDB library
   * @param config - Database configuration
   */
  constructor(lib: DuckDBLibrary, config?: DatabaseConfig) {
    this.lib = lib;
    const result = db.open(lib, config);
    if (!result.success) {
      throw new Error(result.error ?? "Failed to open database");
    }
    this.handle = result.handle;
  }

  /**
   * Create a connection to the database
   *
   * @returns Connection instance
   * @throws Error if connection fails
   */
  connect(): Connection {
    this.checkNotClosed();
    if (!this.handle) {
      throw new Error("Database is closed");
    }
    const result = conn.create(this.lib, this.handle);
    if (!result.success) {
      throw new Error(result.error ?? "Failed to connect");
    }
    const connection = new Connection(this.lib, result.handle, this);
    this.connections.push(connection);
    return connection;
  }

  /**
   * Close the database
   */
  close(): void {
    if (this.closed || !this.handle) return;
    // Close all child connections
    for (const connection of this.connections) {
      connection.close();
    }
    this.connections = [];
    db.closeDatabase(this.lib, this.handle);
    this.handle = null;
    this.closed = true;
  }

  /**
   * Auto-cleanup using Symbol.dispose
   */
  [Symbol.dispose](): void {
    this.close();
  }

  /**
   * Check if database is closed
   */
  isClosed(): boolean {
    return this.closed;
  }

  /**
   * Internal: Connection calls this when closed
   */
  _onConnectionClose(connection: Connection): void {
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }

  private checkNotClosed(): void {
    if (this.closed) {
      throw new Error("Database is closed");
    }
  }
}
