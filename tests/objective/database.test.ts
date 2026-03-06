/**
 * Objective API - Database class tests
 */

import { assertEquals, assertExists } from "@std/assert";
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

Deno.test({
  name: "constructor: opens database successfully",
  async fn() {
    const db = new Database();
    await db.open();
    assertEquals(db.isClosed(), false);
    db.close();
  },
});

Deno.test({
  name: "constructor: defaults to in-memory database when no path provided",
  async fn() {
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
  },
});

Deno.test({
  name: "connect: creates a new Connection",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    assertExists(conn);
    assertEquals(conn.isClosed(), false);
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "connect: multiple connections work independently",
  async fn() {
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

Deno.test({
  name: "close: closes the database",
  async fn() {
    const testDb = new Database();
    await testDb.open();
    assertEquals(testDb.isClosed(), false);
    testDb.close();
    assertEquals(testDb.isClosed(), true);
  },
});

Deno.test({
  name: "close: is idempotent",
  async fn() {
    const testDb = new Database();
    await testDb.open();
    testDb.close();
    testDb.close(); // Should not throw
    assertEquals(testDb.isClosed(), true);
  },
});

Deno.test({
  name: "isClosed: returns correct state",
  async fn() {
    const testDb = new Database();
    await testDb.open();
    assertEquals(testDb.isClosed(), false);
    testDb.close();
    assertEquals(testDb.isClosed(), true);
  },
});

Deno.test({
  name: "connect: throws when database is closed",
  async fn() {
    const testDb = new Database();
    await testDb.open();
    testDb.close();
    try {
      await testDb.connect();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Database is closed");
    }
  },
});

Deno.test({
  name: "query: can execute queries after connect",
  async fn() {
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
