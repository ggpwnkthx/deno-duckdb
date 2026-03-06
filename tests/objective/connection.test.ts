/**
 * Objective API - Connection class tests
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
  name: "connection: manage connection operations",
  async fn(t) {
    // Step 1: execute queries
    await t.step({
      name: "execute queries",
      async fn() {
        // Executes SELECT query successfully
        const db = new Database();
        await db.open();
        const conn = await db.connect();
        const result = conn.query("SELECT 1 as val");
        assertEquals(result.isSuccess(), true);
        assertEquals(result.rowCount(), 1n);
        result.close();
        conn.close();
        db.close();

        // Executes INSERT query successfully
        const db2 = new Database();
        await db2.open();
        const conn2 = await db2.connect();
        // Create a table and insert data - close result after each
        const createResult = conn2.query(
          "CREATE TABLE test (id INTEGER, name TEXT)",
        );
        createResult.close();
        const insertResult = conn2.query(
          "INSERT INTO test VALUES (1, 'test')",
        );
        assertEquals(insertResult.isSuccess(), true);
        insertResult.close();
        conn2.close();
        db2.close();

        // Returns all rows
        const db3 = new Database();
        await db3.open();
        const conn3 = await db3.connect();
        // Create table and insert data - close results
        const createResult2 = conn3.query("CREATE TABLE test_all (id INTEGER)");
        createResult2.close();
        const insertResult2 = conn3.query(
          "INSERT INTO test_all VALUES (1), (2), (3)",
        );
        insertResult2.close();
        const rows = conn3.queryAll("SELECT * FROM test_all ORDER BY id");
        assertEquals(rows.length, 3);
        assertEquals(rows[0][0], 1);
        assertEquals(rows[1][0], 2);
        assertEquals(rows[2][0], 3);
        conn3.close();
        db3.close();

        // Can execute multiple queries sequentially
        const db4 = new Database();
        await db4.open();
        const conn4 = await db4.connect();
        const r1 = conn4.query("CREATE TABLE multi_test (id INTEGER)");
        r1.close();
        const r2 = conn4.query("INSERT INTO multi_test VALUES (1)");
        r2.close();
        const r3 = conn4.query("INSERT INTO multi_test VALUES (2)");
        r3.close();
        const result4 = conn4.query("SELECT * FROM multi_test ORDER BY id");
        assertEquals(result4.rowCount(), 2n);
        result4.close();
        conn4.close();
        db4.close();
      },
    });

    // Step 2: prepare statements
    await t.step({
      name: "prepare statements",
      async fn() {
        // Creates PreparedStatement
        const db = new Database();
        await db.open();
        const conn = await db.connect();
        const stmt = conn.prepare("SELECT ? as val");
        assertExists(stmt);
        stmt.close();
        conn.close();
        db.close();

        // Returns PreparedStatement for valid SQL
        const db2 = new Database();
        await db2.open();
        const conn2 = await db2.connect();
        const stmt2 = conn2.prepare("SELECT 1 as val");
        // Prepared statement is created even if query returns no results
        assertExists(stmt2);
        stmt2.close();
        conn2.close();
        db2.close();
      },
    });

    // Step 3: error handling
    await t.step({
      name: "error handling",
      async fn() {
        // Throws when connection is closed (query)
        const db = new Database();
        await db.open();
        const conn = await db.connect();
        conn.close();
        try {
          conn.query("SELECT 1");
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Connection is closed");
        }
        db.close();

        // Throws when connection is closed (queryAll)
        const db2 = new Database();
        await db2.open();
        const conn2 = await db2.connect();
        conn2.close();
        try {
          conn2.queryAll("SELECT 1");
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Connection is closed");
        }
        db2.close();

        // Throws when connection is closed (prepare)
        const db3 = new Database();
        await db3.open();
        const conn3 = await db3.connect();
        conn3.close();
        try {
          conn3.prepare("SELECT 1");
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Connection is closed");
        }
        db3.close();

        // Throws when connection is closed (close)
        const db4 = new Database();
        await db4.open();
        const conn4 = await db4.connect();
        conn4.close();
        // Should not throw, close is idempotent
        conn4.close();
        db4.close();
      },
    });
  },
});
