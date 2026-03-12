/**
 * Object-Oriented QueryResult class
 */

import type { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type { ColumnInfo, ResultHandle, RowData } from "../types.ts";
import type { LazyRowData } from "../functional/value.ts";
import * as functional from "@ggpwnkthx/duckdb/functional";
import { getLibraryFast } from "../lib.ts";
import { InvalidResourceError } from "../errors.ts";
import {
  createPointerView,
  getArrayLikeLength,
  validateResultHandle,
} from "../helpers.ts";

/** Cached column data for getRow optimization */
interface ColumnCache {
  types: DUCKDB_TYPE[];
  dataViews: (Deno.UnsafePointerView | null)[];
  nullMaskViews: (Deno.UnsafePointerView | null)[];
}

/** Maximum number of rows to cache. Large results won't be cached. */
const MAX_CACHED_ROWS = 10000;

/**
 * QueryResult class - represents query results
 */
export class QueryResult {
  private handle: ResultHandle | null = null;
  private columnCache: ColumnCache | null = null;
  private cachedRowCount = 0n;
  private cachedColCount = 0n;
  private cachedRows: RowData[] | null = null;
  private cachedColumnInfos: ColumnInfo[] | null = null;

  /**
   * Create a new QueryResult instance (internal use)
   */
  constructor(
    handle: ResultHandle,
  ) {
    this.handle = handle;
  }

  /**
   * Fetch all rows from the result
   * For small results (below size limit), results are cached.
   * For large results, returns lazy array that materializes on access.
   *
   * @returns Array of rows (or lazy array for large results)
   */
  fetchAll(): RowData[] | LazyRowData {
    const handle = this.checkNotFreed();

    // Return cached rows if available
    if (this.cachedRows) {
      return this.cachedRows;
    }

    // Fetch rows (lazy array)
    const rows: LazyRowData = functional.fetchAll(handle);

    // Only cache if below size limit - for large results, keep lazy
    if (rows.length <= MAX_CACHED_ROWS) {
      // Materialize small results for caching
      const materialized: RowData[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row: RowData = [];
        // Access values to materialize them
        const rowLength = getArrayLikeLength(rows[i]);
        for (let c = 0; c < rowLength; c++) {
          row.push(rows[i][c]);
        }
        materialized.push(row);
      }
      this.cachedRows = materialized;
      // Cache row/col counts from actual query result
      this.cachedRowCount = functional.rowCount(handle);
      this.cachedColCount = functional.columnCount(handle);
      return this.cachedRows;
    }

    // For large results, don't cache - compute counts from actual result
    this.cachedRowCount = functional.rowCount(handle);
    this.cachedColCount = functional.columnCount(handle);

    // Return lazy array for large results
    return rows;
  }

  /**
   * Get a single row by index
   *
   * Uses cached rows if available, otherwise fetches directly with cached metadata.
   *
   * @param index - Row index (0-based)
   * @returns Row data
   */
  getRow(index: number): RowData {
    const handle = this.checkNotFreed();

    // Use cached rows if available
    if (this.cachedRows) {
      if (index < 0 || index >= this.cachedRows.length) {
        throw new InvalidResourceError("Row index out of bounds");
      }
      return this.cachedRows[index];
    }

    // Cache row/col count on first call
    if (this.cachedRowCount === 0n) {
      this.cachedRowCount = functional.rowCount(handle);
      this.cachedColCount = functional.columnCount(handle);
    }

    if (index < 0 || index >= Number(this.cachedRowCount)) {
      throw new InvalidResourceError("Row index out of bounds");
    }

    // Build column cache on first call
    if (!this.columnCache) {
      this.columnCache = this.buildColumnCache();
    }

    const colCount = Number(this.cachedColCount);
    const row: RowData = [];

    for (let c = 0; c < colCount; c++) {
      const type = this.columnCache!.types[c];
      const dataView = this.columnCache!.dataViews[c];
      const nullMaskView = this.columnCache!.nullMaskViews[c];
      const val = functional.getValueByTypeOptimized(
        index,
        type,
        dataView,
        nullMaskView,
      );
      row.push(val);
    }
    return row;
  }

  /** Build column cache for getRow optimization */
  private buildColumnCache(): ColumnCache {
    const handle = this.checkNotFreed();
    const colCount = Number(this.cachedColCount);
    const lib = getLibraryFast();
    const types: DUCKDB_TYPE[] = [];
    const dataViews: (Deno.UnsafePointerView | null)[] = [];
    const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

    for (let c = 0; c < colCount; c++) {
      types[c] = functional.columnType(handle, c);

      const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(c));
      dataViews[c] = dataPtr ? createPointerView(dataPtr) : null;

      const nullMaskPtr = lib.symbols.duckdb_nullmask_data(handle, BigInt(c));
      nullMaskViews[c] = nullMaskPtr ? createPointerView(nullMaskPtr) : null;
    }

    return { types, dataViews, nullMaskViews };
  }

  /**
   * Convert result to array of objects
   *
   * @returns Array of objects with column names as keys
   */
  toArrayOfObjects(): Record<string, unknown>[] {
    const rows = this.cachedRows ? this.cachedRows : this.fetchAll();
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
   * Get column information
   */
  getColumnInfos(): ColumnInfo[] {
    this.checkNotFreed();
    // Use cached column infos if available
    if (this.cachedColumnInfos) {
      return this.cachedColumnInfos;
    }

    validateResultHandle(this.handle);
    const count = Number(functional.columnCount(this.handle));
    const infos: ColumnInfo[] = [];

    for (let i = 0; i < count; i++) {
      infos.push({
        name: functional.columnName(this.handle, i),
        type: functional.columnType(this.handle, i),
      });
    }
    this.cachedColumnInfos = infos;
    return this.cachedColumnInfos;
  }

  /**
   * Get number of rows
   */
  rowCount(): bigint {
    this.checkNotFreed();
    // Use cached count if available
    if (this.cachedRowCount !== 0n) {
      return this.cachedRowCount;
    }
    this.cachedRowCount = functional.rowCount(this.handle!);
    return this.cachedRowCount;
  }

  /**
   * Get number of columns
   */
  columnCount(): bigint {
    this.checkNotFreed();
    // Use cached count if available
    if (this.cachedColCount !== 0n) {
      return this.cachedColCount;
    }
    this.cachedColCount = functional.columnCount(this.handle!);
    return this.cachedColCount;
  }

  /**
   * Check if query was successful (always true if no exception thrown)
   */
  isSuccess(): boolean {
    return this.handle !== null;
  }

  /**
   * Get error message if query failed (always undefined if no exception thrown)
   */
  getError(): string | undefined {
    return undefined;
  }

  /**
   * Close the result (synchronous for use with Symbol.dispose)
   */
  close(): void {
    if (this.handle) {
      functional.destroyResult(this.handle);
      this.handle = null;
    }
  }

  /**
   * Auto-cleanup using Symbol.dispose
   */
  [Symbol.dispose](): void {
    this.close();
  }

  /**
   * Check if result is freed and return handle
   * @throws InvalidResourceError if result has been freed
   */
  private checkNotFreed(): ResultHandle {
    if (!this.handle) {
      throw new InvalidResourceError("Result has been freed");
    }
    return this.handle;
  }
}
