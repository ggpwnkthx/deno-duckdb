/**
 * Functional connection operations tests
 *
 * Note: Basic connection lifecycle (validity, close behavior) is covered in contract.test.ts.
 * This file focuses on multi-connection scenarios.
 */

import { assertEquals } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { withDb } from "./utils.ts";

Deno.test({
  name: "connection: multiple connections",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Multiple connections are distinct
    await t.step({
      name: "multiple connections yield distinct handles",
      async fn() {
        await withDb(async (db) => {
          const conn1 = await duckdb.create(db);
          const conn2 = await duckdb.create(db);

          // Verify distinct handles via pointer values
          const ptr1 = duckdb.getPointerValueConnection(conn1);
          const ptr2 = duckdb.getPointerValueConnection(conn2);
          assertEquals(ptr1 !== ptr2, true);

          // Verify both are valid and independently usable
          assertEquals(duckdb.isValidConnection(conn1), true);
          assertEquals(duckdb.isValidConnection(conn2), true);

          // Execute on each to confirm independent usability
          const result1 = duckdb.execute(conn1, "SELECT 1");
          const result2 = duckdb.execute(conn2, "SELECT 2");
          assertEquals(duckdb.fetchAll(result1).length, 1);
          assertEquals(duckdb.fetchAll(result2).length, 1);
          duckdb.destroyResult(result1);
          duckdb.destroyResult(result2);

          // Close both
          duckdb.closeConnection(conn1);
          duckdb.closeConnection(conn2);
        });
      },
    });
  },
});
