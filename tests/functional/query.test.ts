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

let dbHandle: Awaited<ReturnType<typeof duckdb.open>>;
let connHandle: Awaited<ReturnType<typeof duckdb.create>>;

Deno.test({
  name: "setup: open database, create connection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    dbHandle = await duckdb.open();
    connHandle = await duckdb.create(dbHandle);
  },
});

Deno.test({
  name: "execute: executes SELECT query",
  async fn() {
    const handle = await duckdb.execute(connHandle, "SELECT 1 as num");
    assertExists(handle);

    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "execute: executes INSERT query",
  async fn() {
    // Create a table first
    await duckdb.execute(
      connHandle,
      "CREATE TABLE test(id INTEGER, name VARCHAR)",
    );

    const handle = await duckdb.execute(
      connHandle,
      "INSERT INTO test VALUES (1, 'test')",
    );
    assertExists(handle);

    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "execute: throws for invalid SQL",
  async fn() {
    await assertRejects(
      async () =>
        await duckdb.execute(
          connHandle,
          "SELECT * FROM nonexistent_table",
        ),
      Error,
    );
  },
});

Deno.test({
  name: "rowCount: returns correct row count",
  async fn() {
    // Create table and insert data
    await duckdb.execute(connHandle, "CREATE TABLE row_count_test(id INTEGER)");
    await duckdb.execute(
      connHandle,
      "INSERT INTO row_count_test VALUES (1), (2), (3)",
    );

    const handle = await duckdb.execute(
      connHandle,
      "SELECT * FROM row_count_test",
    );

    const count = await duckdb.rowCount(handle);
    assertEquals(count, 3n);

    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "rowCount: returns 0 for empty result",
  async fn() {
    const handle = await duckdb.execute(
      connHandle,
      "SELECT * FROM (SELECT 1) WHERE 1=0",
    );

    const count = await duckdb.rowCount(handle);
    assertEquals(count, 0n);

    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "columnCount: returns column count",
  async fn() {
    const handle = await duckdb.execute(
      connHandle,
      "SELECT 1 as a, 2 as b, 3 as c",
    );

    const count = await duckdb.columnCount(handle);
    assertEquals(count, 3n);

    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "columnName: returns column name",
  async fn() {
    const handle = await duckdb.execute(connHandle, "SELECT 1 as my_column");

    const name = await duckdb.columnName(handle, 0);
    assertEquals(name, "my_column");

    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "columnName: returns empty string for invalid index",
  async fn() {
    const handle = await duckdb.execute(connHandle, "SELECT 1");

    const name = await duckdb.columnName(handle, 999);
    assertEquals(name, "");

    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "columnType: returns column type",
  async fn() {
    const handle = await duckdb.execute(
      connHandle,
      "SELECT 1 as num, 'text' as str",
    );

    // INTEGER type is 4
    const intType = await duckdb.columnType(handle, 0);
    assertGreater(intType, 0);

    // VARCHAR type is 17
    const strType = await duckdb.columnType(handle, 1);
    assertGreater(strType, 0);

    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "columnInfos: returns all column info",
  async fn() {
    const handle = await duckdb.execute(
      connHandle,
      "SELECT 1 as id, 'test' as name",
    );

    const infos = await duckdb.columnInfos(handle);
    assertEquals(infos.length, 2);
    assertEquals(infos[0].name, "id");
    assertEquals(infos[1].name, "name");

    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "destroyResult: frees result memory",
  async fn() {
    const handle = await duckdb.execute(connHandle, "SELECT 1");

    // Should not throw
    await duckdb.destroyResult(handle);

    // Destroying again should be safe
    await duckdb.destroyResult(handle);
  },
});

Deno.test({
  name: "cleanup: close connection and database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await duckdb.closeConnection(connHandle);
    await duckdb.closeDatabase(dbHandle);
  },
});
