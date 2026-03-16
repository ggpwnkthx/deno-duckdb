/**
 * Benchmark: Array/Object Allocation Per Row
 *
 * Issue: New Array/Object created for each row.
 * Location: src/core/result.ts lines 507-536
 *
 * Compare: array row vs object row iteration
 * Measure: memory pressure with large result sets
 */

import { functional } from "../src/mod.ts";

const QUERY =
  "select i, i::text, i % 2 = 0 as even from generate_series(1, 10000) s(i)";

const dbHandle = await functional.open();
const connHandle = await functional.create(dbHandle);

// Warmup using prepared statement
{
  const stmt = functional.prepare(connHandle, QUERY);
  const result = functional.executePreparedResult(stmt);
  result.toArray();
  result.close();
  functional.destroyPrepared(stmt);
}

// Benchmark: Array row iteration via LazyResult
Deno.bench("Row allocation: array rows", () => {
  const stmt = functional.prepare(connHandle, QUERY);
  const result = functional.executePreparedResult(stmt);

  try {
    let sum = 0;
    // Iterate over LazyResult rows directly
    for (const row of result) {
      sum += Number(row[0]);
    }
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Benchmark: Object row iteration
Deno.bench("Row allocation: object rows", () => {
  const stmt = functional.prepare(connHandle, QUERY);
  const result = functional.executePreparedResult(stmt);

  try {
    let sum = 0;
    // Iterate over object rows
    for (const row of result.objects()) {
      sum += Number(row.i);
    }
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Benchmark: toArray (materialize all array rows)
Deno.bench("Row allocation: toArray() materialization", () => {
  const stmt = functional.prepare(connHandle, QUERY);
  const result = functional.executePreparedResult(stmt);

  try {
    const rows = result.toArray();
    let sum = 0;
    for (const row of rows) {
      sum += Number(row[0]);
    }
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Benchmark: toObjectArray (materialize all object rows)
Deno.bench("Row allocation: toObjectArray() materialization", () => {
  const stmt = functional.prepare(connHandle, QUERY);
  const result = functional.executePreparedResult(stmt);

  try {
    const rows = result.toObjectArray();
    let sum = 0;
    for (const row of rows) {
      sum += Number(row.i);
    }
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Benchmark: functional.fetchAll
Deno.bench("Row allocation: functional.fetchAll", () => {
  const stmt = functional.prepare(connHandle, QUERY);
  const result = functional.executePreparedResult(stmt);

  try {
    const rows = result.toArray();
    let sum = 0;
    for (const row of rows) {
      sum += Number(row[0]);
    }
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Benchmark: functional.fetchObjects
Deno.bench("Row allocation: functional.fetchObjects", () => {
  const stmt = functional.prepare(connHandle, QUERY);
  const result = functional.executePreparedResult(stmt);

  try {
    const rows = result.toObjectArray();
    let sum = 0;
    for (const row of rows) {
      sum += Number(row.i);
    }
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
