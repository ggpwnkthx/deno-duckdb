/**
 * Functional streaming operations
 */

import type { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type { ConnectionHandle, RowData } from "../types.ts";
import * as query from "./query.ts";
import { getLibraryFast } from "../lib.ts";
import { DatabaseError, QueryError } from "../errors.ts";
import { validateConnectionHandle } from "../helpers.ts";
import { decodeValueByType } from "./types.ts";

/** Default chunk size for streaming (DuckDB's default is 1024) */
const DEFAULT_CHUNK_SIZE = 1024;

/** Generator type for streaming rows */
export type RowStream = Generator<RowData, void, unknown>;

/**
 * Stream rows from a query result using lazy chunked fetching
 *
 * This provides lazy streaming by fetching rows in chunks using LIMIT/OFFSET
 * queries. Only one chunk is materialized at a time, making it memory-efficient
 * for large datasets.
 *
 * Features:
 * - Lazy row iteration (rows fetched on-demand in chunks)
 * - Automatic cleanup on early termination or exception
 * - Memory efficient (doesn't load all rows into memory)
 * - Isolation from subsequent queries on the same connection
 *
 * @param connHandle - Connection handle
 * @param sql - SQL query string
 * @param chunkSize - Number of rows per chunk (default: 1024)
 * @yields RowData for each row in the result
 */
export function* stream(
  connHandle: ConnectionHandle,
  sql: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
): RowStream {
  validateConnectionHandle(connHandle);

  if (!chunkSize || chunkSize <= 0) {
    throw new QueryError("Chunk size must be a positive integer", sql);
  }

  const lib = getLibraryFast();
  if (!lib) {
    throw new DatabaseError(
      "Library not loaded. Call open() or Database() first.",
    );
  }

  // Track offset for pagination
  let offset = 0;
  let hasMoreRows = true;

  while (hasMoreRows) {
    // Build paginated query: SELECT * FROM (...) LIMIT chunkSize OFFSET offset
    // Wrap original query in subquery to avoid conflicting with LIMIT/OFFSET
    const paginatedSql =
      `SELECT * FROM (${sql}) AS _stream_subquery LIMIT ${chunkSize} OFFSET ${offset}`;

    // Execute chunk query
    const handle = query.execute(connHandle, paginatedSql);

    try {
      const rowCount = Number(query.rowCount(handle));
      const colCount = Number(query.columnCount(handle));

      // No more rows - we're done
      if (rowCount === 0) {
        hasMoreRows = false;
        break;
      }

      // Get column types and data pointers
      const types: DUCKDB_TYPE[] = [];
      const dataViews: (Deno.UnsafePointerView | null)[] = [];
      const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

      for (let c = 0; c < colCount; c++) {
        types[c] = query.columnType(handle, c);

        const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(c));
        dataViews[c] = dataPtr
          ? new Deno.UnsafePointerView(dataPtr as Deno.PointerObject<unknown>)
          : null;

        const nullMaskPtr = lib.symbols.duckdb_nullmask_data(
          handle,
          BigInt(c),
        );
        nullMaskViews[c] = nullMaskPtr
          ? new Deno.UnsafePointerView(
            nullMaskPtr as Deno.PointerObject<unknown>,
          )
          : null;
      }

      // Yield rows from this chunk
      for (let r = 0; r < rowCount; r++) {
        const row: RowData = new Array(colCount);
        for (let c = 0; c < colCount; c++) {
          row[c] = decodeValueByType(
            r,
            types[c],
            dataViews[c],
            nullMaskViews[c],
          );
        }
        yield row;
      }

      // Update offset for next chunk
      offset += rowCount;

      // If we got fewer rows than chunkSize, we've exhausted the result
      if (rowCount < chunkSize) {
        hasMoreRows = false;
      }
    } finally {
      // Always destroy the result handle
      query.destroyResult(handle);
    }
  }
}
