/**
 * Transaction Example - Objective API
 *
 * This example demonstrates using transactions with BEGIN, COMMIT, and ROLLBACK.
 */

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("=== Transaction Example (Objective API) ===\n");

const db = new Database();
await db.open();
const conn = await db.connect();

// Create a table for testing
console.log("--- Setting up test table ---");
conn.query(
  "CREATE TABLE IF NOT EXISTS accounts (id INTEGER, name VARCHAR, balance DECIMAL)",
);

// Insert initial data
conn.query(
  "INSERT INTO accounts VALUES (1, 'Alice', 1000), (2, 'Bob', 500)",
);

// Show initial balances
const initialResult = conn.query("SELECT * FROM accounts ORDER BY id");
const initialRows = initialResult.fetchAll();
console.log("Initial balances:");
for (const row of initialRows) {
  console.log(`  ${row[1]}: $${row[2]}`);
}
initialResult.close();

// Demonstrate successful transaction
console.log(
  "\n--- Committing a transaction (transfer $200 from Alice to Bob) ---",
);
conn.query("BEGIN TRANSACTION");
conn.query("UPDATE accounts SET balance = balance - 200 WHERE id = 1");
conn.query("UPDATE accounts SET balance = balance + 200 WHERE id = 2");
conn.query("COMMIT");

const afterCommitResult = conn.query(
  "SELECT * FROM accounts ORDER BY id",
);
const afterCommitRows = afterCommitResult.fetchAll();
console.log("After transfer:");
for (const row of afterCommitRows) {
  console.log(`  ${row[1]}: $${row[2]}`);
}
afterCommitResult.close();

// Demonstrate rollback
console.log(
  "\n--- Rolling back a transaction (attempt to transfer $2000 from Alice) ---",
);
conn.query("BEGIN TRANSACTION");
conn.query("UPDATE accounts SET balance = balance - 2000 WHERE id = 1");

// Check balance before rollback
const beforeRollbackResult = conn.query(
  "SELECT balance FROM accounts WHERE id = 1",
);
const beforeRollbackRows = beforeRollbackResult.fetchAll();
console.log(`Alice's balance before rollback: $${beforeRollbackRows[0][0]}`);
beforeRollbackResult.close();

conn.query("ROLLBACK");

const afterRollbackResult = conn.query(
  "SELECT * FROM accounts ORDER BY id",
);
const afterRollbackRows = afterRollbackResult.fetchAll();
console.log("After rollback:");
for (const row of afterRollbackRows) {
  console.log(`  ${row[1]}: $${row[2]}`);
}
afterRollbackResult.close();

// Clean up
conn.close();
db.close();

console.log("\n=== Example Complete ===");
