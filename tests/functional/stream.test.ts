/**
 * Functional stream operations tests
 */

import { assertEquals } from "@std/assert";
import type { RowData } from "@ggpwnkthx/duckdb";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
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

const streamFn = duckdb.stream;

Deno.test({
  name: "stream: manage streaming queries",
  async fn(t) {
    // Step 1: basic streaming
    await t.step({
      name: "basic streaming",
      async fn() {
        // Yields rows from query
        await withConn((conn) => {
          // Set up test data
          exec(
            conn,
            "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
          );
          exec(
            conn,
            "INSERT INTO stream_test VALUES (1, 'Alice', 100.5), (2, 'Bob', 200.5), (3, 'Charlie', 300.5)",
          );

          // Use stream
          const rows: RowData[] = [];
          for (
            const row of streamFn(
              conn,
              "SELECT * FROM stream_test ORDER BY id",
            )
          ) {
            rows.push(row);
          }

          assertEquals(rows.length, 3);
          assertEquals(rows[0][0], 1);
          assertEquals(rows[0][1], "Alice");
          assertEquals(rows[1][0], 2);
          assertEquals(rows[1][1], "Bob");
          assertEquals(rows[2][0], 3);
          assertEquals(rows[2][1], "Charlie");
        });

        // Handles empty result
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
          );
          exec(
            conn,
            "INSERT INTO stream_test VALUES (1, 'Alice', 100.5)",
          );
          const rows: RowData[] = [];
          for (
            const row of streamFn(
              conn,
              "SELECT * FROM stream_test WHERE id > 100",
            )
          ) {
            rows.push(row);
          }
          assertEquals(rows.length, 0);
        });

        // Handles single row
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
          );
          exec(
            conn,
            "INSERT INTO stream_test VALUES (1, 'Alice', 100.5), (2, 'Bob', 200.5)",
          );
          const rows: RowData[] = [];
          for (
            const row of streamFn(
              conn,
              "SELECT * FROM stream_test WHERE id = 2",
            )
          ) {
            rows.push(row);
          }
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 2);
          assertEquals(rows[0][1], "Bob");
        });

        // Handles NULL string values
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
          );
          exec(
            conn,
            "INSERT INTO stream_test VALUES (1, 'Alice', 100.5), (4, NULL, 400.5)",
          );
          const rows: RowData[] = [];
          for (
            const row of streamFn(
              conn,
              "SELECT * FROM stream_test WHERE id = 4",
            )
          ) {
            rows.push(row);
          }
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 4);
          assertEquals(rows[0][1], null);
        });
      },
    });

    // Step 2: type handling
    await t.step({
      name: "type handling",
      async fn() {
        // HUGEINT values
        await withConn((conn) => {
          const rows: RowData[] = [];
          for (
            const row of streamFn(conn, "SELECT 1::HUGEINT")
          ) {
            rows.push(row);
          }
          assertEquals(rows[0][0], 1n);
        });

        // HUGEINT large positive
        await withConn((conn) => {
          const rows: RowData[] = [];
          for (
            const row of streamFn(
              conn,
              "SELECT (pow(2,80) + 12345)::HUGEINT as v",
            )
          ) {
            rows.push(row);
          }
          assertEquals(rows[0][0], 1208925819614629174706176n);
        });

        // HUGEINT NULL handling
        await withConn((conn) => {
          exec(conn, "CREATE TABLE stream_hugeint_null(v HUGEINT)");
          exec(
            conn,
            "INSERT INTO stream_hugeint_null VALUES (NULL), (42::HUGEINT)",
          );
          const rows: RowData[] = [];
          for (
            const row of streamFn(conn, "SELECT * FROM stream_hugeint_null")
          ) {
            rows.push(row);
          }
          assertEquals(rows[0][0], null);
          assertEquals(rows[1][0], 42n);
        });

        // FLOAT values
        await withConn((conn) => {
          const rows: RowData[] = [];
          for (
            const row of streamFn(conn, "SELECT 1.5::FLOAT")
          ) {
            rows.push(row);
          }
          assertEquals(rows[0][0], 1.5);
        });

        // SMALLINT values
        await withConn((conn) => {
          const rows: RowData[] = [];
          for (
            const row of streamFn(conn, "SELECT 32767::SMALLINT")
          ) {
            rows.push(row);
          }
          assertEquals(rows[0][0], 32767);
        });
      },
    });

    // Step 3: edge cases
    await t.step({
      name: "edge cases",
      async fn() {
        // Handles aggregate queries
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
          );
          exec(
            conn,
            "INSERT INTO stream_test VALUES (1, 'Alice', 100.5), (2, 'Bob', 200.5), (3, 'Charlie', 300.5)",
          );
          const rows: RowData[] = [];
          for (
            const row of streamFn(
              conn,
              "SELECT COUNT(*), SUM(id) FROM stream_test",
            )
          ) {
            rows.push(row);
          }
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 3n);
        });
      },
    });
  },
});
