/**
 * Error Handling Example - Functional API
 *
 * This example demonstrates proper error handling with the functional API,
 * including QueryError and proper resource cleanup in catch blocks.
 */

import {
  closeConnection,
  closeDatabase,
  create,
  destroyPrepared,
  destroyResult,
  executePrepared,
  open,
  prepare,
} from "@ggpwnkthx/duckdb/functional";

console.log("=== Error Handling Example (Functional API) ===\n");

// Open database
const db = await open();
console.log("Database opened");

// Create connection
const conn = await create(db);
console.log("Connection created");

// Demonstrate QueryError handling
console.log("\n--- Handling QueryError ---");

try {
  // Create a prepared statement with invalid table
  const stmt = await prepare(conn, "SELECT * FROM nonexistent_table");
  const result = await executePrepared(stmt);
  await destroyResult(result);
  await destroyPrepared(stmt);
  console.log("This should not print");
} catch (error) {
  const errorMsg = (error as Error).message;
  const errorName = (error as Error).name;
  console.log("Error caught!");
  console.log("  Name:", errorName);
  console.log("  Message:", errorMsg.split("\n")[0]);

  if (errorName === "QueryError") {
    console.log("This is a QueryError - check your SQL syntax");
  }
}

console.log("\n--- Handling multiple errors in sequence ---");

// Test multiple error scenarios
const errorQueries = [
  "SELECT * FROM table_does_not_exist",
  "SELECT * FROM invalid syntax here",
];

for (let i = 0; i < errorQueries.length; i++) {
  try {
    const stmt = await prepare(conn, errorQueries[i]);
    const result = await executePrepared(stmt);
    await destroyResult(result);
    await destroyPrepared(stmt);
  } catch (error) {
    console.log(`Error ${i + 1}:`, (error as Error).message.split("\n")[0]);
  }
}

console.log("\n--- Using error.name for type checking ---");

try {
  const stmt = await prepare(conn, "SELECT * FROM does_not_exist");
  const result = await executePrepared(stmt);
  await destroyResult(result);
  await destroyPrepared(stmt);
} catch (error) {
  const errorName = (error as Error).name;
  const errorMessage = (error as Error).message;
  console.log("Error name:", errorName);
  console.log("Error message:", errorMessage.split("\n")[0]);

  if (errorName === "QueryError") {
    console.log("This is a QueryError - check your SQL syntax");
  } else if (errorName === "DatabaseError") {
    console.log("This is a DatabaseError - check your database state");
  }
}

// Demonstrate proper cleanup in error scenarios
console.log("\n--- Proper cleanup in error scenarios ---");

async function executeWithCleanup(sql: string): Promise<void> {
  let stmt = null;
  let result = null;

  try {
    stmt = await prepare(conn, sql);
    result = await executePrepared(stmt);
    console.log("Query executed successfully");
  } catch (error) {
    console.log("Error occurred:", (error as Error).message.split("\n")[0]);
  } finally {
    // Always clean up
    if (result) {
      await destroyResult(result);
    }
    if (stmt) {
      await destroyPrepared(stmt);
    }
    console.log("Cleanup completed");
  }
}

await executeWithCleanup("SELECT 1 as num");
await executeWithCleanup("SELECT * FROM invalid_table");

// Clean up resources
await closeConnection(conn);
await closeDatabase(db);

console.log("\nAll resources cleaned up");
console.log("\n=== Example Complete ===");
