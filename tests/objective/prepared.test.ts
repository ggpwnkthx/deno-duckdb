/**
 * Objective API - PreparedStatement class tests
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

    // Create test table
    const conn = db.connect();
    conn.query("CREATE TABLE prep_test (id INTEGER, name TEXT)");
    conn.query(
      "INSERT INTO prep_test VALUES (1, 'one'), (2, 'two'), (3, 'three')",
    );
    conn.close();
  },
});

Deno.test("execute: returns QueryResult for SELECT", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT * FROM prep_test ORDER BY id");

  const result = stmt.execute();

  assertExists(result);
  assertEquals(result.isSuccess(), true);
  assertEquals(result.rowCount(), 3n);

  result.free();
  stmt.close();
  conn.close();
});

Deno.test("execute: for query with filter", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT * FROM prep_test WHERE id = 1");

  const result = stmt.execute();

  assertExists(result);
  assertEquals(result.isSuccess(), true);
  assertEquals(result.rowCount(), 1n);

  result.free();
  stmt.close();
  conn.close();
});

Deno.test("columnCount: returns column count for SELECT", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT id, name FROM prep_test");

  assertEquals(stmt.columnCount(), 2n);

  stmt.close();
  conn.close();
});

Deno.test("columnCount: returns column count for INSERT", () => {
  const conn = db.connect();
  const stmt = conn.prepare("INSERT INTO prep_test VALUES (4, 'four')");

  // INSERT returns the number of rows affected
  assertEquals(stmt.columnCount(), 1n);

  stmt.close();
  conn.close();
});

Deno.test("close: frees the statement", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT * FROM prep_test");

  stmt.close();

  // After close, operations should throw
  try {
    stmt.execute();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Prepared statement is closed");
  }

  conn.close();
});

Deno.test("close: is idempotent", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT * FROM prep_test");

  stmt.close();
  stmt.close(); // Should not throw

  conn.close();
});

Deno.test("execute: throws when statement is closed", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT * FROM prep_test");
  stmt.close();

  try {
    stmt.execute();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Prepared statement is closed");
  }

  conn.close();
});

Deno.test("columnCount: throws when statement is closed", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT * FROM prep_test");
  stmt.close();

  try {
    stmt.columnCount();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Prepared statement is closed");
  }

  conn.close();
});

Deno.test("prepare: with unbound parameter placeholder", () => {
  const conn = db.connect();

  // Note: Prepared statements with unbound parameters will fail at execute time
  // This tests that the prepare itself succeeds but the execute will fail
  const stmt = conn.prepare("SELECT * FROM prep_test WHERE id = ?");
  assertExists(stmt);

  const result = stmt.execute();
  // Should fail because parameter is not bound
  assertEquals(result.isSuccess(), false);

  result.free();
  stmt.close();
  conn.close();
});

Deno.test("prepare: creates statement that can be executed multiple times", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT * FROM prep_test WHERE id = 1");

  // Execute twice
  const result1 = stmt.execute();
  assertEquals(result1.isSuccess(), true);
  assertEquals(result1.rowCount(), 1n);
  result1.free();

  const result2 = stmt.execute();
  assertEquals(result2.isSuccess(), true);
  assertEquals(result2.rowCount(), 1n);
  result2.free();

  stmt.close();
  conn.close();
});

Deno.test("prepare: handles JOIN query", () => {
  const conn = db.connect();
  // Create another table for join
  conn.query("CREATE TABLE prep_join (id INTEGER, value TEXT)");
  conn.query("INSERT INTO prep_join VALUES (1, 'a'), (2, 'b')");

  const stmt = conn.prepare(
    "SELECT p.id, p.name, j.value FROM prep_test p JOIN prep_join j ON p.id = j.id",
  );

  assertExists(stmt);

  const result = stmt.execute();
  assertEquals(result.isSuccess(), true);

  result.free();
  stmt.close();
  conn.close();
});

Deno.test("execute: handles empty result", () => {
  const conn = db.connect();
  const stmt = conn.prepare("SELECT * FROM prep_test WHERE id = 999");

  const result = stmt.execute();

  assertExists(result);
  assertEquals(result.isSuccess(), true);
  assertEquals(result.rowCount(), 0n);

  result.free();
  stmt.close();
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
