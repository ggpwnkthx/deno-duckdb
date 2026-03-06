/**
 * Benchmark script comparing query performance across Materialized vs Lazy iteration:
 *
 * === Materialized Results ===
 * These benchmarks execute queries and load the full result set into memory.
 * - Direct FFI: @ggpwnkthx/libduckdb - Direct FFI calls
 * - Functional API: Pure functional style with explicit state
 * - Objective API: Object-oriented with automatic resource management
 *
 * === Lazy Iteration over Materialized Results ===
 * These benchmarks iterate over rows lazily without loading the full result set.
 * - Functional API Lazy Iteration: Lazy row-by-row iteration
 * - Objective API Lazy Iteration: Lazy row-by-row iteration
 *
 * Only measures query execution and fetch time, not setup/cleanup overhead.
 */

import { load } from "@ggpwnkthx/libduckdb";
import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";

// Test query - generates 100,000 rows with two integer columns
const QUERY = "select i, i as a from generate_series(1, 100000) s(i)";

// Load library and set up connections once (not measured)
// Note: We still load explicitly to have direct FFI access for the benchmark
const lib = await load();

// Direct FFI setup
const dbHandleFFI = new Uint8Array(new ArrayBuffer(8));
const pathPtr = Deno.UnsafePointer.of(
  new TextEncoder().encode(":memory:\0"),
) as unknown as Deno.PointerObject<unknown>;
lib.symbols.duckdb_open(pathPtr, dbHandleFFI);

const connHandleFFI = new Uint8Array(new ArrayBuffer(8));
const dbPtr = new DataView(dbHandleFFI.buffer).getBigUint64(0, true);
lib.symbols.duckdb_connect(dbPtr, connHandleFFI);

// Functional API setup
const dbHandleFunc = await functional.open();
const connHandleFunc = await functional.create(dbHandleFunc);

// Objective API setup
const dbObj = new objective.Database();
const connObj = await dbObj.connect();

Deno.bench("Direct FFI", () => {
  // Execute query
  const resultHandle = new Uint8Array(new ArrayBuffer(48));
  const connPtr = new DataView(connHandleFFI.buffer).getBigUint64(0, true);
  const sqlPtr = Deno.UnsafePointer.of(
    new TextEncoder().encode(QUERY + "\0"),
  ) as unknown as Deno.PointerObject<unknown>;
  lib.symbols.duckdb_query(connPtr, sqlPtr, resultHandle);

  // Fetch all rows (materialize the result)
  const rowCount = Number(lib.symbols.duckdb_row_count(resultHandle));
  const colCount = Number(lib.symbols.duckdb_column_count(resultHandle));

  // Pre-fetch column types and data pointers once per column
  const columnTypes: number[] = [];
  const dataViews: (Deno.UnsafePointerView | null)[] = [];

  for (let c = 0; c < colCount; c++) {
    // Get column type (INTEGER=4, BIGINT=5, DOUBLE=11, VARCHAR=17)
    columnTypes[c] = lib.symbols.duckdb_column_type(
      resultHandle,
      BigInt(c),
    ) as number;

    // Pre-fetch column data pointer and create view
    const dataPtr = lib.symbols.duckdb_column_data(resultHandle, BigInt(c));
    if (dataPtr) {
      dataViews[c] = new Deno.UnsafePointerView(
        dataPtr as unknown as Deno.PointerObject<unknown>,
      );
    } else {
      dataViews[c] = null;
    }
  }

  // Read the data using type-specific reads
  const rows: unknown[][] = [];
  for (let r = 0; r < rowCount; r++) {
    const row: unknown[] = [];
    for (let c = 0; c < colCount; c++) {
      const type = columnTypes[c];
      const view = dataViews[c];

      if (!view) {
        row.push(null);
        continue;
      }

      // Use type-specific reads matching the functional API
      switch (type) {
        case 1: // BOOLEAN
          row.push(view.getInt8(r * 1));
          break;
        case 2: // TINYINT
          row.push(view.getInt8(r * 1));
          break;
        case 3: // SMALLINT
          row.push(view.getInt16(r * 2));
          break;
        case 4: // INTEGER
          row.push(view.getInt32(r * 4));
          break;
        case 5: // BIGINT
          row.push(view.getBigInt64(r * 8));
          break;
        case 6: // HUGEINT
        {
          const offset = r * 16;
          const lower = view.getBigUint64(offset);
          const upper = view.getBigInt64(offset + 8);
          row.push((upper << 64n) + lower);
          break;
        }
        case 7: // FLOAT (type 7 in some versions)
        case 10: // FLOAT
          row.push(view.getFloat32(r * 4));
          break;
        case 11: // DOUBLE
        case 19: // DECIMAL
          row.push(view.getFloat64(r * 8));
          break;
        case 17: // VARCHAR
        case 18: // BLOB
        default: {
          // String types: read pointer first, then dereference
          const innerPtr = view.getPointer(r * 8);
          if (innerPtr) {
            const innerView = new Deno.UnsafePointerView(
              innerPtr as unknown as Deno.PointerObject<unknown>,
            );
            row.push(innerView.getCString());
          } else {
            row.push("");
          }
          break;
        }
      }
    }
    rows.push(row);
  }

  // Cleanup (not measured)
  lib.symbols.duckdb_destroy_result(resultHandle);

  // Verify we got the data
  if (rows.length !== 100000) {
    throw new Error(`Expected 100000 rows, got ${rows.length}`);
  }
});

Deno.bench("Functional API", async () => {
  // Execute query
  const resultHandle = await functional.execute(connHandleFunc, QUERY);

  // Fetch all rows
  const rows = await functional.fetchAll(resultHandle);

  // Cleanup (not measured)
  await functional.destroyResult(resultHandle);

  // Verify we got the data
  if (rows.length !== 100000) {
    throw new Error(`Expected 100000 rows, got ${rows.length}`);
  }
});

Deno.bench("Objective API", async () => {
  // Execute query
  const result = await connObj.query(QUERY);

  // Fetch all rows
  const rows = await result.fetchAll();

  // Cleanup (not measured)
  await result.close();

  // Verify we got the data
  if (rows.length !== 100000) {
    throw new Error(`Expected 100000 rows, got ${rows.length}`);
  }
});

// === Lazy Iteration over Materialized Results ===

Deno.bench("Functional API Lazy Iteration", async () => {
  // Execute and iterate over rows lazily
  let count = 0;
  for await (const _row of functional.stream(connHandleFunc, QUERY)) {
    count++;
  }

  // Verify we got the data
  if (count !== 100000) {
    throw new Error(`Expected 100000 rows, got ${count}`);
  }
});

Deno.bench("Objective API Lazy Iteration", async () => {
  // Execute and iterate over rows lazily
  let count = 0;
  for await (const _row of connObj.stream(QUERY)) {
    count++;
  }

  // Verify we got the data
  if (count !== 100000) {
    throw new Error(`Expected 100000 rows, got ${count}`);
  }
});
