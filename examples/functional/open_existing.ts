/**
 * Example: Opening an Existing DuckDB Database (Functional API)
 *
 * This example demonstrates how to open an existing DuckDB database file
 * using the functional API with explicit state passing.
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

console.log("Opening existing database...");

// Open existing database file
// The path parameter specifies the database file to open
// If the file doesn't exist, DuckDB will create a new one
const db = await open({ path: "./examples/shared/example.db" });
console.log("Database opened");

// Create connection
const conn = await create(db);
console.log("Connection created");

// Execute query - read from the existing database
const resultHandle = await execute(
  conn,
  "SELECT * FROM test ORDER BY i",
);
console.log("Query executed");

// Fetch all rows
const rows = await fetchAll(resultHandle);
console.log(`Result: ${rows.length} rows`);

// Print results
console.log("\nResults:");
for (const row of rows) {
  console.log(`  i = ${row[0]}`);
}

// Clean up - must manually destroy handles
await destroyResult(resultHandle);
await closeConnection(conn);
await closeDatabase(db);

console.log("\nAll resources cleaned up");
