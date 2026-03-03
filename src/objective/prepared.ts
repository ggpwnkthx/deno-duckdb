/**
 * Object-Oriented PreparedStatement class
 */

import type { PreparedStatementHandle } from "../types.ts";
import type { BindValue } from "../functional/prepared.ts";
import * as prep from "../functional/prepared.ts";
import type { Connection } from "./connection.ts";
import { QueryResult } from "./query.ts";

/**
 * PreparedStatement class - represents a prepared SQL statement
 */
export class PreparedStatement {
  private handle: PreparedStatementHandle | null = null;
  private connection: Connection;

  /**
   * Create a new PreparedStatement instance (internal use)
   */
  constructor(
    handle: PreparedStatementHandle,
    connection: Connection,
  ) {
    this.handle = handle;
    this.connection = connection;
  }

  /**
   * Bind parameters to the prepared statement
   *
   * @param params - Array of values to bind (in order)
   * @throws Error if binding fails
   */
  async bind(params: BindValue[]): Promise<void> {
    this.checkNotClosed();
    await prep.bind(this.handle!, params);
  }

  /**
   * Execute the prepared statement
   *
   * @returns QueryResult instance
   */
  async execute(): Promise<QueryResult> {
    this.checkNotClosed();
    const handle = await prep.executePrepared(this.handle!);
    return new QueryResult(handle, handle, this.connection);
  }

  /**
   * Get the number of columns in the result
   */
  async columnCount(): Promise<bigint> {
    this.checkNotClosed();
    return await prep.preparedColumnCount(this.handle!);
  }

  /**
   * Get the number of parameters in the statement
   */
  async parameterCount(): Promise<bigint> {
    this.checkNotClosed();
    return await prep.preparedParameterCount(this.handle!);
  }

  /**
   * Close the prepared statement
   */
  async close(): Promise<void> {
    if (this.handle) {
      await prep.destroyPrepared(this.handle);
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
