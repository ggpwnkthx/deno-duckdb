/**
 * Benchmark: Byte-by-Byte ReadBytes
 *
 * Issue: Uses loop to copy bytes one at a time instead of bulk copy.
 * Location: src/core/result.ts lines 93-107
 *
 * Compare: reading large strings (1KB, 10KB, 100KB)
 * Query: select repeat('x', size) (varying sizes)
 */

import { functional } from "../src/mod.ts";

const dbHandle = await functional.open();
const connHandle = await functional.create(dbHandle);

// Warmup using prepared statement
{
  const stmt = functional.prepare(connHandle, "select repeat('x', 1000)");
  const result = functional.executePreparedResult(stmt);
  result.toArray();
  result.close();
  functional.destroyPrepared(stmt);
}

// Benchmark: Small strings (1KB)
Deno.bench("String reading: 1KB strings", () => {
  const stmt = functional.prepare(connHandle, "select repeat('x', 1000)");
  const result = functional.executePreparedResult(stmt);

  try {
    const rows = result.toArray();
    // Force decoding
    for (const row of rows) {
      const _len = (row[0] as string).length;
    }
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Benchmark: Medium strings (10KB)
Deno.bench("String reading: 10KB strings", () => {
  const stmt = functional.prepare(connHandle, "select repeat('x', 10000)");
  const result = functional.executePreparedResult(stmt);

  try {
    const rows = result.toArray();
    // Force decoding
    for (const row of rows) {
      const _len = (row[0] as string).length;
    }
  } finally {
    result.close();
    functional.destroyPrepared(stmt);
  }
});

// Benchmark: Large strings (100KB)
Deno.bench("String reading: 100KB strings", () => {
  const stmt = functional.prepare(connHandle, "select repeat('x', 100000)");
  const result = functional.executePreparedResult(stmt);

  try {
    const rows = result.toArray();
    // Force decoding
    for (const row of rows) {
      const _len = (row[0] as string).length;
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
