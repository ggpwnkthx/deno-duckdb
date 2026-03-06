/**
 * Example: Opening an Existing DuckDB Database (Objective API)
 *
 * This example demonstrates how to open an existing DuckDB database file
 * using the object-oriented API with automatic resource management.
 */

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("Opening existing database...");

// Create database with path to existing file
// The path parameter specifies the database file to open
// If the file doesn't exist, DuckDB will create a new one
const db = new Database({ path: "./examples/shared/example.db" });
await db.open();
console.log("Database opened");

// Create connection
const conn = await db.connect();
console.log("Connection created");

// Execute query - read from the existing database
const result = conn.query(
  "SELECT * FROM test ORDER BY i",
);
console.log("Query executed");

// Fetch all rows
const rows = result.fetchAll();
console.log(`Result: ${rows.length} rows`);

// Print results
console.log("\nResults:");
for (const row of rows) {
  console.log(`  i = ${row[0]}`);
}

// Clean up - manually close in reverse order
result.close();
conn.close();
db.close();

console.log("\nAll resources cleaned up");
