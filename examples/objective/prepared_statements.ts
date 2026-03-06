/**
 * Prepared Statements Example - Objective API
 *
 * This example demonstrates using prepared statements with parameter binding.
 */

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("=== Prepared Statements Example (Objective API) ===\n");

const db = new Database();
await db.open();
const conn = await db.connect();

// Prepare statement without parameters
console.log("--- Simple prepared statement ---");
const simpleStmt = conn.prepare("SELECT 1 as num");
const simpleResult = await simpleStmt.execute();
const simpleRows = await simpleResult.fetchAll();
console.log("Result:", simpleRows);
await simpleResult.close();
await simpleStmt.close();

// Prepare with parameter binding ($1, $2, etc.)
console.log("\n--- Prepared statement with parameters ---");
const paramStmt = conn.prepare(
  "SELECT * FROM (VALUES (1, 'Alice', 100.50), (2, 'Bob', 200.75), (3, 'Charlie', 150.00)) AS t(id, name, amount) WHERE id > $1",
);

// Bind parameter $1 = 1
await paramStmt.bind([1]);
const paramResult = await paramStmt.execute();
const paramRows = await paramResult.fetchAll();
console.log("Users with id > 1:");
for (const row of paramRows) {
  console.log(`  id: ${row[0]}, name: ${row[1]}, amount: ${row[2]}`);
}
await paramResult.close();
await paramStmt.close();

// Multiple parameter binding
console.log("\n--- Multiple parameter binding ---");
const multiParamStmt = conn.prepare(
  "SELECT * FROM (VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')) AS t(id, name) WHERE id BETWEEN $1 AND $2",
);

// Bind $1 = 1, $2 = 2
await multiParamStmt.bind([1, 2]);
const multiResult = await multiParamStmt.execute();
const multiRows = await multiResult.fetchAll();
console.log("Users with id between 1 and 2:");
for (const row of multiRows) {
  console.log(`  id: ${row[0]}, name: ${row[1]}`);
}
await multiResult.close();
await multiParamStmt.close();

// Clean up
conn.close();
db.close();

console.log("\n=== Example Complete ===");
