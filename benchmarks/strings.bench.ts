/**
 * Benchmark string handling performance.
 *
 * Tests:
 * - Short strings (< 16 bytes)
 * - Medium strings (100-1KB)
 * - Large strings (100KB+)
 * - Empty strings and null strings
 */

import * as functional from "@ggpwnkthx/duckdb/functional";

const ROW_COUNT = 100_000;

// Pre-setup
const dbHandle = await functional.open();
const connHandle = await functional.connectToDatabase(dbHandle);

// Short strings (< 16 bytes)
Deno.bench("String: short (10 chars, 100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT 'item_' || (i % 1000) FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalLen = 0;
  for (const row of rows) {
    totalLen += (row[0] as string).length;
  }
  if (totalLen === 0) throw new Error("Length check failed");
  result.close();
});

Deno.bench("String: short with varied length (1-15 chars, 100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT substr('abcdefghijklmnop', 1, (i % 15) + 1) FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalLen = 0;
  for (const row of rows) {
    totalLen += (row[0] as string).length;
  }
  if (totalLen === 0) throw new Error("Length check failed");
  result.close();
});

// Medium strings (100-1000 bytes)
Deno.bench("String: medium (100 chars, 100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT repeat('x', 100) FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalLen = 0;
  for (const row of rows) {
    totalLen += (row[0] as string).length;
  }
  if (totalLen === 0) throw new Error("Length check failed");
  result.close();
});

Deno.bench("String: medium (1KB, 10K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT repeat('x', 1024) FROM generate_series(1, 10000) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalLen = 0;
  for (const row of rows) {
    totalLen += (row[0] as string).length;
  }
  if (totalLen === 0) throw new Error("Length check failed");
  result.close();
});

// Large strings (100KB+)
Deno.bench("String: large (100KB, 1K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT repeat('x', 102400) FROM generate_series(1, 1000) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalLen = 0;
  for (const row of rows) {
    totalLen += (row[0] as string).length;
  }
  if (totalLen === 0) throw new Error("Length check failed");
  result.close();
});

Deno.bench("String: large (1MB, 100 rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT repeat('x', 1048576) FROM generate_series(1, 100) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalLen = 0;
  for (const row of rows) {
    totalLen += (row[0] as string).length;
  }
  if (totalLen === 0) throw new Error("Length check failed");
  result.close();
});

// Empty and null strings
Deno.bench("String: empty (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT '' FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let emptyCount = 0;
  for (const row of rows) {
    if ((row[0] as string).length === 0) emptyCount++;
  }
  if (emptyCount === 0) throw new Error("Empty check failed");
  result.close();
});

Deno.bench("String: NULL (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT NULL FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let nullCount = 0;
  for (const row of rows) {
    if (row[0] === null) nullCount++;
  }
  if (nullCount !== ROW_COUNT) throw new Error("Null check failed");
  result.close();
});

Deno.bench("String: mixed NULL and non-NULL (100K rows, 50% NULL)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT CASE WHEN i % 2 = 0 THEN NULL ELSE 'value_' || i END FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let nullCount = 0;
  let totalLen = 0;
  for (const row of rows) {
    if (row[0] === null) {
      nullCount++;
    } else {
      totalLen += (row[0] as string).length;
    }
  }
  if (nullCount === 0) throw new Error("Null check failed");
  result.close();
});

// String operations
Deno.bench("String: concatenation (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT 'prefix_' || i::VARCHAR || '_suffix' FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalLen = 0;
  for (const row of rows) {
    totalLen += (row[0] as string).length;
  }
  if (totalLen === 0) throw new Error("Length check failed");
  result.close();
});

addEventListener("unload", () => {
  try {
    functional.closeConnection(connHandle);
  } catch {
    // ignore
  }
  try {
    functional.closeDatabase(dbHandle);
  } catch {
    // ignore
  }
});
