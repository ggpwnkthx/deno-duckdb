/**
 * Example: Arrow API for Memory-Efficient Processing
 *
 * Demonstrates how to use DuckDB's Arrow streaming API for memory-efficient
 * processing of large result sets without loading everything into memory.
 */

import {
  arrowColumnCount,
  arrowRowCount,
  closeConnection,
  closeDatabase,
  create,
  destroyArrow,
  execute,
  open,
  queryArrow,
} from "@ggpwnkthx/duckdb/functional";

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("=== Functional API: Arrow Streaming ===\n");

// Functional API with Arrow
const db1 = await open();
const conn1 = await create(db1);

// Create and populate a table
execute(
  conn1,
  "CREATE TABLE numbers AS SELECT * FROM range(1000000) t(i)",
);
console.log("Created table with 1,000,000 rows\n");

// Execute query via Arrow - returns a handle for streaming
const sql = "SELECT i FROM numbers WHERE i % 2 = 0 LIMIT 100";
const arrowHandle = queryArrow(conn1, sql);

// Get metadata about the result
const rowCount = Number(arrowRowCount(arrowHandle));
const colCount = Number(arrowColumnCount(arrowHandle));

console.log(`Query: ${sql}`);
console.log(`Row count: ${rowCount}`);
console.log(`Column count: ${colCount}`);

// Note: Full Arrow data processing requires additional FFI calls to fetch
// the actual column data. For typical use cases, consider using queryAll() or
// fetchAll() which provide a simpler interface.

// Clean up Arrow resources
destroyArrow(arrowHandle);

closeConnection(conn1);
closeDatabase(db1);

console.log("=== Objective API: Query Methods ===\n");

// Alternative: Use queryAll for simpler cases
const db2 = new Database();
await db2.open();
const conn2 = await db2.connect();

const rows = conn2.queryAll("SELECT i, i * 2 as doubled FROM range(10) t(i)");
console.log("All rows at once (queryAll):");
for (const row of rows) {
  console.log(`  ${row[0]} * 2 = ${row[1]}`);
}

conn2.close();
db2.close();

console.log("\nAll done!");
