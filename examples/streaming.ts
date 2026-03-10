/**
 * Example: Streaming & Lazy Iteration
 *
 * Demonstrates how to iterate over large query results without loading
 * everything into memory.
 */

import {
  closeConnection,
  closeDatabase,
  create,
  destroyResult,
  execute,
  open,
  stream,
} from "@ggpwnkthx/duckdb/functional";

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("=== Functional API: Lazy Stream ===\n");

// Functional API with lazy stream
const db1 = await open();
const conn1 = await create(db1);

// Create and populate a larger table
await execute(
  conn1,
  "CREATE TABLE numbers AS SELECT * FROM range(1000000) t(i)",
);
console.log("Created table with 1,000,000 rows\n");

// Stream rows lazily - processes one at a time without loading all into memory
console.log("Summing first 100 even numbers (lazy stream):");
let count = 0;
let sum = 0n;
for await (
  const row of stream(conn1, "SELECT i FROM numbers WHERE i % 2 = 0 LIMIT 100")
) {
  sum += row[0] as bigint;
  count++;
}
console.log(`  Counted ${count} rows, sum = ${sum}`);

destroyResult(execute(conn1, "SELECT 1")); // Dummy to clean up stream
closeConnection(conn1);
closeDatabase(db1);

console.log("\n=== Objective API: Lazy Stream ===\n");

// Objective API with generator-based streaming
const db2 = new Database();
await db2.open();
const conn2 = await db2.connect();

conn2.query("CREATE TABLE numbers AS SELECT * FROM range(1000000) t(i)");
console.log("Created table with 1,000,000 rows\n");

// Use stream() generator method
console.log("Summing first 100 even numbers (generator stream):");
count = 0;
sum = 0n;
for (
  const row of conn2.stream("SELECT i FROM numbers WHERE i % 2 = 0 LIMIT 100")
) {
  sum += row[0] as bigint;
  count++;
}
console.log(`  Counted ${count} rows, sum = ${sum}`);

conn2.close();
db2.close();

console.log("\n=== Objective API: queryAll ===\n");

// Alternative: Use queryAll for simpler cases
const db3 = new Database();
await db3.open();
const conn3 = await db3.connect();

const rows = conn3.queryAll("SELECT i, i * 2 as doubled FROM range(10) t(i)");
console.log("All rows at once:");
for (const row of rows) {
  console.log(`  ${row[0]} * 2 = ${row[1]}`);
}

conn3.close();
db3.close();

console.log("\nAll done!");
