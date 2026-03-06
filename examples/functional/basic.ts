/**
 * Example 1: Using the Functional API
 *
 * This example demonstrates the functional API for DuckDB.
 * Uses pure functions with explicit state passing.
 */

import {
  closeConnection,
  closeDatabase,
  create,
  destroyResult,
  execute,
  fetchAll,
  open,
} from "@ggpwnkthx/duckdb/functional";

console.log("Opening database...");

// Open database
const db = await open();
console.log("Database opened");

// Create connection
const conn = await create(db);
console.log("Connection created");

// Execute query
const resultHandle = execute(
  conn,
  "SELECT i, i * 2 as doubled FROM range(5) t(i)",
);
console.log("Query executed");

// Fetch all rows
const rows = await fetchAll(resultHandle);
console.log(`Result: ${rows.length} rows`);

// Print results
console.log("\nResults:");
for (const row of rows) {
  console.log(`  ${row[0]} * 2 = ${row[1]}`);
}

// Clean up - must manually destroy handles
destroyResult(resultHandle);
closeConnection(conn);
closeDatabase(db);

console.log("\nAll resources cleaned up");
