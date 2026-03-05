/**
 * Object-Oriented PreparedStatement class
 */

import type { PreparedStatementHandle } from "../types.ts";
import type { BindValue } from "../functional/prepared.ts";
import { DatabaseError } from "../errors.ts";
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
    const handle = this.getHandle();
    await prep.bind(handle, params);
  }

  /**
   * Execute the prepared statement
   *
   * @returns QueryResult instance
   */
  async execute(): Promise<QueryResult> {
    const handle = this.getHandle();
    const resultHandle = await prep.executePrepared(handle);
    return new QueryResult(resultHandle, resultHandle, this.connection);
  }

  /**
   * Get the number of columns in the result
   */
  async columnCount(): Promise<bigint> {
    const handle = this.getHandle();
    return await prep.preparedColumnCount(handle);
  }

  /**
   * Get the number of parameters in the statement
   */
  async parameterCount(): Promise<bigint> {
    const handle = this.getHandle();
    return await prep.preparedParameterCount(handle);
  }

  /**
   * Close the prepared statement (synchronous for use with Symbol.dispose)
   */
  close(): void {
    if (this.handle) {
      prep.destroyPreparedSync(this.handle);
      this.handle = null;
    }
  }

  /**
   * Auto-cleanup using Symbol.dispose
   */
  [Symbol.dispose](): void {
    this.close();
  }

  private getHandle(): PreparedStatementHandle {
    if (!this.handle) {
      throw new DatabaseError("Prepared statement is closed");
    }
    return this.handle;
  }
}
