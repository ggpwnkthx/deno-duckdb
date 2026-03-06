/**
 * Functional streaming operations
 */

import type { ConnectionHandle, DuckDBTypeValue, RowData } from "../types.ts";
import * as query from "./query.ts";
import { getLibraryFast } from "../lib.ts";
import { DatabaseError } from "../errors.ts";
import { validateConnectionHandle } from "../helpers.ts";
import { decodeValueByType } from "./types.ts";

/**
 * Stream rows from a query result lazily
 *
 * This is a generator function that yields rows one at a time,
 * avoiding loading all rows into memory at once.
 *
 * @param connHandle - Connection handle
 * @param sql - SQL query string
 * @yields RowData for each row in the result
 */
export async function* stream(
  connHandle: ConnectionHandle,
  sql: string,
): AsyncGenerator<RowData, void, unknown> {
  validateConnectionHandle(connHandle);
  const lib = getLibraryFast();
  if (!lib) {
    throw new DatabaseError(
      "Library not loaded. Call open() or Database() first.",
    );
  }

  // execute now throws on error
  const handle = query.execute(connHandle, sql);

  try {
    const rowCount = Number(query.rowCount(handle));
    const colCount = Number(query.columnCount(handle));

    if (rowCount === 0 || colCount === 0) {
      return;
    }

    // Build column cache once for the stream
    const types: DuckDBTypeValue[] = [];
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
        ? new Deno.UnsafePointerView(nullMaskPtr as Deno.PointerObject<unknown>)
        : null;
    }

    // Yield rows one at a time
    for (let r = 0; r < rowCount; r++) {
      const row: RowData = new Array(colCount);
      for (let c = 0; c < colCount; c++) {
        // Use unified decoder for all types
        row[c] = decodeValueByType(
          r,
          types[c],
          dataViews[c],
          nullMaskViews[c],
        );
      }
      yield row;
    }
  } finally {
    // Always destroy the result handle
    query.destroyResult(handle);
  }
}
