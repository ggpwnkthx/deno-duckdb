/**
 * Functional query operations tests
 */

import {
  assertEquals,
  assertExists,
  assertGreater,
  assertRejects,
} from "@std/assert";
import { functional as duckdb } from "@ggpwnkthx/duckdb";
import { exec, query, withConn } from "../_util.ts";

// Warm-up test to trigger library loading once for all tests
Deno.test({
  name: "warmup: load library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await duckdb.open();
    const conn = await duckdb.create(db);
    await duckdb.closeConnection(conn);
    await duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "execute: executes SELECT query",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(conn, "SELECT 1 as num");
      assertExists(handle);
      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "execute: executes INSERT query",
  async fn() {
    await withConn(async (conn) => {
      // Use exec for DDL/INSERT - automatically destroys result
      await exec(conn, "CREATE TABLE test(id INTEGER, name VARCHAR)");
      await exec(conn, "INSERT INTO test VALUES (1, 'test')");

      // Verify data with query
      const rows = await query(conn, "SELECT * FROM test");
      assertEquals(rows.length, 1);
      assertEquals(rows[0][0], 1);
    });
  },
});

Deno.test({
  name: "execute: throws for invalid SQL",
  async fn() {
    await withConn(async (conn) => {
      await assertRejects(
        async () =>
          await duckdb.execute(conn, "SELECT * FROM nonexistent_table"),
        Error,
      );
    });
  },
});

Deno.test({
  name: "rowCount: returns correct row count",
  async fn() {
    await withConn(async (conn) => {
      await exec(conn, "CREATE TABLE row_count_test(id INTEGER)");
      await exec(conn, "INSERT INTO row_count_test VALUES (1), (2), (3)");

      const handle = await duckdb.execute(
        conn,
        "SELECT * FROM row_count_test",
      );

      const count = await duckdb.rowCount(handle);
      assertEquals(count, 3n);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "rowCount: returns 0 for empty result",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(
        conn,
        "SELECT * FROM (SELECT 1) WHERE 1=0",
      );

      const count = await duckdb.rowCount(handle);
      assertEquals(count, 0n);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "columnCount: returns column count",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(
        conn,
        "SELECT 1 as a, 2 as b, 3 as c",
      );

      const count = await duckdb.columnCount(handle);
      assertEquals(count, 3n);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "columnName: returns column name",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(conn, "SELECT 1 as my_column");

      const name = await duckdb.columnName(handle, 0);
      assertEquals(name, "my_column");

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "columnName: returns empty string for invalid index",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(conn, "SELECT 1");

      const name = await duckdb.columnName(handle, 999);
      assertEquals(name, "");

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "columnType: returns column type",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(
        conn,
        "SELECT 1 as num, 'text' as str",
      );

      // INTEGER type is 4
      const intType = await duckdb.columnType(handle, 0);
      assertGreater(intType, 0);

      // VARCHAR type is 17
      const strType = await duckdb.columnType(handle, 1);
      assertGreater(strType, 0);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "columnInfos: returns all column info",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(
        conn,
        "SELECT 1 as id, 'test' as name",
      );

      const infos = await duckdb.columnInfos(handle);
      assertEquals(infos.length, 2);
      assertEquals(infos[0].name, "id");
      assertEquals(infos[1].name, "name");

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "destroyResult: frees result memory",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(conn, "SELECT 1");

      // Should not throw
      await duckdb.destroyResult(handle);

      // Destroying again should be safe
      await duckdb.destroyResult(handle);
    });
  },
});
