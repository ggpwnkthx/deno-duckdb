/**
 * Object-Oriented Connection class
 */

import type {
  ConnectionHandle,
  PreparedStatementHandle,
  RowData,
} from "../types.ts";
import type { DuckDBLibrary } from "../lib.ts";
import * as conn from "../functional/connection.ts";
import * as query from "../functional/query.ts";
import * as prep from "../functional/prepared.ts";
import * as value from "../functional/value.ts";
import type { Database } from "./database.ts";
import { QueryResult as QueryResultClass } from "./query.ts";
import { PreparedStatement } from "./prepared.ts";

/** Async generator type for streaming rows */
export type RowStream = AsyncGenerator<RowData, void, unknown>;

/** Sync generator type for streaming rows */
export type SyncRowStream = Generator<RowData, void, unknown>;

/** Maximum cached prepared statements */
const MAX_CACHED_STATEMENTS = 100;

/**
 * Connection class - represents a connection to a DuckDB database
 */
export class Connection {
  private lib: DuckDBLibrary;
  private handle: ConnectionHandle | null = null;
  private closed = false;
  private database: Database;
  /** Cache for prepared statements - per-connection, not global */
  private preparedStatementCache = new Map<string, PreparedStatementHandle>();

  /**
   * Create a new Connection instance (internal use)
   *
   * @param lib - The loaded DuckDB library
   * @param handle - Connection handle
   * @param database - Parent database
   */
  constructor(
    lib: DuckDBLibrary,
    handle: ConnectionHandle,
    database: Database,
  ) {
    this.lib = lib;
    this.handle = handle;
    this.database = database;
  }

  /**
   * Execute a query and return results
   *
   * @param sql - SQL query string
   * @returns QueryResult instance
   */
  async query(sql: string): Promise<QueryResultClass> {
    this.checkNotClosed();
    const handle = await query.execute(this.handle!, sql);
    return new QueryResultClass(handle, handle, this);
  }

