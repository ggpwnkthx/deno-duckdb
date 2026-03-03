/**
 * Example 2: Using the Objective (Object-Oriented) API
 *
 * This example demonstrates the object-oriented API for DuckDB.
 * Uses classes with automatic resource management.
 */

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("Opening database...");

// Create database (in-memory)
const db = new Database();
await db.open();
console.log("Database opened");

// Create connection
const conn = await db.connect();
console.log("Connection created");

// Execute query
const result = await conn.query(
  "SELECT i, i * 2 as doubled FROM range(5) t(i)",
);
console.log("Query executed");

// Fetch all rows
const rows = await result.fetchAll();
console.log(`Result: ${rows.length} rows`);

// Print results
console.log("\nResults:");
for (const row of rows) {
  console.log(`  ${row[0]} * 2 = ${row[1]}`);
}

// Clean up - manually close in reverse order
await result.close();
await conn.close();
await db.close();

console.log("\nAll resources cleaned up");
