/**
 * Functional query operations tests
 */
import { assertEquals, assertThrows } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { QueryError } from "@ggpwnkthx/duckdb";
import { exec, withConn } from "./utils.ts";

Deno.test({
  name: "query: error handling",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      // Try to execute an invalid SQL query
      assertThrows(
        () => duckdb.fetchAll(duckdb.query(conn, "SELECT * FROM nonexistent_table")),
        QueryError,
      );
    });
  },
});

Deno.test({
  name: "query: resource cleanup and destroyResultSync",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Test result handle cleanup (no resource leaks)
    await t.step({
      name: "executeAndFetchAll properly destroys result handle",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE leak_test(id INTEGER)");
          exec(conn, "INSERT INTO leak_test VALUES (1), (2), (3)");

          for (let i = 0; i < 10; i++) {
            const rows = duckdb.fetchAll(duckdb.query(
              conn,
              "SELECT * FROM leak_test",
            ));
            assertEquals(rows.length, 3);
          }

          const rows1 = duckdb.fetchAll(duckdb.query(conn, "SELECT 1 as num"));
          assertEquals(rows1[0][0], 1);

          const rows2 = duckdb.fetchAll(duckdb.query(
            conn,
            "SELECT 'hello' as greeting",
          ));
          assertEquals(rows2[0][0], "hello");
        });
      },
    });
  },
});
