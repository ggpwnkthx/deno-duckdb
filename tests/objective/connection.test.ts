/**
 * Objective API - Connection class tests
 */

import { assertEquals, assertExists } from "@std/assert";
import { Database } from "../../src/objective/mod.ts";

let db: Database;

Deno.test({
  name: "setup: create database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    db = new Database();
    await db.open();
  },
});

Deno.test({
  name: "query: executes SELECT query successfully",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT 1 as val");

    assertEquals(result.isSuccess(), true);
    assertEquals(await result.rowCount(), 1n);

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "query: executes INSERT query successfully",
  async fn() {
    const conn = await db.connect();

    // Create a table and insert data
    await conn.query("CREATE TABLE test (id INTEGER, name TEXT)");
    const insertResult = await conn.query(
      "INSERT INTO test VALUES (1, 'test')",
    );

    assertEquals(insertResult.isSuccess(), true);

    await conn.close();
  },
});

Deno.test({
  name: "queryAll: returns all rows",
  async fn() {
    const conn = await db.connect();

    // Create table and insert data
    await conn.query("CREATE TABLE test_all (id INTEGER)");
    await conn.query("INSERT INTO test_all VALUES (1), (2), (3)");

    const rows = await conn.queryAll("SELECT * FROM test_all ORDER BY id");

    assertEquals(rows.length, 3);
    assertEquals(rows[0][0], 1);
    assertEquals(rows[1][0], 2);
    assertEquals(rows[2][0], 3);

    await conn.close();
  },
});

Deno.test({
  name: "prepare: creates PreparedStatement",
  async fn() {
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT ? as val");

    assertExists(stmt);

    await stmt.close();
    await conn.close();
  },
});

Deno.test({
  name: "prepare: returns PreparedStatement for valid SQL",
  async fn() {
    const conn = await db.connect();
    const stmt = await conn.prepare("SELECT 1 as val");

    // Prepared statement is created even if query returns no results
    assertExists(stmt);

    await stmt.close();
    await conn.close();
  },
});

Deno.test({
  name: "close: closes connection",
  async fn() {
    const conn = await db.connect();
    assertEquals(conn.isClosed(), false);

    await conn.close();
    assertEquals(conn.isClosed(), true);
  },
});

Deno.test({
  name: "close: is idempotent",
  async fn() {
    const conn = await db.connect();
    await conn.close();
    await conn.close(); // Should not throw
    assertEquals(conn.isClosed(), true);
  },
});

Deno.test({
  name: "isClosed: returns correct state",
  async fn() {
    const conn = await db.connect();
    assertEquals(conn.isClosed(), false);

    await conn.close();
    assertEquals(conn.isClosed(), true);
  },
});

Deno.test({
  name: "query: throws when connection is closed",
  async fn() {
    const conn = await db.connect();
    await conn.close();

    try {
      await conn.query("SELECT 1");
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Connection is closed");
    }
  },
});

Deno.test({
  name: "queryAll: throws when connection is closed",
  async fn() {
    const conn = await db.connect();
    await conn.close();

    try {
      await conn.queryAll("SELECT 1");
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Connection is closed");
    }
  },
});

Deno.test({
  name: "prepare: throws when connection is closed",
  async fn() {
    const conn = await db.connect();
    await conn.close();

    try {
      await conn.prepare("SELECT 1");
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Connection is closed");
    }
  },
});

Deno.test({
  name: "close: throws when connection is closed",
  async fn() {
    const conn = await db.connect();
    await conn.close();

    // Should not throw, close is idempotent
    await conn.close();
  },
});

Deno.test({
  name: "query: can execute multiple queries sequentially",
  async fn() {
    const conn = await db.connect();

    await conn.query("CREATE TABLE multi_test (id INTEGER)");
    await conn.query("INSERT INTO multi_test VALUES (1)");
    await conn.query("INSERT INTO multi_test VALUES (2)");

    const result = await conn.query("SELECT * FROM multi_test ORDER BY id");
    assertEquals(await result.rowCount(), 2n);

    await result.close();
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
