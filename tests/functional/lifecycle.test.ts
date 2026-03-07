/**
 * Functional lifecycle and resource misuse tests
 *
 * Tests operations after resource destruction/closure to verify proper error handling
 * and safe behavior.
 *
 * Note: FFI limitation - operating on invalidated handles may segfault rather than
 * throwing errors. Tests account for this by verifying handle invalidation via
 * isValidConnection/isValidDatabase rather than attempting operations on closed handles.
 */

import { assertEquals } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { withConn, withDb } from "./utils.ts";

Deno.test({
  name: "lifecycle: connection closed state",
  // FFI loads dynamic library - cannot fully sanitize without explicit library unload
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // After closing a connection, isValidConnection should return false
    await t.step({
      name: "isValidConnection returns false after close",
      async fn() {
        await withDb(async (db) => {
          const conn = await duckdb.create(db);
          // Verify connection is valid before closing
          assertEquals(duckdb.isValidConnection(conn), true);
          // Close the connection
          duckdb.closeConnection(conn);
          // After closing, should return false
          assertEquals(duckdb.isValidConnection(conn), false);
        });
      },
    });
  },
});

Deno.test({
  name: "lifecycle: destroyed result handle operations",
  async fn(t) {
    // Double destroy should be safe
    await t.step({
      name: "double destroy result is safe",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          duckdb.destroyResult(handle);
          // Second destroy should not throw
          duckdb.destroyResult(handle);
        });
      },
    });

    // Double destroy prepared should be safe
    await t.step({
      name: "double destroy prepared is safe",
      async fn() {
        await withConn((conn) => {
          const prepHandle = duckdb.prepare(conn, "SELECT 1");
          duckdb.destroyPrepared(prepHandle);
          // Second destroy should not throw
          duckdb.destroyPrepared(prepHandle);
        });
      },
    });
  },
});

Deno.test({
  name: "lifecycle: database close behavior",
  async fn(t) {
    // Database close - connection may remain valid (FFI behavior)
    await t.step({
      name: "connection state after database close",
      async fn() {
        await withDb(async (db) => {
          const conn = await duckdb.create(db);
          // Verify connection is valid before DB close
          assertEquals(duckdb.isValidConnection(conn), true);
          // Verify database is valid before closing
          assertEquals(duckdb.isValidDatabase(db), true);

          // Close database while connection exists
          duckdb.closeDatabase(db);

          // Database should now be invalid
          assertEquals(duckdb.isValidDatabase(db), false);

          // Connection may still report valid - this is FFI-level behavior
          // The connection's internal pointer may not be automatically invalidated
          // But we should still close it for proper cleanup
          duckdb.closeConnection(conn);

          // After explicit close, connection should be invalid
          assertEquals(duckdb.isValidConnection(conn), false);
        });
      },
    });
  },
});

Deno.test({
  name: "lifecycle: double-destroy/double-close safety",
  async fn(t) {
    // Double close connection is safe
    await t.step({
      name: "double close connection is safe",
      async fn() {
        await withDb(async (db) => {
          const conn = await duckdb.create(db);
          duckdb.closeConnection(conn);
          // Second close should not throw
          duckdb.closeConnection(conn);
        });
      },
    });

    // Double close database is safe
    await t.step({
      name: "double close database is safe",
      async fn() {
        const db = await duckdb.open();
        duckdb.closeDatabase(db);
        // Second close should not throw
        duckdb.closeDatabase(db);
      },
    });
  },
});
