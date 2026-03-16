/**
 * Object-oriented prepared statement wrapper.
 */

import type { PreparedStatementHandle, RowData } from "../types.ts";
import type { BindValue } from "../core/native.ts";
import {
  bindPreparedParameters,
  destroyPreparedStatementSync,
  executePreparedStatement,
  preparedColumnCount,
  resetPreparedStatement,
} from "../core/native.ts";
import { DisposableResource } from "./base.ts";
import { QueryResult } from "./query.ts";

export class PreparedStatement extends DisposableResource<PreparedStatementHandle> {
  constructor(handle: PreparedStatementHandle) {
    super(handle);
  }

  bind(params: readonly BindValue[]): this {
    bindPreparedParameters(this.requireHandle("PreparedStatement"), params);
    return this;
  }

  reset(): this {
    resetPreparedStatement(this.requireHandle("PreparedStatement"));
    return this;
  }

  execute(): QueryResult {
    return new QueryResult(
      executePreparedStatement(this.requireHandle("PreparedStatement")),
    );
  }

  columnCount(): bigint {
    return preparedColumnCount(this.requireHandle("PreparedStatement"));
  }

  close(): void {
    const handle = this.releaseHandle();
    if (!handle) {
      return;
    }

    destroyPreparedStatementSync(handle);
  }

  executeAndFetch(): RowData[] {
    const result = this.execute();
    try {
      return result.fetchAll();
    } finally {
      result.close();
    }
  }

  executeAndFetchAll(): RowData[] {
    return this.executeAndFetch();
  }
}
