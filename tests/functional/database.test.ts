/**
 * Functional database operations tests
 */

import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { functional as duckdb } from "@ggpwnkthx/duckdb";
import { withConn } from "../_util.ts";

// Warm-up test to trigger library loading once for all tests
// This prevents the FFI resource sanitizer from failing subsequent tests
Deno.test({
  name: "warmup: load library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const handle = await duckdb.open();
    duckdb.closeDatabase(handle);
  },
});

Deno.test({
  name: "open: opens in-memory database",
  async fn() {
    const handle = await duckdb.open();
    assertExists(handle);
    duckdb.closeDatabase(handle);
  },
});

Deno.test({
  name: "open: opens with custom path config",
  async fn() {
    const handle = await duckdb.open({ path: ":memory:" });
    assertExists(handle);
    duckdb.closeDatabase(handle);
  },
});

Deno.test({
  name: "open: throws for invalid SQL",
  async fn() {
    // Test SQL parse error instead of invalid path (cross-platform)
    await withConn((conn) => {
      assertThrows(
        () => duckdb.execute(conn, "SELCT 1"),
        Error,
      );
    });
  },
});

Deno.test({
  name: "closeDatabase: closes database handle",
  async fn() {
    const handle = await duckdb.open();
    duckdb.closeDatabase(handle);
  },
});

Deno.test("closeDatabase: handles invalid handle gracefully", () => {
  // Create an invalid handle (zeros)
  const invalidHandle = new Uint8Array(8) as unknown as Awaited<
    ReturnType<typeof duckdb.open>
  >;
  duckdb.closeDatabase(invalidHandle);
});

Deno.test({
  name: "isValidDatabase: returns true for valid handle",
  async fn() {
    const handle = await duckdb.open();
    assertEquals(duckdb.isValidDatabase(handle), true);
    duckdb.closeDatabase(handle);
  },
});

Deno.test("isValidDatabase: returns false for invalid handle", () => {
  const invalidHandle = new Uint8Array(8) as unknown as Awaited<
    ReturnType<typeof duckdb.open>
  >;
  assertEquals(duckdb.isValidDatabase(invalidHandle), false);
});

Deno.test({
  name: "getPointerValue: returns pointer bigint",
  async fn() {
    const handle = await duckdb.open();
    const pointer = duckdb.getPointerValue(handle);
    assertExists(pointer);
    assertEquals(typeof pointer, "bigint");
    duckdb.closeDatabase(handle);
  },
});
