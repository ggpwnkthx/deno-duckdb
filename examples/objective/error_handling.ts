/**
 * Error Handling Example - Objective API
 *
 * This example demonstrates proper error handling with the objective API,
 * including QueryError and proper resource cleanup in catch blocks.
 */

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("=== Error Handling Example (Objective API) ===\n");

// Create and open database
const db = new Database();
await db.open();
console.log("Database opened");

// Create connection
const conn = await db.connect();
console.log("Connection created");

// Demonstrate QueryError handling
console.log("\n--- Handling QueryError ---");

try {
  // Create a prepared statement with invalid table
  const stmt = conn.prepare("SELECT * FROM nonexistent_table");
  const result = stmt.execute();
  result.close();
  stmt.close();
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
    const stmt = conn.prepare(errorQueries[i]);
    const result = stmt.execute();
    result.close();
    stmt.close();
  } catch (error) {
    console.log(`Error ${i + 1}:`, (error as Error).message.split("\n")[0]);
  }
}

console.log("\n--- Using error.name for type checking ---");

try {
  const stmt = conn.prepare("SELECT * FROM does_not_exist");
  const result = stmt.execute();
  result.close();
  stmt.close();
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

function executeWithCleanup(sql: string): void {
  let stmt = null;
  let result = null;

  try {
    stmt = conn.prepare(sql);
    result = stmt.execute();
    console.log("Query executed successfully");
  } catch (error) {
    console.log("Error occurred:", (error as Error).message.split("\n")[0]);
  } finally {
    // Always clean up
    if (result) {
      result.close();
    }
    if (stmt) {
      stmt.close();
    }
    console.log("Cleanup completed");
  }
}

executeWithCleanup("SELECT 1 as num");
executeWithCleanup("SELECT * FROM invalid_table");

// Clean up connection and database
conn.close();
db.close();

console.log("\nAll resources cleaned up");
console.log("\n=== Example Complete ===");
