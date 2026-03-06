/**
 * Objective API - PreparedStatement class tests
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { Database } from "../../src/objective/mod.ts";

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
  name: "execute: returns QueryResult for SELECT",
  async fn() {
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
  },
});

Deno.test({
  name: "execute: for query with filter",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = conn.prepare("SELECT * FROM prep_test WHERE id = 1");

    const result = await stmt.execute();

    assertExists(result);
    assertEquals(result.isSuccess(), true);
    assertEquals(result.rowCount(), 1n);

    result.close();
    stmt.close();
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "columnCount: returns column count for SELECT",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = conn.prepare("SELECT id, name FROM prep_test");

    assertEquals(await stmt.columnCount(), 2n);

    stmt.close();
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "columnCount: returns column count for INSERT",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = conn.prepare("INSERT INTO prep_test VALUES (4, 'four')");

    // INSERT returns the number of rows affected
    assertEquals(await stmt.columnCount(), 1n);

    stmt.close();
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "close: frees the statement",
  async fn() {
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
  },
});

Deno.test({
  name: "close: is idempotent",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = conn.prepare("SELECT * FROM prep_test");

    stmt.close();
    stmt.close(); // Should not throw

    conn.close();
    db.close();
  },
});

Deno.test({
  name: "execute: throws when statement is closed",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = conn.prepare("SELECT * FROM prep_test");
    stmt.close();

    try {
      await stmt.execute();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Prepared statement is closed");
    }

    conn.close();
    db.close();
  },
});

Deno.test({
  name: "columnCount: throws when statement is closed",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = conn.prepare("SELECT * FROM prep_test");
    stmt.close();

    try {
      await stmt.columnCount();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Prepared statement is closed");
    }

    conn.close();
    db.close();
  },
});

Deno.test({
  name: "prepare: with unbound parameter placeholder",
  async fn() {
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
  },
});

Deno.test({
  name: "prepare: creates statement that can be executed multiple times",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = conn.prepare("SELECT * FROM prep_test WHERE id = 1");

    // Execute twice
    const result1 = await stmt.execute();
    assertEquals(result1.isSuccess(), true);
    assertEquals(await result1.rowCount(), 1n);
    await result1.close();

    const result2 = await stmt.execute();
    assertEquals(result2.isSuccess(), true);
    assertEquals(await result2.rowCount(), 1n);
    await result2.close();

    stmt.close();
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "prepare: handles JOIN query",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    // Create another table for join
    const createResult = conn.query(
      "CREATE TABLE prep_join (id INTEGER, value TEXT)",
    );
    createResult.close();

    const insertResult = conn.query(
      "INSERT INTO prep_join VALUES (1, 'a'), (2, 'b')",
    );
    insertResult.close();

    const stmt = conn.prepare(
      "SELECT p.id, p.name, j.value FROM prep_test p JOIN prep_join j ON p.id = j.id",
    );

    assertExists(stmt);

    const result = await stmt.execute();
    assertEquals(result.isSuccess(), true);

    result.close();
    stmt.close();
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "execute: handles empty result",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = conn.prepare("SELECT * FROM prep_test WHERE id = 999");

    const result = await stmt.execute();

    assertExists(result);
    assertEquals(result.isSuccess(), true);
    assertEquals(result.rowCount(), 0n);

    result.close();
    stmt.close();
    conn.close();
    db.close();
  },
});
