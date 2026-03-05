/**
 * Object-Oriented QueryResult class
 */

import type {
  ColumnInfo,
  DuckDBTypeValue,
  ResultHandle,
  RowData,
} from "../types.ts";
import * as query from "../functional/query.ts";
import * as value from "../functional/value.ts";
import { getLibrary } from "../lib.ts";
import { InvalidResourceError } from "../errors.ts";
import type { Connection } from "./connection.ts";
import { createPointerView } from "../helpers.ts";

/** Cached column data for getRow optimization */
interface ColumnCache {
  types: DuckDBTypeValue[];
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
  private connection: Connection;
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
    _result: ResultHandle, // Kept for backward compatibility signature
    connection: Connection,
  ) {
    this.handle = handle;
    this.connection = connection;
  }

  /**
   * Fetch all rows from the result
   * Results are cached for subsequent calls (if below size limit)
   *
   * @returns Array of rows
   */
  async fetchAll(): Promise<RowData[]> {
    this.checkNotFreed();
    if (!this.handle) {
      throw new InvalidResourceError("Result has been freed");
    }

    // Return cached rows if available
    if (this.cachedRows) {
      return this.cachedRows;
    }

    // Fetch rows
    const rows = await value.fetchAll(this.handle);

    // Only cache if below size limit
    if (rows.length <= MAX_CACHED_ROWS) {
      this.cachedRows = rows;
      // Cache row/col counts
      this.cachedRowCount = BigInt(rows.length);
      this.cachedColCount = BigInt(
        rows.length > 0 ? rows[0].length : 0,
      );
      return this.cachedRows;
    }

    // For large results, don't cache - compute counts and return directly
    this.cachedRowCount = BigInt(rows.length);
    this.cachedColCount = BigInt(
      rows.length > 0 ? rows[0].length : 0,
    );

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
  async getRow(index: number): Promise<RowData> {
    this.checkNotFreed();
    if (!this.handle) {
      throw new InvalidResourceError("Result has been freed");
    }

    // Use cached rows if available
    if (this.cachedRows) {
      if (index < 0 || index >= this.cachedRows.length) {
        throw new InvalidResourceError("Row index out of bounds");
      }
      return this.cachedRows[index];
    }

    // Cache row/col count on first call
    if (this.cachedRowCount === 0n) {
      this.cachedRowCount = await query.rowCount(this.handle);
      this.cachedColCount = await query.columnCount(this.handle);
    }

    if (index < 0 || index >= Number(this.cachedRowCount)) {
      throw new InvalidResourceError("Row index out of bounds");
    }

    // Build column cache on first call
    if (!this.columnCache) {
      this.columnCache = await this.buildColumnCache();
    }

    const colCount = Number(this.cachedColCount);
    const row: RowData = [];

    for (let c = 0; c < colCount; c++) {
      const type = this.columnCache!.types[c];
      const dataView = this.columnCache!.dataViews[c];
      const nullMaskView = this.columnCache!.nullMaskViews[c];
      const val = value.getValueByTypeOptimized(
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
  private async buildColumnCache(): Promise<ColumnCache> {
    const colCount = Number(this.cachedColCount);
    const lib = await getLibrary();
    const types: DuckDBTypeValue[] = [];
    const dataViews: (Deno.UnsafePointerView | null)[] = [];
    const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

    for (let c = 0; c < colCount; c++) {
      types[c] = await query.columnType(this.handle!, c);

      const dataPtr = lib.symbols.duckdb_column_data(
        this.handle!,
        BigInt(c),
      );
      dataViews[c] = dataPtr ? createPointerView(dataPtr) : null;

      const nullMaskPtr = lib.symbols.duckdb_nullmask_data(
        this.handle!,
        BigInt(c),
      );
      nullMaskViews[c] = nullMaskPtr ? createPointerView(nullMaskPtr) : null;
    }

    return { types, dataViews, nullMaskViews };
  }

  /**
   * Convert result to array of objects
   *
   * @returns Array of objects with column names as keys
   */
  async toArrayOfObjects(): Promise<Record<string, unknown>[]> {
    const rows = this.cachedRows ? this.cachedRows : await this.fetchAll();
    const cols = await this.getColumnInfos();
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
  async rowCount(): Promise<bigint> {
    this.checkNotFreed();
    if (!this.handle) return 0n;
    // Use cached count if available
    if (this.cachedRowCount !== 0n) {
      return this.cachedRowCount;
    }
    this.cachedRowCount = await query.rowCount(this.handle);
    return this.cachedRowCount;
  }

  /**
   * Get number of columns
   */
  async columnCount(): Promise<bigint> {
    this.checkNotFreed();
    if (!this.handle) return 0n;
    // Use cached count if available
    if (this.cachedColCount !== 0n) {
      return this.cachedColCount;
    }
    this.cachedColCount = await query.columnCount(this.handle);
    return this.cachedColCount;
  }

  /**
   * Get column information
   */
  async getColumnInfos(): Promise<ColumnInfo[]> {
    this.checkNotFreed();
    if (!this.handle) return [];
    // Use cached column infos if available
    if (this.cachedColumnInfos) {
      return this.cachedColumnInfos;
    }
    this.cachedColumnInfos = await query.columnInfos(this.handle);
    return this.cachedColumnInfos;
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
      query.destroyResultSync(this.handle);
      this.handle = null;
    }
  }

  /**
   * Auto-cleanup using Symbol.dispose
   */
  [Symbol.dispose](): void {
    this.close();
  }

  private checkNotFreed(): void {
    if (!this.handle) {
      throw new InvalidResourceError("Result has been freed");
    }
  }
}
