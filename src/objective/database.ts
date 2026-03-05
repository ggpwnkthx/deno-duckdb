/**
 * Object-Oriented Database class
 */

import type { DatabaseConfig, DatabaseHandle } from "../types.ts";
import { isValidHandle } from "../helpers.ts";
import { DatabaseError } from "../errors.ts";
import { Connection } from "./connection.ts";
import { getLibrary } from "../lib.ts";

/**
 * Database class - represents a DuckDB database
 */
export class Database {
  private lib: Awaited<ReturnType<typeof getLibrary>> | null = null;
  private handle: DatabaseHandle | null = null;
  private closed = false;
  private connections: Connection[] = [];
  private _config?: DatabaseConfig;

  /**
   * Create a new Database instance
   *
   * @param config - Database configuration
   */
  constructor(config?: DatabaseConfig) {
    this._config = config;
  }

  /**
   * Internal: Ensure library is loaded
   */
  private async ensureLib(): Promise<NonNullable<typeof this.lib>> {
    if (!this.lib) {
      this.lib = await getLibrary();
    }
    return this.lib;
  }

  /**
   * Internal: Open the database (called lazily)
   */
  async open(): Promise<void> {
    this.lib = await this.ensureLib();
    const { open } = await import("../functional/database.ts");
    this.handle = await open(this._config);
  }

  /**
   * Create a connection to the database
   *
   * @returns Connection instance
   * @throws Error if connection fails
   */
  async connect(): Promise<Connection> {
    if (!this.lib) {
      await this.open();
    }
    this.checkNotClosed();
    if (!this.handle) {
      throw new DatabaseError("Database is closed");
    }
    const { create, isValidConnection } = await import(
      "../functional/connection.ts"
    );
    const handle = await create(this.handle);

    // Validate handle before adding to connections array to prevent memory leaks
    if (!isValidConnection(handle)) {
      throw new DatabaseError("Failed to create valid connection handle");
    }

    const connection = new Connection(this.lib!, handle, this);
    this.connections.push(connection);
    return connection;
  }

  /**
   * Close the database (synchronous for use with Symbol.dispose)
   */
  close(): void {
    if (this.closed || !this.handle) return;
    // Close all child connections synchronously
    for (const connection of this.connections) {
      connection.close();
    }
    this.connections = [];
    // Call FFI directly - synchronous since library is already loaded
    if (this.lib && isValidHandle(this.handle)) {
      this.lib.symbols.duckdb_close(this.handle);
    }
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
      throw new DatabaseError("Database is closed");
    }
  }
}
