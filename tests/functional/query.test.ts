/**
 * Functional query operations tests
 */

import { assertEquals, assertExists, assertGreater } from "@std/assert";
import { load } from "@ggpwnkthx/libduckdb";
import type {
  ConnectionHandle,
  DatabaseHandle,
  DuckDBLibrary,
} from "@ggpwnkthx/duckdb";
import { functional as duckdb } from "@ggpwnkthx/duckdb";

let lib: DuckDBLibrary;
let dbHandle: DatabaseHandle;
let connHandle: ConnectionHandle;

Deno.test({
  name: "setup: load library, open database, create connection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    lib = await load();
    const dbResult = duckdb.open(lib);
    assertExists(dbResult.handle);
    dbHandle = dbResult.handle;

    const connResult = duckdb.create(lib, dbHandle);
    assertExists(connResult.handle);
    connHandle = connResult.handle;
  },
});

Deno.test("execute: executes SELECT query", () => {
  const result = duckdb.execute(lib, connHandle, "SELECT 1 as num");
  assertEquals(result.success, true);
  assertExists(result.handle);
  assertEquals(result.query, "SELECT 1 as num");

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("execute: executes INSERT query", () => {
  // Create a table first
  duckdb.execute(
    lib,
    connHandle,
    "CREATE TABLE test(id INTEGER, name VARCHAR)",
  );

  const result = duckdb.execute(
    lib,
    connHandle,
    "INSERT INTO test VALUES (1, 'test')",
  );
  assertEquals(result.success, true);
  assertExists(result.handle);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("execute: returns error for invalid SQL", () => {
  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT * FROM nonexistent_table",
  );
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("executeOrThrow: throws on error", () => {
  try {
    duckdb.executeOrThrow(lib, connHandle, "SELECT * FROM nonexistent_table");
    // Should not reach here
    throw new Error("Expected error was not thrown");
  } catch (e) {
    assertExists(e);
  }
});

Deno.test("rowCount: returns correct row count", () => {
  // Create table and insert data
  duckdb.execute(lib, connHandle, "CREATE TABLE row_count_test(id INTEGER)");
  duckdb.execute(
    lib,
    connHandle,
    "INSERT INTO row_count_test VALUES (1), (2), (3)",
  );

  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT * FROM row_count_test",
  );
  assertEquals(result.success, true);

  const count = duckdb.rowCount(lib, result.handle);
  assertEquals(count, 3n);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("rowCount: returns 0 for empty result", () => {
  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT * FROM (SELECT 1) WHERE 1=0",
  );
  assertEquals(result.success, true);

  const count = duckdb.rowCount(lib, result.handle);
  assertEquals(count, 0n);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("columnCount: returns column count", () => {
  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT 1 as a, 2 as b, 3 as c",
  );
  assertEquals(result.success, true);

  const count = duckdb.columnCount(lib, result.handle);
  assertEquals(count, 3n);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("columnName: returns column name", () => {
  const result = duckdb.execute(lib, connHandle, "SELECT 1 as my_column");
  assertEquals(result.success, true);

  const name = duckdb.columnName(lib, result.handle, 0);
  assertEquals(name, "my_column");

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("columnName: returns empty string for invalid index", () => {
  const result = duckdb.execute(lib, connHandle, "SELECT 1");
  assertEquals(result.success, true);

  const name = duckdb.columnName(lib, result.handle, 999);
  assertEquals(name, "");

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("columnType: returns column type", () => {
  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT 1 as num, 'text' as str",
  );
  assertEquals(result.success, true);

  // INTEGER type is 4
  const intType = duckdb.columnType(lib, result.handle, 0);
  assertGreater(intType, 0);

  // VARCHAR type is 17
  const strType = duckdb.columnType(lib, result.handle, 1);
  assertGreater(strType, 0);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("columnInfos: returns all column info", () => {
  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT 1 as id, 'test' as name",
  );
  assertEquals(result.success, true);

  const infos = duckdb.columnInfos(lib, result.handle);
  assertEquals(infos.length, 2);
  assertEquals(infos[0].name, "id");
  assertEquals(infos[1].name, "name");

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("destroyResult: frees result memory", () => {
  const result = duckdb.execute(lib, connHandle, "SELECT 1");
  assertEquals(result.success, true);

  // Should not throw
  duckdb.destroyResult(lib, result.handle);

  // Destroying again should be safe
  duckdb.destroyResult(lib, result.handle);
});

Deno.test({
  name: "cleanup: close connection and database",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    duckdb.closeConnection(lib, connHandle);
    duckdb.closeDatabase(lib, dbHandle);
    lib.close();
  },
});
