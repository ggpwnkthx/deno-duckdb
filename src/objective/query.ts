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

/** Cached column data for getRow optimization */
interface ColumnCache {
  types: number[];
  dataViews: Deno.UnsafePointerView[];
  nullMaskViews: (Deno.UnsafePointerView | null)[];
}

/**
 * QueryResult class - represents query results
 */
export class QueryResult {
  private lib: DuckDBLibrary;
  private handle: ResultHandle | null = null;
  private resultData: QueryResultData | null = null;
  private connection: Connection;
  private columnCache: ColumnCache | null = null;
  private cachedRowCount = 0n;
  private cachedColCount = 0n;
  private cachedRows: RowData[] | null = null;

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
   * Results are cached for subsequent calls
   *
   * @returns Array of rows
   */
  fetchAll(): RowData[] {
    this.checkNotFreed();
    if (!this.handle) {
      throw new Error("Result has been freed");
    }

    // Return cached rows if available
    if (this.cachedRows) {
      return this.cachedRows;
    }

    // Fetch and cache rows
    this.cachedRows = value.fetchAll(this.lib, this.handle);

    // Cache row/col counts
    this.cachedRowCount = BigInt(this.cachedRows.length);
    this.cachedColCount = BigInt(
      this.cachedRows.length > 0 ? this.cachedRows[0].length : 0,
    );

    return this.cachedRows;
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
    this.checkNotFreed();
    if (!this.handle) {
      throw new Error("Result has been freed");
    }

    // Use cached rows if available
    if (this.cachedRows) {
      if (index < 0 || index >= this.cachedRows.length) {
        throw new Error("Row index out of bounds");
      }
      return this.cachedRows[index];
    }

    // Cache row/col count on first call
    if (this.cachedRowCount === 0n) {
      this.cachedRowCount = query.rowCount(this.lib, this.handle);
      this.cachedColCount = query.columnCount(this.lib, this.handle);
    }

    if (index < 0 || index >= Number(this.cachedRowCount)) {
      throw new Error("Row index out of bounds");
    }

    // Build column cache on first call
    if (!this.columnCache) {
      this.columnCache = this.buildColumnCache();
    }

    const colCount = Number(this.cachedColCount);
    const row: RowData = [];

    for (let c = 0; c < colCount; c++) {
      const type = this.columnCache.types[c];
      const dataView = this.columnCache.dataViews[c];
      const nullMaskView = this.columnCache.nullMaskViews[c];
      const val = value.getValueByTypeOptimized(
        index,
        c,
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
    const colCount = Number(this.cachedColCount);
    const types: number[] = [];
    const dataViews: Deno.UnsafePointerView[] = [];
    const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

    for (let c = 0; c < colCount; c++) {
      types[c] = query.columnType(this.lib, this.handle!, c);

      const dataPtr = this.lib.symbols.duckdb_column_data(
        this.handle!,
        BigInt(c),
      );
      if (dataPtr) {
        dataViews[c] = new Deno.UnsafePointerView(
          dataPtr as unknown as Deno.PointerObject<unknown>,
        );
      } else {
        dataViews[c] = null as unknown as Deno.UnsafePointerView;
      }

      const nullMaskPtr = this.lib.symbols.duckdb_nullmask_data(
        this.handle!,
        BigInt(c),
      );
      if (nullMaskPtr) {
        nullMaskViews[c] = new Deno.UnsafePointerView(
          nullMaskPtr as unknown as Deno.PointerObject<unknown>,
        );
      } else {
        nullMaskViews[c] = null;
      }
    }

    return { types, dataViews, nullMaskViews };
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
    // Use cached count if available
    if (this.cachedRowCount !== 0n) {
      return this.cachedRowCount;
    }
    return query.rowCount(this.lib, this.handle);
  }

  /**
   * Get number of columns
   */
  columnCount(): bigint {
    this.checkNotFreed();
    if (!this.handle) return 0n;
    // Use cached count if available
    if (this.cachedColCount !== 0n) {
      return this.cachedColCount;
    }
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
