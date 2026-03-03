/**
 * Objective API - QueryResult class tests
 */

import { assertEquals } from "@std/assert";
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
    await conn.query(
      "CREATE TABLE test_data (id INTEGER, name TEXT, value DOUBLE)",
    );
    await conn.query(
      "INSERT INTO test_data VALUES (1, 'one', 1.5), (2, 'two', 2.5), (3, 'three', 3.5)",
    );
    await conn.close();
  },
});

Deno.test({
  name: "fetchAll: returns row data",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data ORDER BY id");

    const rows = await result.fetchAll();

    assertEquals(rows.length, 3);
    assertEquals(rows[0][0], 1);
    assertEquals(rows[1][0], 2);
    assertEquals(rows[2][0], 3);

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "getRow: returns single row by index",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data ORDER BY id");

    const row0 = await result.getRow(0);
    assertEquals(row0[0], 1);

    const row1 = await result.getRow(1);
    assertEquals(row1[0], 2);

    const row2 = await result.getRow(2);
    assertEquals(row2[0], 3);

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "getRow: throws on out of bounds index",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    try {
      await result.getRow(100);
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Row index out of bounds");
    }

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "getRow: throws on negative index",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    try {
      await result.getRow(-1);
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Row index out of bounds");
    }

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "toArrayOfObjects: returns objects with column names",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data ORDER BY id");

    const objects = await result.toArrayOfObjects();

    assertEquals(objects.length, 3);
    assertEquals(objects[0].id, 1);
    assertEquals(objects[0].name, "one");
    assertEquals(objects[0].value, 1.5);

    assertEquals(objects[1].id, 2);
    assertEquals(objects[1].name, "two");
    assertEquals(objects[1].value, 2.5);

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "rowCount: returns correct count",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    assertEquals(await result.rowCount(), 3n);

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "columnCount: returns column count",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    assertEquals(await result.columnCount(), 3n);

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "getColumnInfos: returns column metadata",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    const infos = await result.getColumnInfos();

    assertEquals(infos.length, 3);
    assertEquals(infos[0].name, "id");
    assertEquals(infos[1].name, "name");
    assertEquals(infos[2].name, "value");

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "isSuccess: returns query success",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    assertEquals(result.isSuccess(), true);

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "getError: returns undefined for successful query",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    assertEquals(result.getError(), undefined);

    await result.close();
    await conn.close();
  },
});

Deno.test({
  name: "free: releases memory",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    await result.close();

    // After freeing, operations should throw
    try {
      await result.fetchAll();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Result has been freed");
    }

    await conn.close();
  },
});

Deno.test({
  name: "free: is idempotent",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    await result.close();
    await result.close(); // Should not throw

    await conn.close();
  },
});

Deno.test({
  name: "rowCount: throws after free",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    await result.close();

    try {
      await result.rowCount();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Result has been freed");
    }

    await conn.close();
  },
});

Deno.test({
  name: "columnCount: throws after free",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    await result.close();

    try {
      await result.columnCount();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Result has been freed");
    }

    await conn.close();
  },
});

Deno.test({
  name: "getColumnInfos: throws after free",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    await result.close();

    try {
      await result.getColumnInfos();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Result has been freed");
    }

    await conn.close();
  },
});

Deno.test({
  name: "toArrayOfObjects: throws after free",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data");

    await result.close();

    try {
      await result.toArrayOfObjects();
      throw new Error("Should have thrown");
    } catch (e) {
      assertEquals((e as Error).message, "Result has been freed");
    }

    await conn.close();
  },
});

Deno.test({
  name: "query: handles empty result set",
  async fn() {
    const conn = await db.connect();
    const result = await conn.query("SELECT * FROM test_data WHERE id = 999");

    assertEquals(await result.rowCount(), 0n);
    assertEquals((await result.fetchAll()).length, 0);

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
