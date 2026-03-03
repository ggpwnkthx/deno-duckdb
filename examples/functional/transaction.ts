/**
 * Transaction Example - Functional API
 *
 * This example demonstrates using transactions with BEGIN, COMMIT, and ROLLBACK.
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

console.log("=== Transaction Example (Functional API) ===\n");

const db = await open();
const conn = await create(db);

// Create a table for testing
console.log("--- Setting up test table ---");
const setupResult = await execute(
  conn,
  "CREATE TABLE IF NOT EXISTS accounts (id INTEGER, name VARCHAR, balance DECIMAL)",
);
await destroyResult(setupResult);

// Insert initial data
const insertResult = await execute(
  conn,
  "INSERT INTO accounts VALUES (1, 'Alice', 1000), (2, 'Bob', 500)",
);
await destroyResult(insertResult);

// Show initial balances
const initialResult = await execute(conn, "SELECT * FROM accounts ORDER BY id");
const initialRows = await fetchAll(initialResult);
console.log("Initial balances:");
for (const row of initialRows) {
  console.log(`  ${row[1]}: $${row[2]}`);
}
await destroyResult(initialResult);

// Demonstrate successful transaction
console.log(
  "\n--- Committing a transaction (transfer $200 from Alice to Bob) ---",
);
const beginResult1 = await execute(conn, "BEGIN TRANSACTION");
await destroyResult(beginResult1);

const debitResult = await execute(
  conn,
  "UPDATE accounts SET balance = balance - 200 WHERE id = 1",
);
await destroyResult(debitResult);

const creditResult = await execute(
  conn,
  "UPDATE accounts SET balance = balance + 200 WHERE id = 2",
);
await destroyResult(creditResult);

const commitResult = await execute(conn, "COMMIT");
await destroyResult(commitResult);

const afterCommitResult = await execute(
  conn,
  "SELECT * FROM accounts ORDER BY id",
);
const afterCommitRows = await fetchAll(afterCommitResult);
console.log("After transfer:");
for (const row of afterCommitRows) {
  console.log(`  ${row[1]}: $${row[2]}`);
}
await destroyResult(afterCommitResult);

// Demonstrate rollback
console.log(
  "\n--- Rolling back a transaction (attempt to transfer $2000 from Alice) ---",
);
const beginResult2 = await execute(conn, "BEGIN TRANSACTION");
await destroyResult(beginResult2);

const debitResult2 = await execute(
  conn,
  "UPDATE accounts SET balance = balance - 2000 WHERE id = 1",
);
await destroyResult(debitResult2);

// Check balance before rollback
const beforeRollbackResult = await execute(
  conn,
  "SELECT balance FROM accounts WHERE id = 1",
);
const beforeRollbackRows = await fetchAll(beforeRollbackResult);
console.log(`Alice's balance before rollback: $${beforeRollbackRows[0][0]}`);
await destroyResult(beforeRollbackResult);

const rollbackResult = await execute(conn, "ROLLBACK");
await destroyResult(rollbackResult);

const afterRollbackResult = await execute(
  conn,
  "SELECT * FROM accounts ORDER BY id",
);
const afterRollbackRows = await fetchAll(afterRollbackResult);
console.log("After rollback:");
for (const row of afterRollbackRows) {
  console.log(`  ${row[1]}: $${row[2]}`);
}
await destroyResult(afterRollbackResult);

// Clean up
await closeConnection(conn);
await closeDatabase(db);

console.log("\n=== Example Complete ===");
