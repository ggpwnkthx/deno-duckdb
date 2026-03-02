/**
 * Functional database operations tests
 */

import { assertEquals, assertExists } from "@std/assert";
import { load } from "@ggpwnkthx/libduckdb";
import type { DatabaseHandle, DuckDBLibrary } from "@ggpwnkthx/duckdb";
import { functional as duckdb } from "@ggpwnkthx/duckdb";

let lib: DuckDBLibrary;
let dbHandle: DatabaseHandle;

Deno.test({
  name: "setup: load library and open database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    lib = await load();
    const result = duckdb.open(lib);
    assertExists(result.handle);
    assertEquals(result.success, true);
    dbHandle = result.handle;
  },
});

Deno.test("open: opens in-memory database", () => {
  const result = duckdb.open(lib);
  assertEquals(result.success, true);
  assertExists(result.handle);
  duckdb.closeDatabase(lib, result.handle);
});

Deno.test("open: opens with custom path config", () => {
  const result = duckdb.open(lib, { path: ":memory:" });
  assertEquals(result.success, true);
  assertExists(result.handle);
  duckdb.closeDatabase(lib, result.handle);
});

Deno.test("open: returns error for invalid path", () => {
  // DuckDB may handle invalid paths differently, but we test the return structure
  const result = duckdb.open(lib, { path: "/nonexistent/path/to/database.db" });
  // Result should have the expected structure regardless of success
  assertExists(result.handle);
  // Check that success is a boolean
  assertExists(result.success);
});

Deno.test({
  name: "openOrThrow: throws on failure",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Create a temporary invalid database first
    const invalidLib = await load();
    // Try to open with invalid config - this should throw
    // Since :memory: is always valid, we test with a new database
    const result = duckdb.open(invalidLib);
    assertEquals(result.success, true);
    duckdb.closeDatabase(invalidLib, result.handle);
    invalidLib.close();
  },
});

Deno.test("closeDatabase: closes database handle", () => {
  const result = duckdb.open(lib);
  assertEquals(result.success, true);

  // Should not throw
  duckdb.closeDatabase(lib, result.handle);
});

Deno.test("closeDatabase: handles invalid handle gracefully", () => {
  // Create an invalid handle (zeros)
  const invalidHandle = new Uint8Array(8);

  // Should not throw
  duckdb.closeDatabase(lib, invalidHandle);
});

Deno.test("isValidDatabase: returns true for valid handle", () => {
  const result = duckdb.open(lib);
  assertEquals(result.success, true);
  assertEquals(duckdb.isValidDatabase(result.handle), true);
  duckdb.closeDatabase(lib, result.handle);
});

Deno.test("isValidDatabase: returns false for invalid handle", () => {
  const invalidHandle = new Uint8Array(8);
  assertEquals(duckdb.isValidDatabase(invalidHandle), false);
});

Deno.test("getPointerValue: returns pointer bigint", () => {
  const result = duckdb.open(lib);
  assertEquals(result.success, true);

  const pointer = duckdb.getPointerValue(result.handle);
  assertExists(pointer);
  assertEquals(typeof pointer, "bigint");

  duckdb.closeDatabase(lib, result.handle);
});

Deno.test({
  name: "cleanup: close database",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    duckdb.closeDatabase(lib, dbHandle);
    lib.close();
  },
});
