/**
 * Functional streaming operations
 */

import type { ConnectionHandle, RowData } from "../types.ts";
import * as query from "./query.ts";
import { getLibrarySync } from "../lib.ts";

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
  const lib = getLibrarySync();
  if (!lib) {
    throw new Error("Library not loaded. Call open() or Database() first.");
  }

  // execute now throws on error
  const handle = await query.execute(connHandle, sql);

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

      const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(c));
      if (dataPtr) {
        dataViews[c] = new Deno.UnsafePointerView(
          dataPtr as unknown as Deno.PointerObject<unknown>,
        );
      } else {
        dataViews[c] = null;
      }

      const nullMaskPtr = lib.symbols.duckdb_nullmask_data(
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
          type === 6 || type === 7 || type === 10 || type === 11 || type === 19
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
