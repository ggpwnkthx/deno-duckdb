/**
 * Object-oriented query result wrapper.
 */

import type { ColumnInfo, ObjectRow, ResultHandle, RowData } from "../types.ts";
import {
  createResultReader,
  destroyResult,
  type ResultReader,
} from "@ggpwnkthx/duckdb/functional";
import { DisposableResource } from "./base.ts";

export class QueryResult extends DisposableResource<ResultHandle> {
  #reader: ResultReader | null = null;

  constructor(handle: ResultHandle) {
    super(handle);
  }

  #getReader(): ResultReader {
    const handle = this.requireHandle("QueryResult");
    if (!this.#reader) {
      this.#reader = createResultReader(handle);
    }

    return this.#reader;
  }

  rowCount(): bigint {
    return BigInt(this.#getReader().rowCount);
  }

  columnCount(): bigint {
    return BigInt(this.#getReader().columnCount);
  }

  getColumnInfos(): ColumnInfo[] {
    return [...this.#getReader().columns];
  }

  getRow(index: number): RowData {
    return this.#getReader().getRow(index);
  }

  *rows(): IterableIterator<RowData> {
    yield* this.#getReader().rows();
  }

  *objects(): IterableIterator<ObjectRow> {
    yield* this.#getReader().objects();
  }

  close(): void {
    const handle = this.releaseHandle();
    if (handle) {
      destroyResult(handle);
    }

    this.#reader = null;
  }
}
