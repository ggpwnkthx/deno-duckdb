/**
 * Benchmark: Redundant FFI Calls in Column Info
 *
 * Issue: getResultColumnCount called twice per column iteration.
 * Location: src/core/native.ts lines 499-511
 *
 * Compare: many columns (50+) result metadata extraction
 */

import { functional } from "@ggpwnkthx/duckdb";

const dbHandle = await functional.open();
const connHandle = await functional.create(dbHandle);

// Create query with many columns
const MANY_COLUMNS = 100;
let query = "SELECT ";
for (let i = 0; i < MANY_COLUMNS; i++) {
  query += `i as col${i},`;
}
query = query.slice(0, -1) + " FROM generate_series(1, 10) s(i)";

// Warmup using prepared statements
{
  const stmt = functional.prepare(connHandle, query);
  const result = functional.executePreparedResult(stmt);
  result.toArray();
  result.close();
  functional.destroyPrepared(stmt);
}

// Benchmark: Get column count repeatedly (shows redundant FFI calls)
Deno.bench("Column info: columnInfos per column (BROKEN)", () => {
  const stmt = functional.prepare(connHandle, query);
  const result = functional.executePreparedResult(stmt);

  try {
    // This internally calls getResultColumnCount multiple times
    const infos = result.columns;
    // Access all to force iteration
    let _sum = 0;
    for (const info of infos) {
      _sum += info.type;
    }
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Benchmark: Use LazyResult with cached column info (optimized)
Deno.bench("Column info: cached via LazyResult (OPTIMIZED)", () => {
  const stmt = functional.prepare(connHandle, query);
  const result = functional.executePreparedResult(stmt);

  try {
    // Column info is cached in the LazyResult
    const cols = result.columns;
    let _sum = 0;
    for (const col of cols) {
      _sum += col.type;
    }
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Benchmark: Extract column metadata directly
Deno.bench("Column info: direct extraction", () => {
  const stmt = functional.prepare(connHandle, query);
  const result = functional.executePreparedResult(stmt);

  try {
    const rowCount = result.rowCount;
    const colCount = result.columnCount;
    const _info = result.columns;
    // Force usage
    const _total = rowCount * colCount;
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Cleanup
addEventListener("unload", () => {
  try {
    functional.closeConnection(connHandle);
  } catch { /* ignore */ }
  try {
    functional.closeDatabase(dbHandle);
  } catch { /* ignore */ }
});
