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
    await db.close();
  },
});

// Helper to set up a fresh database with test data for each test
async function setupTestDb(): Promise<Database> {
  const db = new Database();
  await db.open();

  const conn = await db.connect();
  const createResult = await conn.query(
    "CREATE TABLE prep_test (id INTEGER, name TEXT)",
  );
  await createResult.close();

  const insertResult = await conn.query(
    "INSERT INTO prep_test VALUES (1, 'one'), (2, 'two'), (3, 'three')",
  );
  await insertResult.close();

  await conn.close();
  return db;
}

Deno.test({
  name: "execute: returns QueryResult for SELECT",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test ORDER BY id");

    const result = await stmt.execute();

    assertExists(result);
    assertEquals(result.isSuccess(), true);
    assertEquals(await result.rowCount(), 3n);

    await result.close();
    await stmt.close();
    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "execute: for query with filter",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test WHERE id = 1");

    const result = await stmt.execute();

    assertExists(result);
    assertEquals(result.isSuccess(), true);
    assertEquals(await result.rowCount(), 1n);

    await result.close();
    await stmt.close();
    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "columnCount: returns column count for SELECT",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT id, name FROM prep_test");

    assertEquals(await stmt.columnCount(), 2n);

    await stmt.close();
    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "columnCount: returns column count for INSERT",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("INSERT INTO prep_test VALUES (4, 'four')");

    // INSERT returns the number of rows affected
    assertEquals(await stmt.columnCount(), 1n);

    await stmt.close();
    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "close: frees the statement",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test");

    await stmt.close();

    // After close, operations should throw
    try {
      await stmt.execute();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Prepared statement is closed");
    }

    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "close: is idempotent",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test");

    await stmt.close();
    await stmt.close(); // Should not throw

    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "execute: throws when statement is closed",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test");
    await stmt.close();

    try {
      await stmt.execute();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Prepared statement is closed");
    }

    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "columnCount: throws when statement is closed",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test");
    await stmt.close();

    try {
      await stmt.columnCount();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Prepared statement is closed");
    }

    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "prepare: with unbound parameter placeholder",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();

    // Note: Prepared statements with unbound parameters will fail at execute time
    // This tests that the prepare itself succeeds but the execute will throw
    const stmt = await conn.prepare("SELECT * FROM prep_test WHERE id = ?");
    assertExists(stmt);

    // Should throw because parameter is not bound
    await assertRejects(
      async () => await stmt.execute(),
      Error,
      "Values were not provided",
    );

    await stmt.close();
    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "prepare: creates statement that can be executed multiple times",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test WHERE id = 1");

    // Execute twice
    const result1 = await stmt.execute();
    assertEquals(result1.isSuccess(), true);
    assertEquals(await result1.rowCount(), 1n);
    await result1.close();

    const result2 = await stmt.execute();
    assertEquals(result2.isSuccess(), true);
    assertEquals(await result2.rowCount(), 1n);
    await result2.close();

    await stmt.close();
    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "prepare: handles JOIN query",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    // Create another table for join
    const createResult = await conn.query(
      "CREATE TABLE prep_join (id INTEGER, value TEXT)",
    );
    await createResult.close();

    const insertResult = await conn.query(
      "INSERT INTO prep_join VALUES (1, 'a'), (2, 'b')",
    );
    await insertResult.close();

    const stmt = await conn.prepare(
      "SELECT p.id, p.name, j.value FROM prep_test p JOIN prep_join j ON p.id = j.id",
    );

    assertExists(stmt);

    const result = await stmt.execute();
    assertEquals(result.isSuccess(), true);

    await result.close();
    await stmt.close();
    await conn.close();
    await db.close();
  },
});

Deno.test({
  name: "execute: handles empty result",
  async fn() {
    const db = await setupTestDb();
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test WHERE id = 999");

    const result = await stmt.execute();

    assertExists(result);
    assertEquals(result.isSuccess(), true);
    assertEquals(await result.rowCount(), 0n);

    await result.close();
    await stmt.close();
    await conn.close();
    await db.close();
  },
});
