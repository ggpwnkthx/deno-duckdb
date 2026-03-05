/**
 * Functional database operations tests
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { functional as duckdb } from "@ggpwnkthx/duckdb";

// Warm-up test to trigger library loading once for all tests
// This prevents the FFI resource sanitizer from failing subsequent tests
Deno.test({
  name: "warmup: load library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // This first test loads the library and lets it persist
    const handle = await duckdb.open();
    await duckdb.closeDatabase(handle);
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
  name: "open: throws for invalid SQL",
  async fn() {
    // Test SQL parse error instead of invalid path (cross-platform)
    await withConn(async (conn) => {
      await assertRejects(
        async () => await duckdb.execute(conn, "SELCT 1"),
        Error,
      );
    });
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
  const invalidHandle = new Uint8Array(8) as unknown as Awaited<
    ReturnType<typeof duckdb.open>
  >;

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

    await duckdb.closeDatabase(handle);
  },
});

// Helper function for the SQL parse error test
async function withConn<T>(
  fn: (conn: Awaited<ReturnType<typeof duckdb.create>>) => Promise<T>,
): Promise<T> {
  const db = await duckdb.open();
  try {
    const conn = await duckdb.create(db);
    try {
      return await fn(conn);
    } finally {
      await duckdb.closeConnection(conn);
    }
  } finally {
    await duckdb.closeDatabase(db);
  }
}