  /**
   * Execute a query and return typed results
   *
   * This method automatically maps rows to objects with column names as keys.
   * You can optionally provide a custom mapper function to transform the data.
   *
   * @param sql - SQL query string
   * @param mapper - Optional function to transform each row (defaults to mapping column names)
   * @returns Array of typed objects
   *
   * @example
   * ```typescript
   * // Basic usage - returns array of objects with column names
   * const rows = conn.queryTyped<{ id: number; name: string }>(
   *   "SELECT id, name FROM users"
   * );
   *
   * // With custom mapper
   * const rows = conn.queryTyped(
   *   "SELECT id, name, created_at FROM users",
   *   (row, cols) => ({
   *     userId: row[cols.indexOf("id")],
   *     displayName: row[cols.indexOf("name")],
   *     createdAt: new Date(row[cols.indexOf("created_at")]),
   *   })
   * );
   * ```
   */
  async queryTyped<T>(
    sql: string,
    mapper?: (row: RowData, columns: string[]) => T,
  ): Promise<T[]> {
    this.checkNotClosed();
    const handle = await query.execute(this.handle!, sql);

    try {
      const rows = await value.fetchAll(handle);
      const columns = (await query.columnInfos(handle)).map(
        (c) => c.name,
      );

      if (mapper) {
        return rows.map((row) => mapper(row, columns));
      }

      // Default mapper: convert to object with column names as keys
      return rows.map((row) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj as T;
      });
    } finally {
      await query.destroyResult(handle);
    }
  }

  /**
   * Execute a query and fetch all rows
   *
   * @param sql - SQL query string
   * @returns Array of rows
   */
  async queryAll(sql: string): Promise<RowData[]> {
    const result = await this.query(sql);
    return result.fetchAll();
  }

  /**
   * Execute a query and stream rows lazily
   *
   * This method returns an async generator that yields rows one at a time,
   * avoiding loading all rows into memory at once. Useful for large result sets.
   *
   * @param sql - SQL query string
   * @returns AsyncGenerator yielding rows
   */
  async *stream(sql: string): RowStream {
    this.checkNotClosed();
    const handle = await query.execute(this.handle!, sql);

    try {
      const rowCount = Number(await query.rowCount(handle));
      const colCount = Number(await query.columnCount(handle));

      if (rowCount === 0 || colCount === 0) {
        return;
      }

      // Build column cache once for the stream
      const types: number[] = [];
      const dataViews: (Deno.UnsafePointerView | null)[] = [];
      const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

      for (let c = 0; c < colCount; c++) {
        types[c] = await query.columnType(handle, c);

        const dataPtr = this.lib.symbols.duckdb_column_data(
          handle,
          BigInt(c),
        );
        if (dataPtr) {
          dataViews[c] = new Deno.UnsafePointerView(
            dataPtr as unknown as Deno.PointerObject<unknown>,
          );
        } else {
          dataViews[c] = null;
        }

        const nullMaskPtr = this.lib.symbols.duckdb_nullmask_data(
          handle,
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

      // Yield rows one at a time
      for (let r = 0; r < rowCount; r++) {
        const row: RowData = new Array(colCount);
        for (let c = 0; c < colCount; c++) {
          const type = types[c];
          const dataView = dataViews[c];
          const nullMaskView = nullMaskViews[c];

          // Get value based on type - optimized to skip null checking for numeric types
          if (type === 17 || type === 18 || type >= 19) {
            // String types: VARCHAR, BLOB, etc. - check null
            if (nullMaskView) {
              const nullMask = nullMaskView.getBigUint64(0);
              if ((nullMask & (1n << BigInt(r))) !== 0n) {
                row[c] = null;
                continue;
              }
            }
            if (dataView) {
              const innerPtr = dataView.getPointer(r * 8);
              if (innerPtr) {
                const innerView = new Deno.UnsafePointerView(
                  innerPtr as Deno.PointerObject<unknown>,
                );
                row[c] = innerView.getCString();
              } else {
                row[c] = "";
              }
            } else {
              row[c] = "";
            }
          } else if (type === 1 || type === 2 || type === 3 || type === 4) {
            // BOOLEAN, TINYINT, SMALLINT, INTEGER - skip null check for performance
            row[c] = dataView ? dataView.getInt32(r * 4) : 0;
          } else if (type === 5) {
            // BIGINT - skip null check for performance
            row[c] = dataView ? dataView.getBigInt64(r * 8) : 0n;
          } else if (
            type === 6 || type === 7 || type === 10 || type === 11 ||
            type === 19
          ) {
            // HUGEINT, FLOAT, DOUBLE, DECIMAL - skip null check for performance
            row[c] = dataView ? dataView.getFloat64(r * 8) : 0;
          } else {
            // Fallback - check null
            if (nullMaskView) {
              const nullMask = nullMaskView.getBigUint64(0);
              if ((nullMask & (1n << BigInt(r))) !== 0n) {
                row[c] = null;
                continue;
              }
            }
            row[c] = "";
          }
        }
        yield row;
      }
    } finally {
      // Always destroy the result handle
      await query.destroyResult(handle);
    }
  }

  /**
   * Execute a query and stream rows synchronously
   *
   * This method returns a generator that yields rows one at a time,
   * avoiding loading all rows into memory at once. More performant than
   * async stream() for bulk operations as it avoids Promise overhead.
   *
   * @param sql - SQL query string
   * @returns Generator yielding rows
   */
  /**
   * @deprecated streamSync is deprecated. Use async stream() instead.
   */
  streamSync(_sql: string): SyncRowStream {
    throw new Error("streamSync is deprecated. Use async stream() instead.");
  }

  /**
   * Prepare a statement
   * Uses caching to avoid re-parsing the same SQL
   *
   * @param sql - SQL statement to prepare
   * @returns PreparedStatement instance
   */
  async prepare(sql: string): Promise<PreparedStatement> {
    this.checkNotClosed();

    // Check cache first
    const cached = this.preparedStatementCache.get(sql);
    if (cached) {
      return new PreparedStatement(cached, this);
    }

    // Prepare new statement - now throws on error
    const handle = await prep.prepare(this.handle!, sql);

    // Cache if under limit
    if (this.preparedStatementCache.size < MAX_CACHED_STATEMENTS) {
      this.preparedStatementCache.set(sql, handle);
    }

    return new PreparedStatement(handle, this);
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.closed || !this.handle) return;

    // Clear prepared statement cache on connection close
    for (const cachedHandle of this.preparedStatementCache.values()) {
      await prep.destroyPrepared(cachedHandle);
    }
    this.preparedStatementCache.clear();

    await conn.closeConnection(this.handle);
    this.handle = null;
    this.closed = true;
    this.database._onConnectionClose(this);
  }

  /**
   * Check if connection is closed
   */
  isClosed(): boolean {
    return this.closed;
  }

  /**
   * Auto-cleanup using Symbol.dispose
   */
  [Symbol.dispose](): void {
    this.close();
  }

  private checkNotClosed(): void {
    if (this.closed) {
      throw new Error("Connection is closed");
    }
  }
}
