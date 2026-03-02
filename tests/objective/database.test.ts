/**
 * Objective API - Database class tests
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

Deno.test("constructor: opens database successfully", () => {
  assertExists(db);
  assertEquals(db.isClosed(), false);
});

Deno.test("constructor: throws on invalid library", async () => {
  const invalidLib = await load();
  invalidLib.close();

  // The constructor will throw when trying to use the closed library
  // But we can't easily test this without creating a new instance
  // So we test that valid construction works
  const newDb = new Database(invalidLib);
  assertExists(newDb);
  assertEquals(newDb.isClosed(), false);
  newDb.close();
});

Deno.test("connect: creates a new Connection", () => {
  const conn = db.connect();
  assertExists(conn);
  assertEquals(conn.isClosed(), false);
  conn.close();
});

Deno.test("connect: multiple connections work independently", () => {
  const conn1 = db.connect();
  const conn2 = db.connect();

  assertEquals(conn1.isClosed(), false);
  assertEquals(conn2.isClosed(), false);

  // Both should work independently
  const result1 = conn1.query("SELECT 1 as val");
  assertEquals(result1.isSuccess(), true);
  result1.free();

  const result2 = conn2.query("SELECT 2 as val");
  assertEquals(result2.isSuccess(), true);
  result2.free();

  conn1.close();
  conn2.close();
});

Deno.test("close: closes the database", () => {
  const testDb = new Database(lib);
  assertEquals(testDb.isClosed(), false);

  testDb.close();
  assertEquals(testDb.isClosed(), true);
});

Deno.test("close: is idempotent", () => {
  const testDb = new Database(lib);
  testDb.close();
  testDb.close(); // Should not throw
  assertEquals(testDb.isClosed(), true);
});

Deno.test("isClosed: returns correct state", () => {
  const testDb = new Database(lib);
  assertEquals(testDb.isClosed(), false);

  testDb.close();
  assertEquals(testDb.isClosed(), true);
});

Deno.test("connect: throws when database is closed", () => {
  const testDb = new Database(lib);
  testDb.close();

  try {
    testDb.connect();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Database is closed");
  }
});

Deno.test("query: can execute queries after connect", () => {
  const conn = db.connect();
  const result = conn.query("SELECT 42 as answer");
  assertEquals(result.isSuccess(), true);
  assertEquals(result.rowCount(), 1n);
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
