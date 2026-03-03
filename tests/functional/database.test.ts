/**
 * Functional database operations tests
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { functional as duckdb } from "@ggpwnkthx/duckdb";

let dbHandle: Awaited<ReturnType<typeof duckdb.open>>;

Deno.test({
  name: "setup: open database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    dbHandle = await duckdb.open();
    assertExists(dbHandle);
  },
});

Deno.test({
  name: "open: opens in-memory database",
  async fn() {
    const handle = await duckdb.open();
    assertExists(handle);
    await duckdb.closeDatabase(handle);
  },
});

Deno.test({
  name: "open: opens with custom path config",
  async fn() {
    const handle = await duckdb.open({ path: ":memory:" });
    assertExists(handle);
    await duckdb.closeDatabase(handle);
  },
});

Deno.test({
  name: "open: throws for invalid path",
  async fn() {
    // DuckDB may handle invalid paths differently - test that it throws
    await assertRejects(
      async () =>
        await duckdb.open({ path: "/nonexistent/path/to/database.db" }),
      Error,
    );
  },
});

Deno.test({
  name: "closeDatabase: closes database handle",
  async fn() {
    const handle = await duckdb.open();

    // Should not throw
    await duckdb.closeDatabase(handle);
  },
});

Deno.test("closeDatabase: handles invalid handle gracefully", async () => {
  // Create an invalid handle (zeros)
  const invalidHandle = new Uint8Array(8);

  // Should not throw
  await duckdb.closeDatabase(invalidHandle);
});

Deno.test({
  name: "isValidDatabase: returns true for valid handle",
  async fn() {
    const handle = await duckdb.open();
    assertEquals(duckdb.isValidDatabase(handle), true);
    await duckdb.closeDatabase(handle);
  },
});

Deno.test("isValidDatabase: returns false for invalid handle", () => {
  const invalidHandle = new Uint8Array(8);
  assertEquals(duckdb.isValidDatabase(invalidHandle), false);
});

Deno.test({
  name: "getPointerValue: returns pointer bigint",
  async fn() {
    const handle = await duckdb.open();

    const pointer = duckdb.getPointerValue(handle);
    assertExists(pointer);
    assertEquals(typeof pointer, "bigint");

    await duckdb.closeDatabase(handle);
  },
});

Deno.test({
  name: "cleanup: close database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await duckdb.closeDatabase(dbHandle);
  },
});
