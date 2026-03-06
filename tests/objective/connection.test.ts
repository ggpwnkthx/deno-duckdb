/**
 * Objective API - Connection class tests
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
  name: "query: executes SELECT query successfully",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    const result = conn.query("SELECT 1 as val");
    assertEquals(result.isSuccess(), true);
    assertEquals(result.rowCount(), 1n);
    result.close();
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "query: executes INSERT query successfully",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    // Create a table and insert data - close result after each
    const createResult = conn.query(
      "CREATE TABLE test (id INTEGER, name TEXT)",
    );
    createResult.close();
    const insertResult = conn.query(
      "INSERT INTO test VALUES (1, 'test')",
    );
    assertEquals(insertResult.isSuccess(), true);
    insertResult.close();
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "queryAll: returns all rows",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    // Create table and insert data - close results
    const createResult = conn.query("CREATE TABLE test_all (id INTEGER)");
    createResult.close();
    const insertResult = conn.query(
      "INSERT INTO test_all VALUES (1), (2), (3)",
    );
    insertResult.close();
    const rows = conn.queryAll("SELECT * FROM test_all ORDER BY id");
    assertEquals(rows.length, 3);
    assertEquals(rows[0][0], 1);
    assertEquals(rows[1][0], 2);
    assertEquals(rows[2][0], 3);
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "prepare: creates PreparedStatement",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    const stmt = conn.prepare("SELECT ? as val");
    assertExists(stmt);
    stmt.close();
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "prepare: returns PreparedStatement for valid SQL",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    const stmt = conn.prepare("SELECT 1 as val");
    // Prepared statement is created even if query returns no results
    assertExists(stmt);
    stmt.close();
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "close: closes connection",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    assertEquals(conn.isClosed(), false);
    conn.close();
    assertEquals(conn.isClosed(), true);
    db.close();
  },
});

Deno.test({
  name: "close: is idempotent",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    conn.close();
    conn.close(); // Should not throw
    assertEquals(conn.isClosed(), true);
    db.close();
  },
});

Deno.test({
  name: "isClosed: returns correct state",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    assertEquals(conn.isClosed(), false);
    conn.close();
    assertEquals(conn.isClosed(), true);
    db.close();
  },
});

Deno.test({
  name: "query: throws when connection is closed",
  async fn() {
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
  },
});

Deno.test({
  name: "queryAll: throws when connection is closed",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    conn.close();
    try {
      conn.queryAll("SELECT 1");
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Connection is closed");
    }
    db.close();
  },
});

Deno.test({
  name: "prepare: throws when connection is closed",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    conn.close();
    try {
      conn.prepare("SELECT 1");
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Connection is closed");
    }
    db.close();
  },
});

Deno.test({
  name: "close: throws when connection is closed",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    conn.close();
    // Should not throw, close is idempotent
    conn.close();
    db.close();
  },
});

Deno.test({
  name: "query: can execute multiple queries sequentially",
  async fn() {
    const db = new Database();
    await db.open();
    const conn = await db.connect();
    const r1 = conn.query("CREATE TABLE multi_test (id INTEGER)");
    r1.close();
    const r2 = conn.query("INSERT INTO multi_test VALUES (1)");
    r2.close();
    const r3 = conn.query("INSERT INTO multi_test VALUES (2)");
    r3.close();
    const result = conn.query("SELECT * FROM multi_test ORDER BY id");
    assertEquals(result.rowCount(), 2n);
    result.close();
    conn.close();
    db.close();
  },
});
