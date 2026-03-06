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
    duckdb.closeConnection(conn);
    duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "isNull: detects NULL values",
  async fn() {
    await withConn((conn) => {
      // Create table with NULL value - use exec
      exec(conn, "CREATE TABLE null_test(id INTEGER, val TEXT)");
      exec(conn, "INSERT INTO null_test VALUES (1, NULL)");
      const handle = duckdb.execute(conn, "SELECT * FROM null_test");
      // The second column (index 1) should be NULL
      const isNull = duckdb.isNull(handle, 0, 1);
      assertEquals(isNull, true);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "isNull: returns false for non-NULL values",
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE non_null_test(id INTEGER, val TEXT)");
      exec(conn, "INSERT INTO non_null_test VALUES (1, 'hello')");
      const handle = duckdb.execute(
        conn,
        "SELECT * FROM non_null_test",
      );
      // The second column should NOT be NULL
      const isNull = duckdb.isNull(handle, 0, 1);
      assertEquals(isNull, false);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getInt32: extracts INTEGER values",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(conn, "SELECT 42 as num");
      const intVal = duckdb.getInt32(handle, 0, 0);
      assertEquals(intVal, 42);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getInt64: extracts BIGINT values",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT 9223372036854775807::BIGINT as num",
      );
      const intVal = duckdb.getInt64(handle, 0, 0);
      assertEquals(intVal, 9223372036854775807n);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getDouble: extracts DOUBLE values",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT 3.14159::DOUBLE as num",
      );
      const doubleVal = duckdb.getDouble(handle, 0, 0);
      assertEquals(doubleVal, 3.14159);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getString: extracts VARCHAR values",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT 'hello world' as str",
      );
      const strVal = duckdb.getString(handle, 0, 0);
      assertEquals(strVal, "hello world");
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "fetchAll: fetches all rows from result",
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE fetch_test(id INTEGER, name TEXT)");
      exec(
        conn,
        "INSERT INTO fetch_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
      );
      const handle = duckdb.execute(
        conn,
        "SELECT * FROM fetch_test ORDER BY id",
      );
      const rows = duckdb.fetchAll(handle);
      assertEquals(rows.length, 3);
      assertEquals(rows[0][0], 1);
      assertEquals(rows[1][0], 2);
      assertEquals(rows[2][0], 3);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "fetchAll: handles NULL values",
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE fetch_null_test(id INTEGER, val TEXT)");
      exec(
        conn,
        "INSERT INTO fetch_null_test VALUES (1, NULL), (2, 'test')",
      );

      const handle = duckdb.execute(
        conn,
        "SELECT * FROM fetch_null_test ORDER BY id",
      );

      const rows = duckdb.fetchAll(handle);
      assertEquals(rows.length, 2);
      assertEquals(rows[0][1], null);
      assertEquals(rows[1][1], "test");
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getValueByType: extracts value based on type",
  async fn() {
    await withConn((conn) => {
      exec(
        conn,
        "CREATE TABLE type_test(id INTEGER, val TEXT, num DOUBLE)",
      );
      exec(conn, "INSERT INTO type_test VALUES (1, 'test', 1.5)");
      const handle = duckdb.execute(conn, "SELECT * FROM type_test");
      // Get column types
      const idType = duckdb.columnType(handle, 0);
      const valType = duckdb.columnType(handle, 1);
      const numType = duckdb.columnType(handle, 2);
      // Extract values by type
      const idVal = duckdb.getValueByType(handle, 0, 0, idType);
      const valVal = duckdb.getValueByType(handle, 0, 1, valType);
      const numVal = duckdb.getValueByType(handle, 0, 2, numType);
      assertEquals(idVal, 1);
      assertEquals(valVal, "test");
      assertEquals(numVal, 1.5);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "getValueByType: handles NULL type",
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE null_type_test(val TEXT)");
      exec(conn, "INSERT INTO null_type_test VALUES (NULL)");
      const handle = duckdb.execute(
        conn,
        "SELECT * FROM null_type_test",
      );
      const valType = duckdb.columnType(handle, 0);
      const val = duckdb.getValueByType(handle, 0, 0, valType);
      assertEquals(val, null);
      duckdb.destroyResult(handle);
    });
  },
});

// BOOLEAN tests
Deno.test({
  name: "fetchAll: BOOLEAN true/false",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT true as v UNION ALL SELECT false",
      );
      const rows = duckdb.fetchAll(handle);
      assertEquals(rows[0][0], 1);
      assertEquals(rows[1][0], 0);
      duckdb.destroyResult(handle);
    });
  },
});

// TINYINT tests
Deno.test({
  name: "fetchAll: TINYINT values",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT 1::TINYINT UNION ALL SELECT 127::TINYINT",
      );
      const rows = duckdb.fetchAll(handle);
      assertEquals(rows[0][0], 1);
      assertEquals(rows[1][0], 127);
      duckdb.destroyResult(handle);
    });
  },
});

// SMALLINT tests
Deno.test({
  name: "fetchAll: SMALLINT values",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT 1::SMALLINT UNION ALL SELECT 32767::SMALLINT",
      );
      const rows = duckdb.fetchAll(handle);
      assertEquals(rows[0][0], 1);
      assertEquals(rows[1][0], 32767);
      duckdb.destroyResult(handle);
    });
  },
});

// FLOAT tests
Deno.test({
  name: "fetchAll: FLOAT values",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT 1.5::FLOAT",
      );
      const rows = duckdb.fetchAll(handle);
      assertEquals(rows[0][0], 1.5);
      duckdb.destroyResult(handle);
    });
  },
});

// HUGEINT tests
Deno.test({
  name: "fetchAll: HUGEINT large positive",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT (pow(2,80) + 12345)::HUGEINT as v",
      );
      const rows = duckdb.fetchAll(handle);
      assertEquals(rows[0][0], 1208925819614629174706176n);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "fetchAll: HUGEINT negative",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT (-pow(2,80) + 7)::HUGEINT as v",
      );
      const rows = duckdb.fetchAll(handle);
      assertEquals(rows[0][0], -1208925819614629174706176n);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "fetchAll: HUGEINT zero",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.execute(
        conn,
        "SELECT 0::HUGEINT as v",
      );
      const rows = duckdb.fetchAll(handle);
      assertEquals(rows[0][0], 0n);
      duckdb.destroyResult(handle);
    });
  },
});

Deno.test({
  name: "fetchAll: HUGEINT NULL handling",
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE hugeint_null_test(v HUGEINT)");
      exec(
        conn,
        "INSERT INTO hugeint_null_test VALUES (NULL), (1::HUGEINT)",
      );
      const handle = duckdb.execute(
        conn,
        "SELECT * FROM hugeint_null_test",
      );
      const rows = duckdb.fetchAll(handle);
      assertEquals(rows[0][0], null);
      assertEquals(rows[1][0], 1n);
      duckdb.destroyResult(handle);
    });
  },
});
