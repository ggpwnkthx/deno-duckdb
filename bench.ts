/**
 * Benchmark script comparing query performance across different APIs:
 *
 * === Standard Query API ===
 * Benchmarks standard query execution that fetches all rows at once.
 *
 * - Functional API: execute() + fetchAll()
 * - Objective API: query() + fetchAll()
 *
 * === Prepared Statement API ===
 * Benchmarks prepared statement usage with parameter binding.
 *
 * - Prepare once, execute multiple times: measure execution only
 * - Full prepare + execute cycle: measure complete workflow
 *
 * Only measures query execution and fetch time, not setup/cleanup overhead.
 */

import { load } from "@ggpwnkthx/libduckdb";
import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";

// Import additional functions for standard query and prepared statement benchmarks
import {
  bind,
  destroyPrepared,
  destroyResult,
  query,
  executePrepared,
  fetchAll,
  prepare,
} from "@ggpwnkthx/duckdb/functional";

// Test query - generates 100,000 rows with two integer columns
const QUERY = "select i, i as a from generate_series(1, 100000) s(i)";

// Prepared statement query with parameter
const PREP_QUERY = "select i, i as a from generate_series(1, ?) s(i)";

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

// =============================================================================
// Standard Query API Benchmarks
// =============================================================================

Deno.bench("Standard Query: Functional API", () => {
  // Execute query
  const resultHandle = query(connHandleFunc, QUERY);

  // Fetch all rows
  const rows = fetchAll(resultHandle);

  // Cleanup (not measured)
  destroyResult(resultHandle);

  // Verify we got the data
  if (rows.length !== 100000) {
    throw new Error(`Expected 100000 rows, got ${rows.length}`);
  }
});

Deno.bench("Standard Query: Objective API", () => {
  // Execute query
  const result = connObj.query(QUERY);

  // Fetch all rows
  const rows = result.fetchAll();

  // Cleanup (not measured)
  result.close();

  // Verify we got the data
  if (rows.length !== 100000) {
    throw new Error(`Expected 100000 rows, got ${rows.length}`);
  }
});

// =============================================================================
// Prepared Statement Benchmarks
// =============================================================================

// Prepare statement once (not measured) - for "prepare once, execute multiple" benchmarks
const preparedHandleFunc = prepare(connHandleFunc, PREP_QUERY);

Deno.bench("Prepared Statement: Execute (prepared once)", () => {
  // Bind parameter (100000 rows)
  bind(preparedHandleFunc, [100000]);

  // Execute prepared statement
  const resultHandle = executePrepared(preparedHandleFunc);

  // Get row count
  const rowCount = functional.rowCount(resultHandle);

  // Cleanup (not measured)
  destroyResult(resultHandle);

  // Verify we got the data
  if (rowCount !== 100000n) {
    throw new Error(`Expected 100000 rows, got ${rowCount}`);
  }
});

// Objective API prepared statement - prepare once outside benchmark
const preparedObj = connObj.prepare(PREP_QUERY);

Deno.bench("Prepared Statement: Objective API (prepared once)", () => {
  // Bind parameter (100000 rows)
  preparedObj.bind([100000]);

  // Execute prepared statement
  const result = preparedObj.execute();

  // Get row count
  const rowCount = result.rowCount();

  // Cleanup (not measured)
  result.close();

  // Verify we got the data
  if (rowCount !== 100000n) {
    throw new Error(`Expected 100000 rows, got ${rowCount}`);
  }
});

// Full prepare + execute cycle benchmarks (each iteration prepares fresh)
Deno.bench("Prepared Statement: Full cycle (Functional)", () => {
  // Prepare statement
  const stmtHandle = prepare(connHandleFunc, PREP_QUERY);

  // Bind parameter (100000 rows)
  bind(stmtHandle, [100000]);

  // Execute prepared statement
  const resultHandle = executePrepared(stmtHandle);

  // Get row count
  const rowCount = functional.rowCount(resultHandle);

  // Cleanup (not measured)
  destroyResult(resultHandle);
  destroyPrepared(stmtHandle);

  // Verify we got the data
  if (rowCount !== 100000n) {
    throw new Error(`Expected 100000 rows, got ${rowCount}`);
  }
});

Deno.bench("Prepared Statement: Full cycle (Objective)", () => {
  // Prepare statement
  const stmt = connObj.prepare(PREP_QUERY);

  // Bind parameter (100000 rows)
  stmt.bind([100000]);

  // Execute prepared statement
  const result = stmt.execute();

  // Get row count
  const rowCount = result.rowCount();

  // Cleanup (not measured)
  result.close();
  stmt.close();

  // Verify we got the data
  if (rowCount !== 100000n) {
    throw new Error(`Expected 100000 rows, got ${rowCount}`);
  }
});
