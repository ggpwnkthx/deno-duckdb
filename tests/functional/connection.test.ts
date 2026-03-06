/**
 * Functional connection operations tests
 */

import { assertEquals, assertExists } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { withDb } from "./utils.ts";

Deno.test({
  name: "connection: manage connection lifecycle",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Create connection and verify it's valid
    await t.step({
      name: "create connection returns valid handle",
      async fn() {
        await withDb(async (db) => {
          const conn = await duckdb.create(db);
          assertEquals(duckdb.isValidConnection(conn), true);
          duckdb.closeConnection(conn);
        });
      },
    });

    // Connection becomes invalid after close
    await t.step({
      name: "connection is invalid after close",
      async fn() {
        await withDb(async (db) => {
          const conn = await duckdb.create(db);
          duckdb.closeConnection(conn);
          assertEquals(duckdb.isValidConnection(conn), false);
        });
      },
    });

    // Multiple connections are distinct
    await t.step({
      name: "multiple connections yield distinct handles",
      async fn() {
        await withDb(async (db) => {
          const conn1 = await duckdb.create(db);
          const conn2 = await duckdb.create(db);
          // They should be different handles
          assertExists(conn1);
          assertExists(conn2);
          // Close both
          duckdb.closeConnection(conn1);
          duckdb.closeConnection(conn2);
        });
      },
    });

    // Connection can execute query after creation
    await t.step({
      name: "connection can execute query after creation",
      async fn() {
        await withDb(async (db) => {
          const conn = await duckdb.create(db);
          const result = duckdb.execute(conn, "SELECT 1 AS x");
          const rows = duckdb.fetchAll(result);
          duckdb.destroyResult(result);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 1);
          duckdb.closeConnection(conn);
        });
      },
    });
  },
});
