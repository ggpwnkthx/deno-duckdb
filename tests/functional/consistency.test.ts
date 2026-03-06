/**
 * Functional cross-API consistency tests
 *
 * Tests that all APIs return identical results: fetchAll, typed getters, getValueByType, stream
 */

import { assertEquals } from "@std/assert";

import type { RowData } from "@ggpwnkthx/duckdb";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec, withConn } from "./utils.ts";

Deno.test({
  name: "consistency: fetchAll vs typed getters",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "fetchAll matches typed getters for integers",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE int_consistency(id INTEGER)");
          exec(conn, "INSERT INTO int_consistency VALUES (42)");
          const handle = duckdb.execute(conn, "SELECT * FROM int_consistency");

          // Get via typed getter
          const typedVal = duckdb.getInt32(handle, 0, 0);

          // Get via fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          assertEquals(typedVal, fetchAllVal);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "fetchAll matches typed getters for bigint",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE bigint_consistency(id BIGINT)");
          exec(
            conn,
            "INSERT INTO bigint_consistency VALUES (9223372036854775807)",
          );
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM bigint_consistency",
          );

          const typedVal = duckdb.getInt64(handle, 0, 0);
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          assertEquals(typedVal, fetchAllVal);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "fetchAll matches typed getters for double",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE double_consistency(val DOUBLE)");
          exec(conn, "INSERT INTO double_consistency VALUES (3.14159)");
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM double_consistency",
          );

          const typedVal = duckdb.getDouble(handle, 0, 0);
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          assertEquals(typedVal, fetchAllVal);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "fetchAll matches typed getters for string",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE str_consistency(val TEXT)");
          exec(conn, "INSERT INTO str_consistency VALUES ('hello world')");
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM str_consistency",
          );

          const typedVal = duckdb.getString(handle, 0, 0);
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          assertEquals(typedVal, fetchAllVal);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: fetchAll vs getValueByType",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "fetchAll matches getValueByType for various types",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE value_type_test(id INTEGER, val TEXT, num DOUBLE)",
          );
          exec(
            conn,
            "INSERT INTO value_type_test VALUES (1, 'test', 1.5)",
          );
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM value_type_test",
          );

          // Get column types
          const idType = duckdb.columnType(handle, 0);
          const valType = duckdb.columnType(handle, 1);
          const numType = duckdb.columnType(handle, 2);

          // Get values via getValueByType
          const idVal = duckdb.getValueByType(handle, 0, 0, idType);
          const valVal = duckdb.getValueByType(handle, 0, 1, valType);
          const numVal = duckdb.getValueByType(handle, 0, 2, numType);

          // Get values via fetchAll
          const rows = duckdb.fetchAll(handle);
          assertEquals(idVal, rows[0][0]);
          assertEquals(valVal, rows[0][1]);
          assertEquals(numVal, rows[0][2]);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: fetchAll vs stream",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "fetchAll returns same values as stream",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE stream_consistency(id INTEGER, name TEXT)",
          );
          exec(
            conn,
            "INSERT INTO stream_consistency VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')",
          );

          // Get via fetchAll
          const handle1 = duckdb.execute(
            conn,
            "SELECT * FROM stream_consistency ORDER BY id",
          );
          const fetchAllRows = duckdb.fetchAll(handle1);
          duckdb.destroyResult(handle1);

          // Get via stream
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM stream_consistency ORDER BY id",
            )
          ) {
            streamRows.push(row);
          }

          // Should have same length
          assertEquals(streamRows.length, fetchAllRows.length);

          // Each row should match
          for (let i = 0; i < fetchAllRows.length; i++) {
            assertEquals(streamRows[i][0], fetchAllRows[i][0]);
            assertEquals(streamRows[i][1], fetchAllRows[i][1]);
          }
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: typed getters vs stream",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "typed getters return same values as stream",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE typed_stream_test(id INTEGER, val TEXT)",
          );
          exec(
            conn,
            "INSERT INTO typed_stream_test VALUES (1, 'test')",
          );

          // Get via typed getters
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM typed_stream_test",
          );
          const typedInt = duckdb.getInt32(handle, 0, 0);
          const typedStr = duckdb.getString(handle, 0, 1);
          duckdb.destroyResult(handle);

          // Get via stream
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM typed_stream_test",
            )
          ) {
            streamRows.push(row);
          }

          assertEquals(typedInt, streamRows[0][0]);
          assertEquals(typedStr, streamRows[0][1]);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: NULL handling across APIs",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "NULL handling is consistent across APIs",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE null_consistency(id INTEGER, val TEXT)");
          exec(
            conn,
            "INSERT INTO null_consistency VALUES (1, NULL), (2, 'test')",
          );

          // fetchAll
          const handle1 = duckdb.execute(
            conn,
            "SELECT * FROM null_consistency ORDER BY id",
          );
          const fetchRows = duckdb.fetchAll(handle1);
          duckdb.destroyResult(handle1);

          // stream
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM null_consistency ORDER BY id",
            )
          ) {
            streamRows.push(row);
          }

          // Both should return null for the NULL value
          assertEquals(fetchRows[0][1], null);
          assertEquals(streamRows[0][1], null);

          // Both should return 'test' for the non-NULL value
          assertEquals(fetchRows[1][1], "test");
          assertEquals(streamRows[1][1], "test");
        });
      },
    });

    await t.step({
      name: "isNull matches fetchAll null detection",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE is_null_test(id INTEGER, val TEXT)");
          exec(
            conn,
            "INSERT INTO is_null_test VALUES (1, NULL), (2, 'test')",
          );
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM is_null_test ORDER BY id",
          );

          // Row 0, col 1 should be null
          assertEquals(duckdb.isNull(handle, 0, 1), true);

          // Row 1, col 1 should not be null
          assertEquals(duckdb.isNull(handle, 1, 1), false);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});
