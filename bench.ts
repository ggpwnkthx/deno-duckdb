/**
 * Benchmark script comparing query performance across three API layers:
 * 1. @ggpwnkthx/libduckdb - Direct FFI calls
 * 2. Functional API - Pure functional style with explicit state
 * 3. Objective API - Object-oriented with automatic resource management
 *
 * Only measures query execution and fetch time, not setup/cleanup overhead.
 */

import { load } from "@ggpwnkthx/libduckdb";
import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import type { DuckDBLibrary } from "./src/types.ts";

// Test query - generates 100,000 rows with two integer columns
const QUERY = "select i, i as a from generate_series(1, 100000) s(i)";

// Load library and set up connections once (not measured)
const lib: DuckDBLibrary = await load();

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
const dbResultFunc = functional.open(lib);
if (!dbResultFunc.success) throw new Error("Failed to open database");
const connResultFunc = functional.create(lib, dbResultFunc.handle);
if (!connResultFunc.success) throw new Error("Failed to create connection");

// Objective API setup
const dbObj = new objective.Database(lib);
const connObj = dbObj.connect();

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

  // Pre-fetch column data pointers and create views once per column
  const dataViews: Deno.UnsafePointerView[] = [];
  for (let c = 0; c < colCount; c++) {
    const dataPtr = lib.symbols.duckdb_column_data(resultHandle, BigInt(c));
    if (dataPtr) {
      dataViews[c] = new Deno.UnsafePointerView(
        dataPtr as unknown as Deno.PointerObject<unknown>,
      );
    }
  }

  // Read the data using pre-fetched views
  const rows: unknown[][] = [];
  for (let r = 0; r < rowCount; r++) {
    const row: unknown[] = [];
    for (let c = 0; c < colCount; c++) {
      const view = dataViews[c];
      if (view) {
        const val = view.getBigInt64(r * 8);
        row.push(val);
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

Deno.bench("Functional API", () => {
  // Execute query
  const queryResult = functional.execute(lib, connResultFunc.handle, QUERY);
  if (!queryResult.success) {
    throw new Error(`Query failed: ${queryResult.error}`);
  }

  // Fetch all rows
  const rows = functional.fetchAll(lib, queryResult.handle);

  // Cleanup (not measured)
  functional.destroyResult(lib, queryResult.handle);

  // Verify we got the data
  if (rows.length !== 100000) {
    throw new Error(`Expected 100000 rows, got ${rows.length}`);
  }
});

Deno.bench("Objective API", () => {
  // Execute query
  const result = connObj.query(QUERY);

  // Fetch all rows
  const rows = result.fetchAll();

  // Cleanup (not measured)
  result.free();

  // Verify we got the data
  if (rows.length !== 100000) {
    throw new Error(`Expected 100000 rows, got ${rows.length}`);
  }
});
