/**
 * Object-oriented prepared statement wrapper.
 */

import type { PreparedStatementHandle } from "../types.ts";
import type { BindValue } from "../functional/prepared.ts";
import {
  bindPreparedParameters,
  destroyPreparedStatementSync,
  executePreparedStatement,
  preparedColumnCount,
  resetPreparedStatement,
} from "../core/native.ts";
import { DisposableResource } from "./base.ts";
import { QueryResult } from "./query.ts";

export class PreparedStatement
  extends DisposableResource<PreparedStatementHandle> {
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
    const resultHandle = executePreparedStatement(
      this.requireHandle("PreparedStatement"),
    );
    return new QueryResult(resultHandle);
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
}
