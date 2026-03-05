/**
 * Functional stream operations tests
 */

import { assertEquals } from "@std/assert";
import { functional as duckdb, type RowData } from "@ggpwnkthx/duckdb";

const streamFn = duckdb.stream;

let dbHandle: Awaited<ReturnType<typeof duckdb.open>>;
let connHandle: Awaited<ReturnType<typeof duckdb.create>>;

Deno.test({
  name: "setup: open database, create connection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    dbHandle = await duckdb.open();
    connHandle = await duckdb.create(dbHandle);

    // Create test table
    await duckdb.execute(
      connHandle,
      "CREATE TABLE stream_test(id INTEGER, name VARCHAR, value DOUBLE)",
    );

    // Insert test data
    await duckdb.execute(
      connHandle,
      "INSERT INTO stream_test VALUES (1, 'Alice', 100.5), (2, 'Bob', 200.5), (3, 'Charlie', 300.5)",
    );
  },
});

Deno.test({
  name: "stream: yields rows from query",
  async fn() {
    const rows: RowData[] = [];
    for await (
      const row of streamFn(
        connHandle,
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
  },
});

Deno.test({
  name: "stream: handles empty result",
  async fn() {
    const rows: RowData[] = [];
    for await (
      const row of streamFn(
        connHandle,
        "SELECT * FROM stream_test WHERE id > 100",
      )
    ) {
      rows.push(row);
    }

    assertEquals(rows.length, 0);
  },
});

Deno.test({
  name: "stream: handles single row",
  async fn() {
    const rows: RowData[] = [];
    for await (
      const row of streamFn(
        connHandle,
        "SELECT * FROM stream_test WHERE id = 2",
      )
    ) {
      rows.push(row);
    }

    assertEquals(rows.length, 1);
    assertEquals(rows[0][0], 2);
    assertEquals(rows[0][1], "Bob");
  },
});

Deno.test({
  name: "stream: handles NULL string values",
  async fn() {
    // Insert row with NULL string
    await duckdb.execute(
      connHandle,
      "INSERT INTO stream_test VALUES (4, NULL, 400.5)",
    );

    const rows: RowData[] = [];
    for await (
      const row of streamFn(
        connHandle,
        "SELECT * FROM stream_test WHERE id = 4",
      )
    ) {
      rows.push(row);
    }

    assertEquals(rows.length, 1);
    assertEquals(rows[0][0], 4);
    assertEquals(rows[0][1], null); // NULL name is properly handled for strings
  },
});

Deno.test({
  name: "stream: handles aggregate queries",
  async fn() {
    const rows: RowData[] = [];
    for await (
      const row of streamFn(
        connHandle,
        "SELECT COUNT(*), SUM(id) FROM stream_test",
      )
    ) {
      rows.push(row);
    }

    assertEquals(rows.length, 1);
    assertEquals(rows[0][0], 4n); // COUNT(*)
  },
});

Deno.test({
  name: "teardown: close connection and database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await duckdb.closeConnection(connHandle);
    await duckdb.closeDatabase(dbHandle);
  },
});
