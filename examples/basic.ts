/**
 * Example: Basic Usage
 *
 * This example demonstrates the functional API for DuckDB with name-based column access.
 */

import {
  closeConnection,
  closeDatabase,
  create,
  destroyResult,
  fetchAll,
  open,
  query,
} from "@ggpwnkthx/duckdb/functional";
import { asRow } from "@ggpwnkthx/duckdb";

console.log("=== Functional API ===\n");

// Functional API: Pure functions with explicit state management
console.log("Opening database...");
const db = await open();
console.log("Database opened");

const conn = await create(db);
console.log("Connection created");

const resultHandle = query(
  conn,
  "SELECT i, i * 2 as doubled FROM range(5) t(i)",
);
console.log("Query executed");

const rows = fetchAll(resultHandle);
console.log(`Result: ${rows.length} rows`);

console.log("\nResults:");
for (const row of rows) {
  const r = asRow<{ i: number; doubled: number }>(row);
  console.log(`  ${r.i} * 2 = ${r.doubled}`);
}

// Clean up - must manually destroy handles
destroyResult(resultHandle);
closeConnection(conn);
closeDatabase(db);

console.log("All resources cleaned up\n");

console.log("All done!");
