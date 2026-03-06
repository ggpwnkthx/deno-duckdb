/**
 * Functional connection operations tests
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import type { ConnectionHandle, DatabaseHandle } from "@ggpwnkthx/duckdb";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { withConn, withDb } from "../_util.ts";

// Warm-up test to trigger library loading once for all tests
Deno.test({
  name: "warmup: load library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await duckdb.open();
    duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "connection: manage connection lifecycle",
  async fn(t) {
    // Step 1: create connection
    await t.step({
      name: "create connection",
      async fn() {
        // Creates a valid connection
        await withDb(async (db) => {
          const handle = await duckdb.create(db);
          assertExists(handle);
          duckdb.closeConnection(handle);
        });

        // Throws for invalid database handle
        const invalidHandle = new Uint8Array(8);
        await assertRejects(
          async () =>
            await duckdb.create(invalidHandle as unknown as DatabaseHandle),
          Error,
        );
      },
    });

    // Step 2: validate connection
    await t.step({
      name: "validate connection",
      async fn() {
        // Returns true for valid handle
        await withDb(async (db) => {
          const handle = await duckdb.create(db);
          assertEquals(duckdb.isValidConnection(handle), true);
          duckdb.closeConnection(handle);
        });

        // Returns false for invalid handle
        const invalidHandle = new Uint8Array(8);
        assertEquals(
          duckdb.isValidConnection(
            invalidHandle as unknown as ConnectionHandle,
          ),
          false,
        );
      },
    });

    // Step 3: get pointer value
    await t.step({
      name: "get pointer value",
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
  },
});
