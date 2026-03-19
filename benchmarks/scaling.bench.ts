/**
 * Benchmark scaling behavior.
 *
 * Tests:
 * - Small (100), medium (10K), large (100K), very large (1M) rows
 * - Narrow (1 col) vs wide (100 cols) results
 */

import * as functional from "@ggpwnkthx/duckdb/functional";

const ROW_SIZES = [100, 10_000, 100_000, 1_000_000];

function asBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  throw new TypeError("Invalid value");
}

function checksumRows(rows: Array<Array<unknown>>): bigint {
  let checksum = 0n;
  for (let i = 0; i < rows.length; i++) {
    checksum += asBigInt(rows[i][0]);
  }
  return checksum;
}

// Pre-setup
const dbHandle = await functional.open();
const connHandle = await functional.connectToDatabase(dbHandle);

// Vary row count
for (const rowCount of ROW_SIZES) {
  Deno.bench(`Scaling: ${rowCount.toLocaleString()} rows (1 col)`, () => {
    const result = functional.executeSqlResult(
      connHandle,
      `SELECT i FROM generate_series(1, ${rowCount}) s(i)`,
    );
    if (!result) throw new Error("Query failed");
    const rows = result.toArray();
    const sum = checksumRows(rows);
    if (sum === undefined) throw new Error("Checksum failed");
    result.close();
  });
}

// Wide results (many columns)
Deno.bench("Scaling: 10K rows, 10 columns", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT ${
      Array.from({ length: 10 }, (_, i) => `i as col${i}`).join(", ")
    } FROM generate_series(1, 10000) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let sum = 0n;
  for (const row of rows) {
    for (const cell of row) {
      sum += asBigInt(cell);
    }
  }
  result.close();
});

Deno.bench("Scaling: 10K rows, 50 columns", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT ${
      Array.from({ length: 50 }, (_, i) => `i as col${i}`).join(", ")
    } FROM generate_series(1, 10000) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let sum = 0n;
  for (const row of rows) {
    for (const cell of row) {
      sum += asBigInt(cell);
    }
  }
  result.close();
});

Deno.bench("Scaling: 10K rows, 100 columns", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT ${
      Array.from({ length: 100 }, (_, i) => `i as col${i}`).join(", ")
    } FROM generate_series(1, 10000) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let sum = 0n;
  for (const row of rows) {
    for (const cell of row) {
      sum += asBigInt(cell);
    }
  }
  result.close();
});

// Execution-only tests (no decode)
for (const rowCount of ROW_SIZES) {
  Deno.bench(`Scaling: ${rowCount.toLocaleString()} rows (execution only)`, () => {
    const result = functional.executeSqlResult(
      connHandle,
      `SELECT i FROM generate_series(1, ${rowCount}) s(i)`,
    );
    if (!result) throw new Error("Query failed");
    const count = result.rowCount;
    if (count !== BigInt(rowCount)) throw new Error("Count mismatch");
    result.close();
  });
}

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
