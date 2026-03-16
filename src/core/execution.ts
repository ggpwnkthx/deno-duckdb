/**
 * Unified lazy execution and result handling.
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
} from "./handles.ts";
import { assertNonEmptyString } from "./validate.ts";

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

  get rowCount(): number {
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

export function executePreparedResult(
  statementHandle: PreparedStatementHandle,
): LazyResult {
  return LazyResult.fromRequest({
    kind: "prepared",
    statementHandle,
  });
}
