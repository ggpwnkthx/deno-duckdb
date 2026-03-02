/**
 * Object-Oriented QueryResult class
 */

import type {
  ColumnInfo,
  DuckDBLibrary,
  QueryResult as QueryResultData,
  ResultHandle,
  RowData,
} from "../types.ts";
import * as query from "../functional/query.ts";
import * as value from "../functional/value.ts";
import type { Connection } from "./connection.ts";

/**
 * QueryResult class - represents query results
 */
export class QueryResult {
  private lib: DuckDBLibrary;
  private handle: ResultHandle | null = null;
  private resultData: QueryResultData | null = null;
  private connection: Connection;

  /**
   * Create a new QueryResult instance (internal use)
   */
  constructor(
    lib: DuckDBLibrary,
    handle: ResultHandle,
    result: QueryResultData,
    connection: Connection,
  ) {
    this.lib = lib;
    this.handle = handle;
    this.resultData = result;
    this.connection = connection;
  }

  /**
   * Fetch all rows from the result
   *
   * @returns Array of rows
   */
  fetchAll(): RowData[] {
    this.checkNotFreed();
    if (!this.handle) {
      throw new Error("Result has been freed");
    }
    return value.fetchAll(this.lib, this.handle);
  }

  /**
   * Get a single row by index
   *
   * @param index - Row index (0-based)
   * @returns Row data
   */
  getRow(index: number): RowData {
    this.checkNotFreed();
    if (!this.handle) {
      throw new Error("Result has been freed");
    }
    const rowCount = query.rowCount(this.lib, this.handle);
    if (index < 0 || index >= Number(rowCount)) {
      throw new Error("Row index out of bounds");
    }
    const colCount = query.columnCount(this.lib, this.handle);
    const row: RowData = [];
    for (let c = 0; c < Number(colCount); c++) {
      const type = query.columnType(this.lib, this.handle, c);
      const val = value.getValueByType(this.lib, this.handle, index, c, type);
      row.push(val);
    }
    return row;
  }

  /**
   * Convert result to array of objects
   *
   * @returns Array of objects with column names as keys
   */
  toArrayOfObjects(): Record<string, unknown>[] {
    const rows = this.fetchAll();
    const cols = this.getColumnInfos();
    return rows.map((row) => {
      const obj: Record<string, unknown> = {};
      cols.forEach((col, i) => {
        obj[col.name] = row[i];
      });
      return obj;
    });
  }

  /**
   * Get number of rows
   */
  rowCount(): bigint {
    this.checkNotFreed();
    if (!this.handle) return 0n;
    return query.rowCount(this.lib, this.handle);
  }

  /**
   * Get number of columns
   */
  columnCount(): bigint {
    this.checkNotFreed();
    if (!this.handle) return 0n;
    return query.columnCount(this.lib, this.handle);
  }

  /**
   * Get column information
   */
  getColumnInfos(): ColumnInfo[] {
    this.checkNotFreed();
    if (!this.handle) return [];
    return query.columnInfos(this.lib, this.handle);
  }

  /**
   * Check if query was successful
   */
  isSuccess(): boolean {
    return this.resultData?.success ?? false;
  }

  /**
   * Get error message if query failed
   */
  getError(): string | undefined {
    return this.resultData?.error;
  }

  /**
   * Close the result
   */
  close(): void {
    if (this.handle) {
      query.destroyResult(this.lib, this.handle);
      this.handle = null;
    }
  }

  /**
   * @deprecated Use close() instead
   */
  free(): void {
    this.close();
  }

  /**
   * Auto-cleanup using Symbol.dispose
   */
  [Symbol.dispose](): void {
    this.close();
  }

  private checkNotFreed(): void {
    if (!this.handle) {
      throw new Error("Result has been freed");
    }
  }
}
