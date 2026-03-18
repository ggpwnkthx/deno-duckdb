/**
 * Object-oriented query result wrapper.
 *
 * Represents the result of a SQL query. Provides methods to iterate over rows
 * as arrays or objects, access individual rows, and get metadata about the result.
 * Supports automatic cleanup via `Symbol.dispose`.
 *
 * @example
 * ```ts
 * using db = await Database.open({ path: ":memory:" });
 * using conn = await db.connect();
 *
 * const result = conn.execute("SELECT * FROM range(10) t(i)");
 * for (const row of result.rows()) {
 *   console.log(row);
 * }
 * console.log(`Found ${result.rowCount()} rows`);
 * ```
 *
 * @example
 * ```ts
 * // Get object rows
 * const result = conn.execute("SELECT 'Alice' as name, 30 as age");
 * for (const obj of result.objects()) {
 *   console.log(obj.name, obj.age);
 * }
 * ```
 */

import type { ColumnInfo, ObjectRow, ResultHandle, RowData } from "../types.ts";
import {
  createResultReader,
  destroyResult,
  type ResultReader,
} from "../functional/mod.ts";
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

  /**
   * Get the number of rows in the result.
   *
   * @returns Number of rows
   */
  rowCount(): bigint {
    return this.#getReader().rowCount;
  }

  /**
   * Get the number of columns in the result.
   *
   * @returns Number of columns
   */
  columnCount(): bigint {
    return BigInt(this.#getReader().columnCount);
  }

  /**
   * Get metadata about all columns in the result.
   *
   * @returns Array of column information
   */
  get columnInfos(): ColumnInfo[] {
    return [...this.#getReader().columns];
  }

  /**
   * Get a single row by index as an array.
   *
   * @param index - Row index (0-based)
   * @returns Row data as array
   */
  row(index: number): RowData {
    return this.#getReader().getRow(index);
  }

  /**
   * Iterate over rows as arrays.
   *
   * @yields Row data arrays
   */
  *rows(): IterableIterator<RowData> {
    yield* this.#getReader().rows();
  }

  /**
   * Iterate over rows as objects.
   *
   * @yields Row data objects with column names as keys
   */
  *objects(): IterableIterator<ObjectRow> {
    yield* this.#getReader().objects();
  }

  /** Close the result and release resources. */
  close(): void {
    const handle = this.releaseHandle();
    if (handle) {
      destroyResult(handle);
    }

    this.#reader = null;
  }
}
