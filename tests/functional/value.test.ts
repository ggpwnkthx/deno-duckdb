/**
 * Functional value extraction operations tests
 */

import { assertEquals, assertExists } from "@std/assert";
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

Deno.test("isNull: detects NULL values", () => {
  // Create table with NULL value
  duckdb.execute(
    lib,
    connHandle,
    "CREATE TABLE null_test(id INTEGER, val TEXT)",
  );
  duckdb.execute(lib, connHandle, "INSERT INTO null_test VALUES (1, NULL)");

  const result = duckdb.execute(lib, connHandle, "SELECT * FROM null_test");
  assertEquals(result.success, true);

  // The second column (index 1) should be NULL
  const isNull = duckdb.isNull(lib, result.handle, 0, 1);
  assertEquals(isNull, true);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("isNull: returns false for non-NULL values", () => {
  duckdb.execute(
    lib,
    connHandle,
    "CREATE TABLE non_null_test(id INTEGER, val TEXT)",
  );
  duckdb.execute(
    lib,
    connHandle,
    "INSERT INTO non_null_test VALUES (1, 'hello')",
  );

  const result = duckdb.execute(lib, connHandle, "SELECT * FROM non_null_test");
  assertEquals(result.success, true);

  // The second column should NOT be NULL
  const isNull = duckdb.isNull(lib, result.handle, 0, 1);
  assertEquals(isNull, false);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("getInt32: extracts INTEGER values", () => {
  const result = duckdb.execute(lib, connHandle, "SELECT 42 as num");
  assertEquals(result.success, true);

  const intVal = duckdb.getInt32(lib, result.handle, 0, 0);
  assertEquals(intVal, 42);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("getInt64: extracts BIGINT values", () => {
  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT 9223372036854775807::BIGINT as num",
  );
  assertEquals(result.success, true);

  const intVal = duckdb.getInt64(lib, result.handle, 0, 0);
  assertEquals(intVal, 9223372036854775807n);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("getDouble: extracts DOUBLE values", () => {
  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT 3.14159::DOUBLE as num",
  );
  assertEquals(result.success, true);

  const doubleVal = duckdb.getDouble(lib, result.handle, 0, 0);
  assertEquals(doubleVal, 3.14159);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("getString: extracts VARCHAR values", () => {
  const result = duckdb.execute(lib, connHandle, "SELECT 'hello world' as str");
  assertEquals(result.success, true);

  const strVal = duckdb.getString(lib, result.handle, 0, 0);
  assertEquals(strVal, "hello world");

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("fetchAll: fetches all rows from result", () => {
  duckdb.execute(
    lib,
    connHandle,
    "CREATE TABLE fetch_test(id INTEGER, name TEXT)",
  );
  duckdb.execute(
    lib,
    connHandle,
    "INSERT INTO fetch_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
  );

  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT * FROM fetch_test ORDER BY id",
  );
  assertEquals(result.success, true);

  const rows = duckdb.fetchAll(lib, result.handle);
  assertEquals(rows.length, 3);
  assertEquals(rows[0][0], 1);
  assertEquals(rows[1][0], 2);
  assertEquals(rows[2][0], 3);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("fetchAll: handles NULL values", () => {
  duckdb.execute(
    lib,
    connHandle,
    "CREATE TABLE fetch_null_test(id INTEGER, val TEXT)",
  );
  duckdb.execute(
    lib,
    connHandle,
    "INSERT INTO fetch_null_test VALUES (1, NULL), (2, 'test')",
  );

  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT * FROM fetch_null_test ORDER BY id",
  );
  assertEquals(result.success, true);

  const rows = duckdb.fetchAll(lib, result.handle);
  assertEquals(rows.length, 2);
  assertEquals(rows[0][1], null);
  assertEquals(rows[1][1], "test");

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("getValueByType: extracts value based on type", () => {
  duckdb.execute(
    lib,
    connHandle,
    "CREATE TABLE type_test(id INTEGER, val TEXT, num DOUBLE)",
  );
  duckdb.execute(
    lib,
    connHandle,
    "INSERT INTO type_test VALUES (1, 'test', 1.5)",
  );

  const result = duckdb.execute(lib, connHandle, "SELECT * FROM type_test");
  assertEquals(result.success, true);

  // Get column types
  const idType = duckdb.columnType(lib, result.handle, 0);
  const valType = duckdb.columnType(lib, result.handle, 1);
  const numType = duckdb.columnType(lib, result.handle, 2);

  // Extract values by type
  const idVal = duckdb.getValueByType(lib, result.handle, 0, 0, idType);
  const valVal = duckdb.getValueByType(lib, result.handle, 0, 1, valType);
  const numVal = duckdb.getValueByType(lib, result.handle, 0, 2, numType);
  
  assertEquals(idVal, 1);
  assertEquals(valVal, "test");
  assertEquals(numVal, 1.5);

  duckdb.destroyResult(lib, result.handle);
});

Deno.test("getValueByType: handles NULL type", () => {
  duckdb.execute(lib, connHandle, "CREATE TABLE null_type_test(val TEXT)");
  duckdb.execute(lib, connHandle, "INSERT INTO null_type_test VALUES (NULL)");

  const result = duckdb.execute(
    lib,
    connHandle,
    "SELECT * FROM null_type_test",
  );
  assertEquals(result.success, true);

  const valType = duckdb.columnType(lib, result.handle, 0);
  const val = duckdb.getValueByType(lib, result.handle, 0, 0, valType);

  assertEquals(val, null);

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
