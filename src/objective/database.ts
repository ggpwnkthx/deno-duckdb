/**
 * Object-oriented database wrapper.
 */

import type { DatabaseConfig, DatabaseHandle } from "../types.ts";
import { DatabaseError } from "../errors.ts";
import {
  closeDatabase,
  connectToDatabase,
  isValidConnectionHandle,
  openDatabase,
} from "../core/native.ts";
import { Connection } from "./connection.ts";

export class Database {
  #config?: DatabaseConfig;
  #handle: DatabaseHandle | null = null;
  #closed = false;
  #connections = new Set<Connection>();

  constructor(config?: DatabaseConfig) {
    this.#config = config;
  }

  static async open(config?: DatabaseConfig): Promise<Database> {
    const database = new Database(config);
    await database.open();
    return database;
  }

  async open(): Promise<void> {
    if (this.#closed) {
      throw new DatabaseError("Database is closed");
    }

    if (!this.#handle) {
      this.#handle = await openDatabase(this.#config);
    }
  }

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

  isClosed(): boolean {
    return this.#closed;
  }

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
