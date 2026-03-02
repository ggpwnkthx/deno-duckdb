/**
 * Objective API - QueryResult class tests
 */

import { assertEquals } from "@std/assert";
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
    conn.query("CREATE TABLE test_data (id INTEGER, name TEXT, value DOUBLE)");
    conn.query(
      "INSERT INTO test_data VALUES (1, 'one', 1.5), (2, 'two', 2.5), (3, 'three', 3.5)",
    );
    conn.close();
  },
});

Deno.test("fetchAll: returns row data", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data ORDER BY id");

  const rows = result.fetchAll();

  assertEquals(rows.length, 3);
  assertEquals(rows[0][0], 1);
  assertEquals(rows[1][0], 2);
  assertEquals(rows[2][0], 3);

  result.free();
  conn.close();
});

Deno.test("getRow: returns single row by index", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data ORDER BY id");

  const row0 = result.getRow(0);
  assertEquals(row0[0], 1);

  const row1 = result.getRow(1);
  assertEquals(row1[0], 2);

  const row2 = result.getRow(2);
  assertEquals(row2[0], 3);

  result.free();
  conn.close();
});

Deno.test("getRow: throws on out of bounds index", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  try {
    result.getRow(100);
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Row index out of bounds");
  }

  result.free();
  conn.close();
});

Deno.test("getRow: throws on negative index", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  try {
    result.getRow(-1);
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Row index out of bounds");
  }

  result.free();
  conn.close();
});

Deno.test("toArrayOfObjects: returns objects with column names", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data ORDER BY id");

  const objects = result.toArrayOfObjects();

  assertEquals(objects.length, 3);
  assertEquals(objects[0].id, 1);
  assertEquals(objects[0].name, "one");
  assertEquals(objects[0].value, 1.5);

  assertEquals(objects[1].id, 2);
  assertEquals(objects[1].name, "two");
  assertEquals(objects[1].value, 2.5);

  result.free();
  conn.close();
});

Deno.test("rowCount: returns correct count", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  assertEquals(result.rowCount(), 3n);

  result.free();
  conn.close();
});

Deno.test("columnCount: returns column count", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  assertEquals(result.columnCount(), 3n);

  result.free();
  conn.close();
});

Deno.test("getColumnInfos: returns column metadata", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  const infos = result.getColumnInfos();

  assertEquals(infos.length, 3);
  assertEquals(infos[0].name, "id");
  assertEquals(infos[1].name, "name");
  assertEquals(infos[2].name, "value");

  result.free();
  conn.close();
});

Deno.test("isSuccess: returns query success", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  assertEquals(result.isSuccess(), true);

  result.free();
  conn.close();
});

Deno.test("getError: returns undefined for successful query", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  assertEquals(result.getError(), undefined);

  result.free();
  conn.close();
});

Deno.test("free: releases memory", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  result.free();

  // After freeing, operations should throw
  try {
    result.fetchAll();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Result has been freed");
  }

  conn.close();
});

Deno.test("free: is idempotent", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  result.free();
  result.free(); // Should not throw

  conn.close();
});

Deno.test("rowCount: throws after free", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  result.free();

  try {
    result.rowCount();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Result has been freed");
  }

  conn.close();
});

Deno.test("columnCount: throws after free", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  result.free();

  try {
    result.columnCount();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Result has been freed");
  }

  conn.close();
});

Deno.test("getColumnInfos: throws after free", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  result.free();

  try {
    result.getColumnInfos();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Result has been freed");
  }

  conn.close();
});

Deno.test("toArrayOfObjects: throws after free", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data");

  result.free();

  try {
    result.toArrayOfObjects();
    throw new Error("Should have thrown");
  } catch (e) {
    assertEquals((e as Error).message, "Result has been freed");
  }

  conn.close();
});

Deno.test("query: handles empty result set", () => {
  const conn = db.connect();
  const result = conn.query("SELECT * FROM test_data WHERE id = 999");

  assertEquals(result.rowCount(), 0n);
  assertEquals(result.fetchAll().length, 0);

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
