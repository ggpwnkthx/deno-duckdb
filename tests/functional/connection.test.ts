/**
 * Functional connection operations tests
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import type { ConnectionHandle, DatabaseHandle } from "@ggpwnkthx/duckdb";
import { functional as duckdb } from "@ggpwnkthx/duckdb";
import { withConn, withDb } from "../_util.ts";

// Warm-up test to trigger library loading once for all tests
Deno.test({
  name: "warmup: load library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await duckdb.open();
    await duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "create: creates connection to database",
  async fn() {
    await withDb(async (db) => {
      const handle = await duckdb.create(db);
      assertExists(handle);
      await duckdb.closeConnection(handle);
    });
  },
});

Deno.test({
  name: "create: throws for invalid database handle",
  async fn() {
    // Use an invalid handle - should throw
    const invalidHandle = new Uint8Array(8);
    await assertRejects(
      async () =>
        await duckdb.create(invalidHandle as unknown as DatabaseHandle),
      Error,
    );
  },
});

Deno.test({
  name: "closeConnection: closes connection handle",
  async fn() {
    await withDb(async (db) => {
      const handle = await duckdb.create(db);
      // Should not throw
      await duckdb.closeConnection(handle);
    });
  },
});

Deno.test("closeConnection: handles invalid handle gracefully", async () => {
  const invalidHandle = new Uint8Array(8);

  // Should not throw
  await duckdb.closeConnection(invalidHandle as unknown as ConnectionHandle);
});

Deno.test({
  name: "isValidConnection: returns true for valid handle",
  async fn() {
    await withDb(async (db) => {
      const handle = await duckdb.create(db);
      assertEquals(duckdb.isValidConnection(handle), true);
      await duckdb.closeConnection(handle);
    });
  },
});

Deno.test("isValidConnection: returns false for invalid handle", () => {
  const invalidHandle = new Uint8Array(8);
  assertEquals(
    duckdb.isValidConnection(invalidHandle as unknown as ConnectionHandle),
    false,
  );
});

Deno.test({
  name: "getPointerValueConnection: returns pointer bigint",
  async fn() {
    await withConn(async (conn) => {
      // Using await on an async function to avoid linter warning
      const conn2 = await Promise.resolve(conn);
      const pointer = duckdb.getPointerValueConnection(conn2);
      assertExists(pointer);
      assertEquals(typeof pointer, "bigint");
    });
  },
});
