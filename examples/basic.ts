/**
 * Example: Basic Usage
 *
 * This example demonstrates both APIs for DuckDB side-by-side.
 * Choose the style that best fits your project.
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

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("=== Functional API ===\n");

// Functional API: Pure functions with explicit state management
console.log("Opening database...");
const db = await open();
console.log("Database opened");

const conn = await create(db);
console.log("Connection created");

const resultHandle = execute(
  conn,
  "SELECT i, i * 2 as doubled FROM range(5) t(i)",
);
console.log("Query executed");

const rows = fetchAll(resultHandle);
console.log(`Result: ${rows.length} rows`);

console.log("\nResults:");
for (const row of rows) {
  console.log(`  ${row[0]} * 2 = ${row[1]}`);
}

// Clean up - must manually destroy handles
destroyResult(resultHandle);
closeConnection(conn);
closeDatabase(db);

console.log("All resources cleaned up\n");

console.log("=== Objective API ===\n");

// Objective API: Classes with automatic resource management
console.log("Opening database...");
const db2 = new Database();
await db2.open();
console.log("Database opened");

const conn2 = await db2.connect();
console.log("Connection created");

const result = conn2.query(
  "SELECT i, i * 2 as doubled FROM range(5) t(i)",
);
console.log("Query executed");

const rows2 = result.fetchAll();
console.log(`Result: ${rows2.length} rows`);

console.log("\nResults:");
for (const row of rows2) {
  console.log(`  ${row[0]} * 2 = ${row[1]}`);
}

// Clean up - manually close in reverse order
result.close();
conn2.close();
db2.close();

console.log("All resources cleaned up\n");

console.log("=== Objective API with Symbol.dispose ===\n");

// Alternative: Use Symbol.dispose for automatic cleanup
{
  using db3 = new Database();
  await db3.open();
  using conn3 = await db3.connect();
  const result3 = conn3.query("SELECT i, i * 2 FROM range(3) t(i)");
  const rows3 = result3.fetchAll();

  console.log("Results (auto-cleanup at end of scope):");
  for (const row of rows3) {
    console.log(`  ${row[0]} * 2 = ${row[1]}`);
  }
}

console.log("\nAll done!");
