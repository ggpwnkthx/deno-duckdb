/**
 * Object-oriented database wrapper.
 *
 * Represents a DuckDB database instance. Provides methods to open connections
 * and manage the database lifecycle. Supports automatic cleanup via `Symbol.dispose`.
 *
 * @example
 * ```ts
 * // Using async factory
 * using db = await Database.open(":memory:");
 * using conn = await db.connect();
 * const result = conn.execute("SELECT 1 as value");
 * console.log([...result.rows()]);
 * ```
 *
 * @example
 * ```ts
 * // Using constructor + open()
 * const db = new Database("mydb.db");
 * await db.open();
 * try {
 *   const conn = await db.connect();
 *   // ...
 * } finally {
 *   db.close();
 * }
 * ```
 */

import type { DatabaseHandle } from "../types.ts";
import { DatabaseError } from "../errors.ts";
import {
  closeDatabase,
  connectToDatabase,
  isValidConnectionHandle,
  openDatabase,
} from "../functional/mod.ts";
import { Connection } from "./connection.ts";
import type { DatabaseConfig } from "../core/config/schema/mod.ts";

export class Database {
  #path?: string;
  #config?: DatabaseConfig;
  #handle: DatabaseHandle | null = null;
  #closed = false;
  #connections = new Set<Connection>();

  constructor(path?: string, config?: DatabaseConfig) {
    this.#path = path;
    this.#config = config;
  }

  /**
   * Create and open a new database instance.
   *
   * @param path - Optional database path (default: ":memory:" for in-memory database)
   * @param config - Optional database configuration
   * @returns A new open Database instance
   */
  static async open(path?: string, config?: DatabaseConfig): Promise<Database> {
    const database = new Database(path, config);
    await database.open();
    return database;
  }

  /**
   * Open the database (if not already open).
   *
   * @throws {DatabaseError} if the database is already closed
   */
  async open(): Promise<void> {
    if (this.#closed) {
      throw new DatabaseError("Database is closed");
    }

    if (!this.#handle) {
      this.#handle = await openDatabase(this.#path, this.#config);
    }
  }

  /**
   * Create a new connection to this database.
   *
   * @returns A new Connection instance
   * @throws {DatabaseError} if the database is closed
   */
  async connect(): Promise<Connection> {
    if (this.#closed) {
      throw new DatabaseError("Database is closed");
    }

    await this.open();

    if (!this.#handle) {
      throw new DatabaseError("Database handle is unavailable");
    }

    const handle = await connectToDatabase(this.#handle);
    if (!isValidConnectionHandle(handle)) {
      throw new DatabaseError("DuckDB returned an invalid connection handle");
    }

    const connection = new Connection(handle, () => {
      this.#connections.delete(connection);
    });

    this.#connections.add(connection);
    return connection;
  }

  /**
   * Whether the database has been closed.
   *
   * @returns true if closed, false otherwise
   */
  get closed(): boolean {
    return this.#closed;
  }

  /**
   * Close the database and all open connections.
   */
  close(): void {
    if (this.#closed) {
      return;
    }

    for (const connection of [...this.#connections]) {
      connection.close();
    }

    this.#connections.clear();

    if (this.#handle) {
      closeDatabase(this.#handle);
    }

    this.#handle = null;
    this.#closed = true;
  }

  [Symbol.dispose](): void {
    this.close();
  }
}
