/**
 * Object-oriented connection wrapper.
 */

import type { ConnectionHandle, ObjectRow, RowData } from "../types.ts";
import {
  closeConnection,
  executeQuery,
  prepareStatement,
} from "../functional/native.ts";
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

  /**
   * Execute query and return rows directly.
   * Returns null if the query fails.
   */
  query(sql: string): RowData[] | null {
    try {
      const result = this.execute(sql);
      try {
        return [...result.rows()];
      } finally {
        result.close();
      }
    } catch {
      return null;
    }
  }

  /**
   * Execute query and return object rows directly.
   * Returns null if the query fails.
   */
  queryObjects(sql: string): ObjectRow[] | null {
    try {
      const result = this.execute(sql);

      try {
        return [...result.objects()];
      } finally {
        result.close();
      }
    } catch {
      return null;
    }
  }

  execute(sql: string): QueryResult {
    assertNonEmptyString(sql, "SQL query");
    return new QueryResult(executeQuery(this.requireHandle("Connection"), sql));
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
