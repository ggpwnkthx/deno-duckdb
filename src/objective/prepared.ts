/**
 * Object-oriented prepared statement wrapper.
 */

import {
  bindPreparedParameters,
  type BindValue,
  destroyPreparedStatement,
  executePreparedStatement,
  preparedColumnCount,
  resetPreparedStatement,
} from "@ggpwnkthx/duckdb/functional";
import type { PreparedStatementHandle } from "../types.ts";
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

    destroyPreparedStatement(handle);
  }
}
