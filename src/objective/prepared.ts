/**
 * Object-Oriented PreparedStatement class
 */

import type { DuckDBLibrary, PreparedStatementHandle } from "../types.ts";
import * as prep from "../functional/prepared.ts";
import type { Connection } from "./connection.ts";
import { QueryResult } from "./query.ts";

/**
 * PreparedStatement class - represents a prepared SQL statement
 */
export class PreparedStatement {
  private lib: DuckDBLibrary;
  private handle: PreparedStatementHandle | null = null;
  private connection: Connection;

  /**
   * Create a new PreparedStatement instance (internal use)
   */
  constructor(
    lib: DuckDBLibrary,
    handle: PreparedStatementHandle,
    connection: Connection,
  ) {
    this.lib = lib;
    this.handle = handle;
    this.connection = connection;
  }

  /**
   * Execute the prepared statement
   *
   * @returns QueryResult instance
   */
  execute(): QueryResult {
    this.checkNotClosed();
    const result = prep.executePrepared(this.lib, this.handle!);
    return new QueryResult(this.lib, result.handle, result, this.connection);
  }

  /**
   * Get the number of columns in the result
   */
  columnCount(): bigint {
    this.checkNotClosed();
    return prep.preparedColumnCount(this.lib, this.handle!);
  }

  /**
   * Close the prepared statement
   */
  close(): void {
    if (this.handle) {
      prep.destroyPrepared(this.lib, this.handle);
      this.handle = null;
    }
  }

  /**
   * Auto-cleanup using Symbol.dispose
   */
  [Symbol.dispose](): void {
    this.close();
  }

  private checkNotClosed(): void {
    if (!this.handle) {
      throw new Error("Prepared statement is closed");
    }
  }
}
