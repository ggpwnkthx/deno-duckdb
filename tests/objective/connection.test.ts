/**
 * Objective API - Connection class tests
 */

import { assertEquals, assertExists } from "@std/assert";
import { load } from "@ggpwnkthx/libduckdb";
import type { DuckDBLibrary } from "@ggpwnkthx/duckdb";
import { Database } from "../../src/objective/mod.ts";

let lib: DuckDBLibrary;
let db: Database;

Deno.test({
  name: "setup: load library and create database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    lib = await load();
    db = new Database(lib);
  },
});

Deno.test("query: executes SELECT query successfully", () => {
  const conn = db.connect();
  const result = conn.query("SELECT 1 as val");

  assertEquals(result.isSuccess(), true);
  assertEquals(result.rowCount(), 1n);

  result.free();
  conn.close();
});

Deno.test("query: executes INSERT query successfully", () => {
  const conn = db.connect();

  // Create a table and insert data
  conn.query("CREATE TABLE test (id INTEGER, name TEXT)");
  const insertResult = conn.query("INSERT INTO test VALUES (1, 'test')");

  assertEquals(insertResult.isSuccess(), true);

  conn.close();
});

Deno.test("queryAll: returns all rows", () => {
  const conn = db.connect();

  // Create table and insert data
  conn.query("CREATE TABLE test_all (id INTEGER)");
  conn.query("INSERT INTO test_all VALUES (1), (2), (3)");

  const rows = conn.queryAll("SELECT * FROM test_all ORDER BY id");

  assertEquals(rows.length, 3);
  assertEquals(rows[0][0], 1);
  assertEquals(rows[1][0], 2);
  assertEquals(rows[2][0], 3);

  conn.close();
});

Deno.test("prepare: creates PreparedStatement", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT ? as val");

  assertExists(stmt);

  stmt.close();
  conn.close();
});

Deno.test("prepare: returns PreparedStatement for valid SQL", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT 1 as val");

  // Prepared statement is created even if query returns no results
  assertExists(stmt);

  stmt.close();
  conn.close();
});

Deno.test("close: closes connection", () => {
  const conn = db.connect();
  assertEquals(conn.isClosed(), false);

  conn.close();
  assertEquals(conn.isClosed(), true);
});

Deno.test("close: is idempotent", () => {
  const conn = db.connect();
  conn.close();
  conn.close(); // Should not throw
  assertEquals(conn.isClosed(), true);
});

Deno.test("isClosed: returns correct state", () => {
  const conn = db.connect();
  assertEquals(conn.isClosed(), false);

  conn.close();
  assertEquals(conn.isClosed(), true);
});

Deno.test("query: throws when connection is closed", () => {
  const conn = db.connect();
  conn.close();

  try {
    conn.query("SELECT 1");
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Connection is closed");
  }
});

Deno.test("queryAll: throws when connection is closed", () => {
  const conn = db.connect();
  conn.close();

  try {
    conn.queryAll("SELECT 1");
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Connection is closed");
  }
});

Deno.test("prepare: throws when connection is closed", () => {
  const conn = db.connect();
  conn.close();

  try {
    conn.prepare("SELECT 1");
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Connection is closed");
  }
});

Deno.test("close: throws when connection is closed", () => {
  const conn = db.connect();
  conn.close();

  // Should not throw, close is idempotent
  conn.close();
});

Deno.test("query: can execute multiple queries sequentially", () => {
  const conn = db.connect();

  conn.query("CREATE TABLE multi_test (id INTEGER)");
  conn.query("INSERT INTO multi_test VALUES (1)");
  conn.query("INSERT INTO multi_test VALUES (2)");

  const result = conn.query("SELECT * FROM multi_test ORDER BY id");
  assertEquals(result.rowCount(), 2n);

  result.free();
  conn.close();
});

Deno.test({
  name: "cleanup: close database",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    if (db && !db.isClosed()) {
      db.close();
    }
    lib.close();
  },
});
