/**
 * Objective API - Database class tests
 */

import { assertEquals, assertExists } from "@std/assert";
import { Database } from "@ggpwnkthx/duckdb/objective";

// Warm-up test to trigger library loading once for all tests
Deno.test({
  name: "warmup: load library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = new Database();
    await db.open();
    db.close();
  },
});

Deno.test({
  name: "database: manage database lifecycle",
  async fn(t) {
    // Step 1: database lifecycle
    await t.step({
      name: "database lifecycle",
      async fn() {
        // Opens database successfully
        const db = new Database();
        await db.open();
        assertEquals(db.isClosed(), false);
        db.close();

        // Defaults to in-memory database when no path provided
        const testDb = new Database();
        await testDb.open();
        const conn = await testDb.connect();
        const result = conn.query("SELECT 'hello' as msg");
        assertEquals(result.isSuccess(), true);
        const rows = result.fetchAll();
        assertEquals(rows[0][0], "hello");
        result.close();
        conn.close();
        testDb.close();

        // Creates a new Connection
        const db2 = new Database();
        await db2.open();
        const conn2 = await db2.connect();
        assertExists(conn2);
        assertEquals(conn2.isClosed(), false);
        conn2.close();
        db2.close();
      },
    });

    // Step 2: multiple connections
    await t.step({
      name: "multiple connections",
      async fn() {
        // Multiple connections work independently
        const db = new Database();
        await db.open();
        const conn1 = await db.connect();
        const conn2 = await db.connect();
        assertEquals(conn1.isClosed(), false);
        assertEquals(conn2.isClosed(), false);
        // Both should work independently
        const result1 = conn1.query("SELECT 1 as val");
        assertEquals(result1.isSuccess(), true);
        result1.close();
        const result2 = conn2.query("SELECT 2 as val");
        assertEquals(result2.isSuccess(), true);
        result2.close();
        conn1.close();
        conn2.close();
        db.close();
      },
    });

    // Step 3: error handling
    await t.step({
      name: "error handling",
      async fn() {
        // Throws when database is closed
        const testDb = new Database();
        await testDb.open();
        testDb.close();
        try {
          await testDb.connect();
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Database is closed");
        }

        // Can execute queries after connect
        const db = new Database();
        await db.open();
        const conn = await db.connect();
        const result = conn.query("SELECT 42 as answer");
        assertEquals(result.isSuccess(), true);
        assertEquals(result.rowCount(), 1n);
        result.close();
        conn.close();
        db.close();
      },
    });

    // Step 4: Symbol.dispose
    await t.step({
      name: "Symbol.dispose",
      async fn() {
        // Database with Symbol.dispose
        {
          using db = new Database();
          await db.open();
          const conn = await db.connect();
          const result = conn.query("SELECT 1 as val");
          assertEquals(result.isSuccess(), true);
          result.close();
          conn.close();
          // db.close() called automatically by Symbol.dispose
        }

        // Connection with Symbol.dispose
        {
          const db = new Database();
          await db.open();
          using conn = await db.connect();
          const result = conn.query("SELECT 2 as val");
          assertEquals(result.isSuccess(), true);
          result.close();
          // conn.close() called automatically by Symbol.dispose
          db.close();
        }

        // QueryResult with Symbol.dispose
        {
          const db = new Database();
          await db.open();
          const conn = await db.connect();
          using result = conn.query("SELECT 3 as val");
          assertEquals(result.isSuccess(), true);
          assertEquals(result.rowCount(), 1n);
          // result.close() called automatically by Symbol.dispose
          conn.close();
          db.close();
        }

        // Combined Symbol.dispose usage
        {
          using db = new Database();
          await db.open();
          using conn = await db.connect();
          using result = conn.query("SELECT 4 as val");
          assertEquals(result.isSuccess(), true);
          // All resources cleaned up automatically
        }
      },
    });
  },
});
