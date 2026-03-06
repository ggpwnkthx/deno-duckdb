/**
 * Auto-cleanup with using (Symbol.dispose) - Objective API
 *
 * This example demonstrates automatic resource cleanup using the `using`
 * keyword and Symbol.dispose. This eliminates the need for manual .close()
 * calls and ensures resources are properly cleaned up even when errors occur.
 */

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("=== Auto-cleanup Example (Objective API) ===\n");

// Demonstrate using Symbol.dispose for automatic cleanup
console.log("--- Manual cleanup pattern (traditional) ---");

{
  // Traditional approach: manual cleanup
  const db = new Database();
  await db.open();
  const conn = await db.connect();

  const result = conn.query("SELECT 1 as num");
  const rows = result.fetchAll();
  console.log("Result:", rows[0]);

  // Must remember to close in reverse order
  result.close();
  conn.close();
  db.close();
}
console.log("Manual cleanup complete\n");

// Using the using keyword (Deno 2.x feature)
console.log("--- Using auto-cleanup pattern with 'using' ---");

// Note: This uses the Symbol.dispose pattern which Deno 2.x supports
// The `using` keyword is available in Deno 2.0+
// For older Deno versions, resources are automatically cleaned when they go out of scope
// if they implement Symbol.dispose

{
  // Create resources
  const db = new Database();
  await db.open();

  const conn = await db.connect();

  // The using keyword automatically calls Symbol.dispose when the scope ends
  // This works with any object that implements Symbol.dispose
  using _dbCleanup = db;
  using _connCleanup = conn;

  const result = conn.query("SELECT 1 as num");
  using _resultCleanup = result;

  const rows = result.fetchAll();
  console.log("Result:", rows[0]);
}
console.log("Auto-cleanup complete (resources disposed automatically)\n");

// Demonstrate with proper using declarations (Deno 2.x syntax)
console.log("--- Demonstrating proper 'using' pattern ---");

async function queryWithCleanup() {
  using db = new Database();
  await db.open();

  using conn = await db.connect();

  using result = conn.query("SELECT 'Hello, World!' as greeting");

  const rows = result.fetchAll();
  return rows[0];
}

const greeting = await queryWithCleanup();
console.log("Greeting:", greeting);
console.log("Resources cleaned up automatically\n");

// Demonstrate error handling with using
console.log("--- Error handling with auto-cleanup ---");

async function queryWithErrorHandling() {
  try {
    using db = new Database();
    await db.open();

    using conn = await db.connect();

    // This will succeed
    using result1 = conn.query("SELECT 1 as success");
    const rows1 = result1.fetchAll();
    console.log("Query succeeded:", rows1[0]);

    // This query has invalid syntax - will throw
    using _result2 = conn.query("SELECT * FROM nonexistent_table");

    // This won't execute due to error
    console.log("This should not print");
  } catch (error) {
    // Even with an error, the using statements ensure cleanup
    console.log(
      "Error caught (resources already cleaned up):",
      (error as Error).message,
    );
  }
}

await queryWithErrorHandling();
console.log(
  "\n--- Using pattern ensures cleanup on both success and error ---",
);

// Contrast with manual cleanup in error scenarios
console.log("\n--- Manual cleanup in error scenarios (error-prone) ---");

async function manualCleanupWithError() {
  const db = new Database();
  await db.open();

  try {
    const conn = await db.connect();

    try {
      const result = conn.query("SELECT * FROM invalid_query");

      try {
        const _rows = result.fetchAll();
        result.close(); // This might not run if error occurs earlier
      } catch (e) {
        result.close(); // Need to remember cleanup
        throw e;
      }

      result.close();
    } catch (e) {
      conn.close(); // Must remember cleanup
      throw e;
    }

    conn.close();
  } catch (error) {
    console.log("Error:", (error as Error).message);
  } finally {
    // Must not forget this!
    db.close();
  }
}

await manualCleanupWithError();
console.log(
  "Manual cleanup complete (but error-prone - easy to forget cleanup)\n",
);

// Summary
console.log("=== Summary ===");
console.log("The 'using' keyword with Symbol.dispose:");
console.log("  - Automatically calls .close() when scope ends");
console.log("  - Works even when exceptions are thrown");
console.log("  - Eliminates need for nested try/finally blocks");
console.log("  - Makes code cleaner and less error-prone");
console.log("\n=== Example Complete ===");
