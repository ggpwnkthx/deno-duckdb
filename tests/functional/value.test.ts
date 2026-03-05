/**
 * Functional value extraction operations tests
 */

import { assertEquals } from "@std/assert";
import { functional as duckdb } from "@ggpwnkthx/duckdb";
import { exec, withConn } from "../_util.ts";

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
  name: "isNull: detects NULL values",
  async fn() {
    await withConn(async (conn) => {
      // Create table with NULL value - use exec
      await exec(conn, "CREATE TABLE null_test(id INTEGER, val TEXT)");
      await exec(conn, "INSERT INTO null_test VALUES (1, NULL)");

      const handle = await duckdb.execute(conn, "SELECT * FROM null_test");

      // The second column (index 1) should be NULL
      const isNull = await duckdb.isNull(handle, 0, 1);
      assertEquals(isNull, true);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "isNull: returns false for non-NULL values",
  async fn() {
    await withConn(async (conn) => {
      await exec(conn, "CREATE TABLE non_null_test(id INTEGER, val TEXT)");
      await exec(conn, "INSERT INTO non_null_test VALUES (1, 'hello')");

      const handle = await duckdb.execute(
        conn,
        "SELECT * FROM non_null_test",
      );

      // The second column should NOT be NULL
      const isNull = await duckdb.isNull(handle, 0, 1);
      assertEquals(isNull, false);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getInt32: extracts INTEGER values",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(conn, "SELECT 42 as num");

      const intVal = await duckdb.getInt32(handle, 0, 0);
      assertEquals(intVal, 42);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getInt64: extracts BIGINT values",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(
        conn,
        "SELECT 9223372036854775807::BIGINT as num",
      );

      const intVal = await duckdb.getInt64(handle, 0, 0);
      assertEquals(intVal, 9223372036854775807n);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getDouble: extracts DOUBLE values",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(
        conn,
        "SELECT 3.14159::DOUBLE as num",
      );

      const doubleVal = await duckdb.getDouble(handle, 0, 0);
      assertEquals(doubleVal, 3.14159);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getString: extracts VARCHAR values",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.execute(
        conn,
        "SELECT 'hello world' as str",
      );

      const strVal = await duckdb.getString(handle, 0, 0);
      assertEquals(strVal, "hello world");

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "fetchAll: fetches all rows from result",
  async fn() {
    await withConn(async (conn) => {
      await exec(conn, "CREATE TABLE fetch_test(id INTEGER, name TEXT)");
      await exec(
        conn,
        "INSERT INTO fetch_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
      );

      const handle = await duckdb.execute(
        conn,
        "SELECT * FROM fetch_test ORDER BY id",
      );

      const rows = await duckdb.fetchAll(handle);
      assertEquals(rows.length, 3);
      assertEquals(rows[0][0], 1);
      assertEquals(rows[1][0], 2);
      assertEquals(rows[2][0], 3);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "fetchAll: handles NULL values",
  async fn() {
    await withConn(async (conn) => {
      await exec(conn, "CREATE TABLE fetch_null_test(id INTEGER, val TEXT)");
      await exec(
        conn,
        "INSERT INTO fetch_null_test VALUES (1, NULL), (2, 'test')",
      );

      const handle = await duckdb.execute(
        conn,
        "SELECT * FROM fetch_null_test ORDER BY id",
      );

      const rows = await duckdb.fetchAll(handle);
      assertEquals(rows.length, 2);
      assertEquals(rows[0][1], null);
      assertEquals(rows[1][1], "test");

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getValueByType: extracts value based on type",
  async fn() {
    await withConn(async (conn) => {
      await exec(
        conn,
        "CREATE TABLE type_test(id INTEGER, val TEXT, num DOUBLE)",
      );
      await exec(conn, "INSERT INTO type_test VALUES (1, 'test', 1.5)");

      const handle = await duckdb.execute(conn, "SELECT * FROM type_test");

      // Get column types
      const idType = await duckdb.columnType(handle, 0);
      const valType = await duckdb.columnType(handle, 1);
      const numType = await duckdb.columnType(handle, 2);

      // Extract values by type
      const idVal = await duckdb.getValueByType(handle, 0, 0, idType);
      const valVal = await duckdb.getValueByType(handle, 0, 1, valType);
      const numVal = await duckdb.getValueByType(handle, 0, 2, numType);

      assertEquals(idVal, 1);
      assertEquals(valVal, "test");
      assertEquals(numVal, 1.5);

      await duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getValueByType: handles NULL type",
  async fn() {
    await withConn(async (conn) => {
      await exec(conn, "CREATE TABLE null_type_test(val TEXT)");
      await exec(conn, "INSERT INTO null_type_test VALUES (NULL)");

      const handle = await duckdb.execute(
        conn,
        "SELECT * FROM null_type_test",
      );

      const valType = await duckdb.columnType(handle, 0);
      const val = await duckdb.getValueByType(handle, 0, 0, valType);

      assertEquals(val, null);

      await duckdb.destroyResult(handle);
    });
  },
});
