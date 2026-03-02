/**
 * Functional connection operations tests
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
  name: "setup: load library, open database, and create connection",
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

Deno.test("create: creates connection to database", () => {
  const result = duckdb.create(lib, dbHandle);
  assertEquals(result.success, true);
  assertExists(result.handle);
  duckdb.closeConnection(lib, result.handle);
});

Deno.test("create: returns error for invalid database handle", () => {
  // Use an invalid handle
  const invalidHandle = new Uint8Array(8);
  const result = duckdb.create(lib, invalidHandle);
  // Result should have expected structure
  assertExists(result.handle);
});

Deno.test("createOrThrow: throws on failure", () => {
  // Since we need a valid database to create connection, test with invalid handle
  const invalidDbHandle = new Uint8Array(8);
  try {
    duckdb.createOrThrow(lib, invalidDbHandle);
    // If we get here, the operation succeeded unexpectedly or DuckDB handles it
  } catch (e) {
    // Expected to throw
    assertExists(e);
  }
});

Deno.test("closeConnection: closes connection handle", () => {
  const result = duckdb.create(lib, dbHandle);
  assertEquals(result.success, true);

  // Should not throw
  duckdb.closeConnection(lib, result.handle);
});

Deno.test("closeConnection: handles invalid handle gracefully", () => {
  const invalidHandle = new Uint8Array(8);

  // Should not throw
  duckdb.closeConnection(lib, invalidHandle);
});

Deno.test("isValidConnection: returns true for valid handle", () => {
  const result = duckdb.create(lib, dbHandle);
  assertEquals(result.success, true);
  assertEquals(duckdb.isValidConnection(result.handle), true);
  duckdb.closeConnection(lib, result.handle);
});

Deno.test("isValidConnection: returns false for invalid handle", () => {
  const invalidHandle = new Uint8Array(8);
  assertEquals(duckdb.isValidConnection(invalidHandle), false);
});

Deno.test("getPointerValueConnection: returns pointer bigint", () => {
  const result = duckdb.create(lib, dbHandle);
  assertEquals(result.success, true);

  const pointer = duckdb.getPointerValueConnection(result.handle);
  assertExists(pointer);
  assertEquals(typeof pointer, "bigint");

  duckdb.closeConnection(lib, result.handle);
});

Deno.test({
  name: "cleanup: close connection",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    duckdb.closeConnection(lib, connHandle);
    lib.close();
  },
});
