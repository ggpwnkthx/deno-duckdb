/**
 * Object-oriented connection wrapper.
 */

import type { ConnectionHandle, ObjectRow, RowData } from "../types.ts";
import {
  closeConnection,
  executeQuery,
  prepareStatement,
} from "../core/native.ts";
import { assertNonEmptyString } from "../core/validate.ts";
import { DisposableResource } from "./base.ts";
import { PreparedStatement } from "./prepared.ts";
import { QueryResult } from "./query.ts";

type ConnectionClosedCallback = () => void;

export class Connection extends DisposableResource<ConnectionHandle> {
  #onClose: ConnectionClosedCallback;

  constructor(handle: ConnectionHandle, onClose: ConnectionClosedCallback) {
    super(handle);
    this.#onClose = onClose;
  }

  query(sql: string): QueryResult {
    assertNonEmptyString(sql, "SQL query");
    return new QueryResult(executeQuery(this.requireHandle("Connection"), sql));
  }

  queryAll(sql: string): RowData[] {
    const result = this.query(sql);

    try {
      return result.fetchAll();
    } finally {
      result.close();
    }
  }

  queryObjects(sql: string): ObjectRow[] {
    const result = this.query(sql);

    try {
      return result.toArrayOfObjects();
    } finally {
      result.close();
    }
  }

  queryTyped(sql: string): ObjectRow[];
  queryTyped<T>(sql: string, mapper: (row: ObjectRow) => T): T[];
  queryTyped<T>(
    sql: string,
    mapper?: (row: ObjectRow) => T,
  ): ObjectRow[] | T[] {
    const rows = this.queryObjects(sql);
    return mapper ? rows.map(mapper) : rows;
  }

  prepare(sql: string): PreparedStatement {
    assertNonEmptyString(sql, "SQL statement");
    return new PreparedStatement(
      prepareStatement(this.requireHandle("Connection"), sql),
    );
  }

  close(): void {
    const handle = this.releaseHandle();
    if (!handle) {
      return;
    }

    closeConnection(handle);
    this.#onClose();
  }
}
