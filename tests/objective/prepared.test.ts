/**
 * Objective API - PreparedStatement class tests
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
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

// Helper to set up a fresh database with test data for each test
async function setupTestDb(): Promise<Database> {
  const db = new Database();
  await db.open();

  const conn = await db.connect();
  const createResult = conn.query(
    "CREATE TABLE prep_test (id INTEGER, name TEXT)",
  );
  createResult.close();

  const insertResult = conn.query(
    "INSERT INTO prep_test VALUES (1, 'one'), (2, 'two'), (3, 'three')",
  );
  insertResult.close();

  conn.close();
  return db;
}

Deno.test({
  name: "prepared: manage prepared statements",
  async fn(t) {
    // Step 1: execute prepared
    await t.step({
      name: "execute prepared",
      async fn() {
        // Returns QueryResult for SELECT
        const db = await setupTestDb();
        const conn = await db.connect();
        const stmt = conn.prepare("SELECT * FROM prep_test ORDER BY id");

        const result = await stmt.execute();

        assertExists(result);
        assertEquals(result.isSuccess(), true);
        assertEquals(result.rowCount(), 3n);

        result.close();
        stmt.close();
        conn.close();
        db.close();

        // For query with filter
        const db2 = await setupTestDb();
        const conn2 = await db2.connect();
        const stmt2 = conn2.prepare("SELECT * FROM prep_test WHERE id = 1");

        const result2 = await stmt2.execute();

        assertExists(result2);
        assertEquals(result2.isSuccess(), true);
        assertEquals(result2.rowCount(), 1n);

        result2.close();
        stmt2.close();
        conn2.close();
        db2.close();
      },
    });

    // Step 2: column metadata
    await t.step({
      name: "column metadata",
      async fn() {
        // Returns column count for SELECT
        const db = await setupTestDb();
        const conn = await db.connect();
        const stmt = conn.prepare("SELECT id, name FROM prep_test");

        assertEquals(await stmt.columnCount(), 2n);

        stmt.close();
        conn.close();
        db.close();

        // Returns column count for INSERT
        const db2 = await setupTestDb();
        const conn2 = await db2.connect();
        const stmt2 = conn2.prepare("INSERT INTO prep_test VALUES (4, 'four')");

        // INSERT returns the number of rows affected
        assertEquals(await stmt2.columnCount(), 1n);

        stmt2.close();
        conn2.close();
        db2.close();
      },
    });

    // Step 3: resource management
    await t.step({
      name: "resource management",
      async fn() {
        // Frees the statement
        const db = await setupTestDb();
        const conn = await db.connect();
        const stmt = conn.prepare("SELECT * FROM prep_test");

        stmt.close();

        // After close, operations should throw
        try {
          await stmt.execute();
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Prepared statement is closed");
        }

        conn.close();
        db.close();

        // Is idempotent
        const db2 = await setupTestDb();
        const conn2 = await db2.connect();
        const stmt2 = conn2.prepare("SELECT * FROM prep_test");

        stmt2.close();
        stmt2.close(); // Should not throw

        conn2.close();
        db2.close();

        // Throws when statement is closed (execute)
        const db3 = await setupTestDb();
        const conn3 = await db3.connect();
        const stmt3 = conn3.prepare("SELECT * FROM prep_test");
        stmt3.close();

        try {
          await stmt3.execute();
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Prepared statement is closed");
        }

        conn3.close();
        db3.close();

        // Throws when statement is closed (columnCount)
        const db4 = await setupTestDb();
        const conn4 = await db4.connect();
        const stmt4 = conn4.prepare("SELECT * FROM prep_test");
        stmt4.close();

        try {
          await stmt4.columnCount();
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Prepared statement is closed");
        }

        conn4.close();
        db4.close();
      },
    });

    // Step 4: edge cases
    await t.step({
      name: "edge cases",
      async fn() {
        // With unbound parameter placeholder
        const db = await setupTestDb();
        const conn = await db.connect();

        // Note: Prepared statements with unbound parameters will fail at execute time
        // This tests that the prepare itself succeeds but the execute will throw
        const stmt = conn.prepare("SELECT * FROM prep_test WHERE id = ?");
        assertExists(stmt);

        // Should throw because parameter is not bound
        await assertRejects(
          async () => await stmt.execute(),
          Error,
          "Values were not provided",
        );

        stmt.close();
        conn.close();
        db.close();

        // Creates statement that can be executed multiple times
        const db2 = await setupTestDb();
        const conn2 = await db2.connect();
        const stmt2 = conn2.prepare("SELECT * FROM prep_test WHERE id = 1");

        // Execute twice
        const result1 = await stmt2.execute();
        assertEquals(result1.isSuccess(), true);
        assertEquals(await result1.rowCount(), 1n);
        await result1.close();

        const result2 = await stmt2.execute();
        assertEquals(result2.isSuccess(), true);
        assertEquals(await result2.rowCount(), 1n);
        await result2.close();

        stmt2.close();
        conn2.close();
        db2.close();

        // Handles JOIN query
        const db3 = await setupTestDb();
        const conn3 = await db3.connect();
        // Create another table for join
        const createResult = conn3.query(
          "CREATE TABLE prep_join (id INTEGER, value TEXT)",
        );
        createResult.close();

        const insertResult = conn3.query(
          "INSERT INTO prep_join VALUES (1, 'a'), (2, 'b')",
        );
        insertResult.close();

        const stmt3 = conn3.prepare(
          "SELECT p.id, p.name, j.value FROM prep_test p JOIN prep_join j ON p.id = j.id",
        );

        assertExists(stmt3);

        const result3 = await stmt3.execute();
        assertEquals(result3.isSuccess(), true);

        result3.close();
        stmt3.close();
        conn3.close();
        db3.close();

        // Handles empty result
        const db4 = await setupTestDb();
        const conn4 = await db4.connect();
        const stmt4 = conn4.prepare("SELECT * FROM prep_test WHERE id = 999");

        const result4 = await stmt4.execute();

        assertExists(result4);
        assertEquals(result4.isSuccess(), true);
        assertEquals(result4.rowCount(), 0n);

        result4.close();
        stmt4.close();
        conn4.close();
        db4.close();
      },
    });
  },
});
