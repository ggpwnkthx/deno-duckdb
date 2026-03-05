/**
 * Functional stream operations tests
 */

import { assertEquals } from "@std/assert";
import { functional as duckdb, type RowData } from "@ggpwnkthx/duckdb";
import { exec, withConn } from "../_util.ts";

const streamFn = duckdb.stream;

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
  name: "stream: yields rows from query",
  async fn() {
    await withConn(async (conn) => {
      // Set up test data
      await exec(
        conn,
        "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
      );
      await exec(
        conn,
        "INSERT INTO stream_test VALUES (1, 'Alice', 100.5), (2, 'Bob', 200.5), (3, 'Charlie', 300.5)",
      );

      // Use stream
      const rows: RowData[] = [];
      for await (
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
  },
});

Deno.test({
  name: "stream: handles empty result",
  async fn() {
    await withConn(async (conn) => {
      await exec(
        conn,
        "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
      );
      await exec(
        conn,
        "INSERT INTO stream_test VALUES (1, 'Alice', 100.5)",
      );

      const rows: RowData[] = [];
      for await (
        const row of streamFn(
          conn,
          "SELECT * FROM stream_test WHERE id > 100",
        )
      ) {
        rows.push(row);
      }

      assertEquals(rows.length, 0);
    });
  },
});

Deno.test({
  name: "stream: handles single row",
  async fn() {
    await withConn(async (conn) => {
      await exec(
        conn,
        "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
      );
      await exec(
        conn,
        "INSERT INTO stream_test VALUES (1, 'Alice', 100.5), (2, 'Bob', 200.5)",
      );

      const rows: RowData[] = [];
      for await (
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
  },
});

Deno.test({
  name: "stream: handles NULL string values",
  async fn() {
    await withConn(async (conn) => {
      await exec(
        conn,
        "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
      );
      await exec(
        conn,
        "INSERT INTO stream_test VALUES (1, 'Alice', 100.5), (4, NULL, 400.5)",
      );

      const rows: RowData[] = [];
      for await (
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

Deno.test({
  name: "stream: handles aggregate queries",
  async fn() {
    await withConn(async (conn) => {
      await exec(
        conn,
        "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
      );
      await exec(
        conn,
        "INSERT INTO stream_test VALUES (1, 'Alice', 100.5), (2, 'Bob', 200.5), (3, 'Charlie', 300.5)",
      );

      const rows: RowData[] = [];
      for await (
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
