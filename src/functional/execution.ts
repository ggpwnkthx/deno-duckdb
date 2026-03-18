/**
 * Unified lazy execution and result handling.
 *
 * Implements LazyResult for deferred query execution and iteration.
 * Supports both raw SQL queries and prepared statement execution.
 */

import type {
  ColumnInfo,
  ConnectionHandle,
  ObjectRow,
  PreparedStatementHandle,
  ResultHandle,
  RowData,
} from "../types.ts";
import { InvalidResourceError } from "../errors.ts";
import { destroyResult, executePreparedStatement, executeQuery } from "./native.ts";
import { createResultReader, type ResultReader } from "./result.ts";
import {
  validateConnectionHandle,
  validatePreparedStatementHandle,
} from "../core/handles.ts";
import { assertNonEmptyString } from "../core/validate.ts";

/**
 * Request types for executing queries against DuckDB.
 *
 * A discriminated union representing either:
 * - A raw SQL query execution request
 * - A prepared statement execution request
 */
export type ExecutionRequest =
  | {
    kind: "sql";
    connectionHandle: ConnectionHandle;
    sql: string;
  }
  | {
    kind: "prepared";
    statementHandle: PreparedStatementHandle;
  };

/**
 * Execute a request and return a result handle.
 *
 * @internal
 * @param request - Execution request (SQL or prepared)
 * @returns Result handle from query execution
 */
function executeRequest(request: ExecutionRequest): ResultHandle {
  if (request.kind === "sql") {
    validateConnectionHandle(request.connectionHandle);
    return executeQuery(
      request.connectionHandle,
      assertNonEmptyString(request.sql, "SQL query"),
    );
  }

  validatePreparedStatementHandle(request.statementHandle);
  return executePreparedStatement(request.statementHandle);
}

/**
 * A lazy result that defers decoding until iteration.
 *
 * Provides methods for lazy iteration over query results, decoding rows on-demand
 * from an in-memory result buffer. Note that DuckDB materializes the full result
 * in memory when the query executes; this class only lazy-decodes individual rows
 * rather than materializing all row data upfront.
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT * FROM users");
 * for (const row of result.rows()) {
 *   console.log(row);
 * }
 * result.close();
 * ```
 */
export class LazyResult {
  #handle: ResultHandle | null;
  #reader: ResultReader | null = null;

  constructor(handle: ResultHandle) {
    this.#handle = handle;
  }

  static fromRequest(request: ExecutionRequest): LazyResult {
    return new LazyResult(executeRequest(request));
  }

  #requireHandle(): ResultHandle {
    if (!this.#handle) {
      throw new InvalidResourceError("QueryResult is closed");
    }

    return this.#handle;
  }

  reader(): ResultReader {
    const handle = this.#requireHandle();
    if (!this.#reader) {
      this.#reader = createResultReader(handle);
    }

    return this.#reader;
  }

  get rowCount(): bigint {
    return this.reader().rowCount;
  }

  get columnCount(): number {
    return this.reader().columnCount;
  }

  get columns(): readonly ColumnInfo[] {
    return this.reader().columns;
  }

  isClosed(): boolean {
    return this.#handle === null;
  }

  getRow(index: number): RowData {
    return this.reader().getRow(index);
  }

  getObjectRow(index: number): ObjectRow {
    return this.reader().getObjectRow(index);
  }

  *rows(): IterableIterator<RowData> {
    yield* this.reader().rows();
  }

  *objects(): IterableIterator<ObjectRow> {
    yield* this.reader().objects();
  }

  [Symbol.iterator](): IterableIterator<RowData> {
    return this.rows();
  }

  toArray(): RowData[] {
    return Array.from(this.rows());
  }

  toObjectArray(): ObjectRow[] {
    return Array.from(this.objects());
  }

  close(): void {
    const handle = this.#handle;
    if (!handle) {
      return;
    }

    this.#handle = null;
    this.#reader = null;
    destroyResult(handle);
  }

  [Symbol.dispose](): void {
    this.close();
  }
}

/**
 * Execute a SQL query and return a lazy result for iteration.
 *
 * @param connectionHandle - An open connection handle
 * @param sql - SQL query string
 * @returns A LazyResult for lazy iteration over rows
 * @throws {QueryError} if the query fails
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT * FROM users");
 * for (const row of result.rows()) {
 *   console.log(row);
 * }
 * result.close();
 * ```
 */
export function executeSqlResult(
  connectionHandle: ConnectionHandle,
  sql: string,
): LazyResult {
  return LazyResult.fromRequest({
    kind: "sql",
    connectionHandle,
    sql,
  });
}

/**
 * Execute a prepared statement and return a lazy result.
 *
 * @param statementHandle - A prepared statement handle
 * @returns A LazyResult for lazy iteration over rows
 * @throws {DatabaseError} if execution fails
 */
export function executePreparedResult(
  statementHandle: PreparedStatementHandle,
): LazyResult {
  return LazyResult.fromRequest({
    kind: "prepared",
    statementHandle,
  });
}
