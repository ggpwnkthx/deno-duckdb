/**
 * Object-oriented prepared statement wrapper.
 *
 * Represents a prepared SQL statement with bound parameters. Provides methods
 * to bind parameters, execute the statement, and manage the statement lifecycle.
 * Supports automatic cleanup via `Symbol.dispose`.
 *
 * @example
 * ```ts
 * using db = await Database.open(":memory:");
 * using conn = await db.connect();
 *
 * const stmt = conn.prepare("SELECT * FROM range($1) t(i) WHERE i > $2");
 * stmt.bind([10, 5]);
 *
 * for (const row of stmt.execute().rows()) {
 *   console.log(row);
 * }
 * ```
 */

import {
  bindPreparedParameters,
  type BindValue,
  destroyPreparedStatement,
  executePreparedStatement,
  preparedColumnCount,
  resetPreparedStatement,
} from "../functional/mod.ts";
import type { PreparedStatementHandle } from "../types.ts";
import { DisposableResource } from "./base.ts";
import { QueryResult } from "./query.ts";

export class PreparedStatement extends DisposableResource<PreparedStatementHandle> {
  #onClose?: () => void;

  constructor(handle: PreparedStatementHandle, onClose?: () => void) {
    super(handle);
    this.#onClose = onClose;
  }

  /**
   * Bind parameters to the prepared statement.
   *
   * @param params - Array of values to bind
   * @returns this for chaining
   */
  bind(params: readonly BindValue[]): this {
    bindPreparedParameters(this.requireHandle("PreparedStatement"), params);
    return this;
  }

  /**
   * Reset the prepared statement, clearing all bound parameters.
   *
   * @returns this for chaining
   */
  reset(): this {
    resetPreparedStatement(this.requireHandle("PreparedStatement"));
    return this;
  }

  /**
   * Execute the prepared statement and return a result.
   *
   * @returns QueryResult for iterating over rows
   */
  execute(): QueryResult {
    return new QueryResult(
      executePreparedStatement(this.requireHandle("PreparedStatement")),
    );
  }

  /**
   * Get the number of columns in the result set.
   *
   * @returns Number of columns
   */
  columnCount(): bigint {
    return preparedColumnCount(this.requireHandle("PreparedStatement"));
  }

  /** Close the prepared statement and release resources. */
  close(): void {
    const handle = this.releaseHandle();
    if (!handle) {
      return;
    }

    destroyPreparedStatement(handle);
    this.#onClose?.();
  }
}
