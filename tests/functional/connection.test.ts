/**
 * Functional connection operations tests
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import type { ConnectionHandle, DatabaseHandle } from "@ggpwnkthx/duckdb";
import { functional as duckdb } from "@ggpwnkthx/duckdb";

let dbHandle: Awaited<ReturnType<typeof duckdb.open>>;
let connHandle: Awaited<ReturnType<typeof duckdb.create>>;

Deno.test({
  name: "setup: open database and create connection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    dbHandle = await duckdb.open();
    connHandle = await duckdb.create(dbHandle);
  },
});

Deno.test({
  name: "create: creates connection to database",
  async fn() {
    const handle = await duckdb.create(dbHandle);
    assertExists(handle);
    await duckdb.closeConnection(handle);
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
    const handle = await duckdb.create(dbHandle);

    // Should not throw
    await duckdb.closeConnection(handle);
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
    const handle = await duckdb.create(dbHandle);
    assertEquals(duckdb.isValidConnection(handle), true);
    await duckdb.closeConnection(handle);
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
    const handle = await duckdb.create(dbHandle);

    const pointer = duckdb.getPointerValueConnection(handle);
    assertExists(pointer);
    assertEquals(typeof pointer, "bigint");

    await duckdb.closeConnection(handle);
  },
});

Deno.test({
  name: "cleanup: close connection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await duckdb.closeConnection(connHandle);
  },
});
