/**
 * Object-oriented connection wrapper.
 *
 * Represents a connection to a DuckDB database. Provides methods to execute queries
 * and create prepared statements. Supports automatic cleanup via `Symbol.dispose`.
 *
 * @example
 * ```ts
 * using db = await Database.open(":memory:");
 * using conn = await db.connect();
 *
 * const result = conn.execute("SELECT * FROM range(10)");
 * for (const row of result.rows()) {
 *   console.log(row);
 * }
 * ```
 */

import type { ConnectionHandle, ObjectRow, RowData } from "../types.ts";
import {
  closeConnection,
  executeQueryResult,
  prepareStatement,
} from "../functional/native.ts";
import { applySessionConfig } from "../functional/session.ts";
import type { SessionConfig } from "../core/config/schema/mod.ts";
import { assertNonEmptyString } from "../core/validate.ts";
import { InvalidResourceError, ValidationError } from "../errors.ts";
import type { MaterializationLimits } from "../core/config/limits.ts";
import { DisposableResource } from "./base.ts";
import { PreparedStatement } from "./prepared.ts";
import { QueryResult } from "./query.ts";

type ConnectionClosedCallback = () => void;

export class Connection extends DisposableResource<ConnectionHandle> {
  #onClose: ConnectionClosedCallback;
  #preparedStatements = new Set<PreparedStatement>();
  #queryResults = new Set<QueryResult>();

  constructor(handle: ConnectionHandle, onClose: ConnectionClosedCallback) {
    super(handle);
    this.#onClose = onClose;
  }

  /**
   * Execute a query and return all rows as arrays.
   *
   * @param sql - SQL query string
   * @param limits - Optional materialization limits to prevent unbounded allocation
   * @returns Array of rows, or null if the query fails
   *
   * @example
   * ```ts
   * const rows = conn.query("SELECT * FROM users");
   * if (rows) {
   *   console.log(rows[0]);
   * }
   * ```
   */
  query(sql: string, limits?: MaterializationLimits): RowData[] | null {
    try {
      const result = this.execute(sql);
      try {
        return result.toArray(limits);
      } finally {
        result.close();
      }
    } catch (e) {
      // Re-throw validation and invalid resource errors - they indicate bad input
      if (e instanceof ValidationError || e instanceof InvalidResourceError) {
        throw e;
      }
      // Return null for other errors (like query execution failures)
      return null;
    }
  }

  /**
   * Execute a query and return all rows as objects.
   *
   * @param sql - SQL query string
   * @param limits - Optional materialization limits to prevent unbounded allocation
   * @returns Array of object rows, or null if the query fails
   *
   * @example
   * ```ts
   * const rows = conn.queryObjects("SELECT id, name FROM users");
   * if (rows) {
   *   console.log(rows[0].name);
   * }
   * ```
   */
  queryObjects(sql: string, limits?: MaterializationLimits): ObjectRow[] | null {
    try {
      const result = this.execute(sql);

      try {
        return result.toObjectArray(limits);
      } finally {
        result.close();
      }
    } catch (e) {
      // Re-throw validation and invalid resource errors - they indicate bad input
      if (e instanceof ValidationError || e instanceof InvalidResourceError) {
        throw e;
      }
      // Return null for other errors (like query execution failures)
      return null;
    }
  }

  /**
   * Execute a SQL query and return a result for iteration.
   *
   * @param sql - SQL query string
   * @returns QueryResult for iterating over rows
   * @throws {ValidationError} if the query is empty
   */
  execute(sql: string): QueryResult {
    assertNonEmptyString(sql, "SQL query");
    const result = new QueryResult(
      executeQueryResult(this.requireHandle("Connection"), sql),
      () => {
        this.#queryResults.delete(result);
      },
    );
    this.#queryResults.add(result);
    return result;
  }

  /**
   * Apply session/local DuckDB settings to this connection.
   *
   * Issues one `SET` statement per option. DuckDB's C API does not expose a
   * per-connection config setter, so `SET name = value` SQL is the supported
   * mechanism for runtime session changes.
   *
   * @param config - Session/local DuckDB settings to apply
   * @throws {ValidationError} if `config` contains unknown keys or invalid values
   * @throws {QueryError} if any of the underlying `SET` statements fails
   *
   * @example
   * ```ts
   * conn.setConfig({ search_path: ["main", "analytics"] });
   * conn.setConfig({ enable_progress_bar: false });
   * ```
   */
  setConfig(config: SessionConfig): void {
    applySessionConfig(this.requireHandle("Connection"), config);
  }

  /**
   * Prepare a SQL statement for parameterized execution.
   *
   * @param sql - SQL statement with parameter placeholders
   * @returns PreparedStatement instance
   * @throws {ValidationError} if the statement is empty
   */
  prepare(sql: string): PreparedStatement {
    assertNonEmptyString(sql, "SQL statement");
    const stmt = new PreparedStatement(
      prepareStatement(this.requireHandle("Connection"), sql),
      () => {
        this.#preparedStatements.delete(stmt);
      },
      (result) => {
        this.#queryResults.add(result);
        return () => this.#queryResults.delete(result);
      },
    );
    this.#preparedStatements.add(stmt);
    return stmt;
  }

  /** Close the connection. */
  close(): void {
    // Close all query results first
    for (const result of [...this.#queryResults]) {
      result.close();
    }
    this.#queryResults.clear();

    // Close all prepared statements
    for (const stmt of [...this.#preparedStatements]) {
      stmt.close();
    }
    this.#preparedStatements.clear();

    const handle = this.releaseHandle();
    if (!handle) {
      return;
    }

    closeConnection(handle);
    this.#onClose();
  }
}
