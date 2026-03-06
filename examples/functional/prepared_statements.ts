/**
 * Prepared Statements Example - Functional API
 *
 * This example demonstrates using prepared statements with parameter binding.
 */

import {
  bind,
  closeConnection,
  closeDatabase,
  create,
  destroyPrepared,
  destroyResult,
  executePrepared,
  fetchAll,
  open,
  prepare,
} from "@ggpwnkthx/duckdb/functional";

console.log("=== Prepared Statements Example (Functional API) ===\n");

const db = await open();
const conn = await create(db);

// Prepare statement without parameters
console.log("--- Simple prepared statement ---");
const simpleStmt = prepare(conn, "SELECT 1 as num");
const simpleResult = executePrepared(simpleStmt);
const simpleRows = await fetchAll(simpleResult);
console.log("Result:", simpleRows);
destroyResult(simpleResult);
destroyPrepared(simpleStmt);

// Prepare with parameter binding ($1, $2, etc.)
console.log("\n--- Prepared statement with parameters ---");
const paramStmt = prepare(
  conn,
  "SELECT * FROM (VALUES (1, 'Alice', 100.50), (2, 'Bob', 200.75), (3, 'Charlie', 150.00)) AS t(id, name, amount) WHERE id > $1",
);

// Bind parameter $1 = 1
await bind(paramStmt, [1]);
const paramResult = executePrepared(paramStmt);
const paramRows = await fetchAll(paramResult);
console.log("Users with id > 1:");
for (const row of paramRows) {
  console.log(`  id: ${row[0]}, name: ${row[1]}, amount: ${row[2]}`);
}
destroyResult(paramResult);
destroyPrepared(paramStmt);

// Multiple parameter binding
console.log("\n--- Multiple parameter binding ---");
const multiParamStmt = prepare(
  conn,
  "SELECT * FROM (VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')) AS t(id, name) WHERE id BETWEEN $1 AND $2",
);

// Bind $1 = 1, $2 = 2
await bind(multiParamStmt, [1, 2]);
const multiResult = executePrepared(multiParamStmt);
const multiRows = await fetchAll(multiResult);
console.log("Users with id between 1 and 2:");
for (const row of multiRows) {
  console.log(`  id: ${row[0]}, name: ${row[1]}`);
}
destroyResult(multiResult);
destroyPrepared(multiParamStmt);

// Clean up
closeConnection(conn);
closeDatabase(db);

console.log("\n=== Example Complete ===");
