/**
 * Objective API - PreparedStatement class tests
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { Database } from "../../src/objective/mod.ts";

let db: Database;

Deno.test({
  name: "setup: create database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    db = new Database();
    await db.open();

    // Create test table
    const conn = await db.connect();
    await conn.query("CREATE TABLE prep_test (id INTEGER, name TEXT)");
    await conn.query(
      "INSERT INTO prep_test VALUES (1, 'one'), (2, 'two'), (3, 'three')",
    );
    await conn.close();
  },
});

Deno.test({
  name: "execute: returns QueryResult for SELECT",
  async fn() {
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test ORDER BY id");

    const result = await stmt.execute();

    assertExists(result);
    assertEquals(result.isSuccess(), true);
    assertEquals(await result.rowCount(), 3n);

    await result.close();
    await stmt.close();
    await conn.close();
  },
});

Deno.test({
  name: "execute: for query with filter",
  async fn() {
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test WHERE id = 1");

    const result = await stmt.execute();

    assertExists(result);
    assertEquals(result.isSuccess(), true);
    assertEquals(await result.rowCount(), 1n);

    await result.close();
    await stmt.close();
    await conn.close();
  },
});

Deno.test({
  name: "columnCount: returns column count for SELECT",
  async fn() {
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT id, name FROM prep_test");

    assertEquals(await stmt.columnCount(), 2n);

    await stmt.close();
    await conn.close();
  },
});

Deno.test({
  name: "columnCount: returns column count for INSERT",
  async fn() {
    const conn = await db.connect();
    const stmt = await conn.prepare("INSERT INTO prep_test VALUES (4, 'four')");

    // INSERT returns the number of rows affected
    assertEquals(await stmt.columnCount(), 1n);

    await stmt.close();
    await conn.close();
  },
});

Deno.test({
  name: "close: frees the statement",
  async fn() {
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
  },
});

Deno.test({
  name: "close: is idempotent",
  async fn() {
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test");

    await stmt.close();
    await stmt.close(); // Should not throw

    await conn.close();
  },
});

Deno.test({
  name: "execute: throws when statement is closed",
  async fn() {
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
  },
});

Deno.test({
  name: "columnCount: throws when statement is closed",
  async fn() {
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
  },
});

Deno.test({
  name: "prepare: with unbound parameter placeholder",
  async fn() {
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
  },
});

Deno.test({
  name: "prepare: creates statement that can be executed multiple times",
  async fn() {
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
  },
});

Deno.test({
  name: "prepare: handles JOIN query",
  async fn() {
    const conn = await db.connect();
    // Create another table for join
    await conn.query("CREATE TABLE prep_join (id INTEGER, value TEXT)");
    await conn.query("INSERT INTO prep_join VALUES (1, 'a'), (2, 'b')");

    const stmt = await conn.prepare(
      "SELECT p.id, p.name, j.value FROM prep_test p JOIN prep_join j ON p.id = j.id",
    );

    assertExists(stmt);

    const result = await stmt.execute();
    assertEquals(result.isSuccess(), true);

    await result.close();
    await stmt.close();
    await conn.close();
  },
});

Deno.test({
  name: "execute: handles empty result",
  async fn() {
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT * FROM prep_test WHERE id = 999");

    const result = await stmt.execute();

    assertExists(result);
    assertEquals(result.isSuccess(), true);
    assertEquals(await result.rowCount(), 0n);

    await result.close();
    await stmt.close();
    await conn.close();
  },
});

Deno.test({
  name: "cleanup: close database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    if (db && !db.isClosed()) {
      await db.close();
    }
  },
});
