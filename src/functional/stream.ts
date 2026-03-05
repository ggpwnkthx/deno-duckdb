/**
 * Functional streaming operations
 */

import {
  type ConnectionHandle,
  DuckDBType,
  type DuckDBTypeValue,
  type RowData,
} from "../types.ts";
import * as query from "./query.ts";
import { getLibrary } from "../lib.ts";
import { DatabaseError } from "../errors.ts";
import {
  BYTE_SIZE_32,
  BYTE_SIZE_64,
  createPointerView,
  isStringType,
} from "../helpers.ts";

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
  const lib = await getLibrary();
  if (!lib) {
    throw new DatabaseError(
      "Library not loaded. Call open() or Database() first.",
    );
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
    const types: DuckDBTypeValue[] = [];
    const dataViews: (Deno.UnsafePointerView | null)[] = [];
    const nullMaskViews: (Deno.UnsafePointerView | null)[] = [];

    for (let c = 0; c < colCount; c++) {
      types[c] = await query.columnType(handle, c);

      const dataPtr = lib.symbols.duckdb_column_data(handle, BigInt(c));
      dataViews[c] = dataPtr ? createPointerView(dataPtr) : null;

      const nullMaskPtr = lib.symbols.duckdb_nullmask_data(
        handle,
        BigInt(c),
      );
      nullMaskViews[c] = nullMaskPtr ? createPointerView(nullMaskPtr) : null;
    }

    // Yield rows one at a time
    for (let r = 0; r < rowCount; r++) {
      const row: RowData = new Array(colCount);
      for (let c = 0; c < colCount; c++) {
        const type = types[c];
        const dataView = dataViews[c];
        const nullMaskView = nullMaskViews[c];

        // Use shared helper for string type check
        if (isStringType(type)) {
          // String types: VARCHAR, BLOB, etc. - check null
          // (1n << BigInt(r)) creates bitmask: 1 at position r, 0 elsewhere
          if (nullMaskView) {
            const nullMask = nullMaskView.getBigUint64(0);
            if ((nullMask & (1n << BigInt(r))) !== 0n) {
              row[c] = null;
              continue;
            }
          }
          if (dataView) {
            const innerPtr = dataView.getPointer(r * BYTE_SIZE_64);
            if (innerPtr) {
              const innerView = createPointerView(innerPtr);
              row[c] = innerView ? innerView.getCString() : "";
            } else {
              row[c] = "";
            }
          } else {
            row[c] = "";
          }
        } else if (
          type === DuckDBType.BOOLEAN || type === DuckDBType.TINYINT ||
          type === DuckDBType.SMALLINT || type === DuckDBType.INTEGER
        ) {
          // BOOLEAN, TINYINT, SMALLINT, INTEGER - check null
          if (nullMaskView) {
            const nullMask = nullMaskView.getBigUint64(0);
            if ((nullMask & (1n << BigInt(r))) !== 0n) {
              row[c] = null;
              continue;
            }
          }
          row[c] = dataView ? dataView.getInt32(r * BYTE_SIZE_32) : 0;
        } else if (type === DuckDBType.BIGINT) {
          // BIGINT - check null
          if (nullMaskView) {
            const nullMask = nullMaskView.getBigUint64(0);
            if ((nullMask & (1n << BigInt(r))) !== 0n) {
              row[c] = null;
              continue;
            }
          }
          row[c] = dataView ? dataView.getBigInt64(r * BYTE_SIZE_64) : 0n;
        } else if (
          type === DuckDBType.HUGEINT || type === DuckDBType.FLOAT ||
          type === DuckDBType.DOUBLE
        ) {
          // HUGEINT, FLOAT, DOUBLE - check null
          if (nullMaskView) {
            const nullMask = nullMaskView.getBigUint64(0);
            if ((nullMask & (1n << BigInt(r))) !== 0n) {
              row[c] = null;
              continue;
            }
          }
          row[c] = dataView ? dataView.getFloat64(r * BYTE_SIZE_64) : 0;
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
