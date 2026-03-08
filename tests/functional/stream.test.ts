/**
 * Functional stream operations tests
 */

import { assertEquals } from "@std/assert";
import type { RowData } from "@ggpwnkthx/duckdb";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec, withConn } from "./utils.ts";

const streamFn = duckdb.stream;

Deno.test({
  name: "stream: manage streaming queries",
  sanitizeResources: false,
  sanitizeOps: false,
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

// New tests for streaming semantics
Deno.test({
  name: "stream: early termination and exception handling",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Early termination with break
    await t.step({
      name: "early termination with break",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE early_term_test(id INTEGER)");
          // Insert 10 rows
          let sql = "INSERT INTO early_term_test VALUES ";
          for (let i = 1; i <= 10; i++) {
            sql += `(${i})`;
            if (i < 10) sql += ", ";
          }
          exec(conn, sql);

          // Iterate but break early (only get first 3 rows)
          const rows: RowData[] = [];
          for (
            const row of streamFn(
              conn,
              "SELECT * FROM early_term_test ORDER BY id",
            )
          ) {
            rows.push(row);
            if (rows.length >= 3) break;
          }

          assertEquals(rows.length, 3);
          assertEquals(rows[0][0], 1);
          assertEquals(rows[1][0], 2);
          assertEquals(rows[2][0], 3);
        });

        // Verify subsequent queries still work after early termination
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE after_terminate_test(id INTEGER, value TEXT)",
          );
          exec(
            conn,
            "INSERT INTO after_terminate_test VALUES (1, 'a'), (2, 'b')",
          );

          // First stream with early termination
          const rows1: RowData[] = [];
          for (
            const row of streamFn(conn, "SELECT * FROM after_terminate_test")
          ) {
            rows1.push(row);
            break;
          }
          assertEquals(rows1.length, 1);

          // Subsequent query should work fine
          const rows2: RowData[] = [];
          for (
            const row of streamFn(conn, "SELECT * FROM after_terminate_test")
          ) {
            rows2.push(row);
          }
          assertEquals(rows2.length, 2);
        });
      },
    });

    // Exception during iteration
    await t.step({
      name: "exception during iteration",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE except_test(id INTEGER, value TEXT)");
          exec(
            conn,
            "INSERT INTO except_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
          );

          // Iterate and throw exception
          let exceptionThrown = false;
          try {
            for (
              const row of streamFn(
                conn,
                "SELECT * FROM except_test ORDER BY id",
              )
            ) {
              if (row[0] === 2) {
                throw new Error("Test exception");
              }
            }
          } catch (e) {
            exceptionThrown = e instanceof Error &&
              e.message === "Test exception";
          }
          assertEquals(exceptionThrown, true);
        });

        // Verify cleanup and subsequent queries work after exception
        await withConn((conn) => {
          exec(conn, "CREATE TABLE after_except_test(id INTEGER, value TEXT)");
          exec(
            conn,
            "INSERT INTO after_except_test VALUES (1, 'x'), (2, 'y')",
          );

          // First stream throws exception
          try {
            for (
              const row of streamFn(conn, "SELECT * FROM after_except_test")
            ) {
              if (row[0] === 1) {
                throw new Error("Intentional");
              }
            }
          } catch {
            // Expected
          }

          // Subsequent query should work fine
          const rows: RowData[] = [];
          for (
            const row of streamFn(conn, "SELECT * FROM after_except_test")
          ) {
            rows.push(row);
          }
          assertEquals(rows.length, 2);
          assertEquals(rows[0][1], "x");
          assertEquals(rows[1][1], "y");
        });
      },
    });

    // Larger result set without fetchAll
    await t.step({
      name: "larger result set",
      async fn() {
        await withConn((conn) => {
          // Use generate_series to create 3500 rows efficiently
          // This crosses multiple DuckDB internal chunk boundaries (default 1024 rows/chunk)
          // Use Number() to convert bigint to regular number
          const rows: RowData[] = [];
          for (
            const row of streamFn(
              conn,
              "SELECT * FROM generate_series(1, 3500) AS t(id) ORDER BY id",
            )
          ) {
            rows.push([Number(row[0])]);
          }

          assertEquals(rows.length, 3500);
          // Verify first row
          assertEquals(rows[0][0], 1);
          // Verify middle row (around row 1750)
          assertEquals(rows[1750][0], 1751);
          // Verify last row
          assertEquals(rows[3499][0], 3500);
        });
      },
    });

    // Partial consumption doesn't poison subsequent queries
    await t.step({
      name: "partial consumption isolation",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE partial_test(id INTEGER, val TEXT)");
          exec(
            conn,
            "INSERT INTO partial_test VALUES (1, 'first'), (2, 'second'), (3, 'third')",
          );

          // First: get only first row from a stream
          let firstStreamRow: RowData | null = null;
          for (
            const row of streamFn(
              conn,
              "SELECT * FROM partial_test ORDER BY id",
            )
          ) {
            firstStreamRow = row;
            break;
          }
          assertEquals(firstStreamRow?.[0], 1);

          // Second: run a completely different query - should work
          const secondResult = duckdb.execute(conn, "SELECT 'standalone' as s");
          const secondRows = duckdb.fetchAll(secondResult);
          assertEquals(secondRows[0][0], "standalone");
          duckdb.destroyResult(secondResult);

          // Third: stream again - should work independently
          const thirdRows: RowData[] = [];
          for (
            const row of streamFn(
              conn,
              "SELECT * FROM partial_test WHERE id > 1",
            )
          ) {
            thirdRows.push(row);
          }
          assertEquals(thirdRows.length, 2);
          assertEquals(thirdRows[0][0], 2);
          assertEquals(thirdRows[1][0], 3);
        });
      },
    });

    // Boolean consistency across fetchAll and stream
    await t.step({
      name: "boolean consistency",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE bool_test(id INTEGER, flag BOOLEAN)",
          );
          exec(
            conn,
            "INSERT INTO bool_test VALUES (1, true), (2, false)",
          );

          // Test stream
          const streamRows: RowData[] = [];
          for (
            const row of streamFn(conn, "SELECT * FROM bool_test ORDER BY id")
          ) {
            streamRows.push(row);
          }

          // Test fetchAll
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM bool_test ORDER BY id",
          );
          const fetchRows = duckdb.fetchAll(handle);
          duckdb.destroyResult(handle);

          // Both should return JS boolean
          assertEquals(streamRows[0][1], true);
          assertEquals(streamRows[1][1], false);
          assertEquals(fetchRows[0][1], true);
          assertEquals(fetchRows[1][1], false);

          // Values should match
          assertEquals(streamRows[0][1], fetchRows[0][1]);
          assertEquals(streamRows[1][1], fetchRows[1][1]);
        });
      },
    });
  },
});
