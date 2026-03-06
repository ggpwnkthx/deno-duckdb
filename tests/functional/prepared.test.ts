/**
 * Functional prepared statement operations tests
 */
import { assertEquals, assertExists, assertThrows } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec, withConn } from "../_util.ts";

// Warm-up test to trigger library loading once for all tests
Deno.test({
  name: "warmup: load library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await duckdb.open();
    const conn = await duckdb.create(db);
    duckdb.closeConnection(conn);
    duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "prepared: manage prepared statements",
  async fn(t) {
    // Step 1: prepare statements
    await t.step({
      name: "prepare statements",
      async fn() {
        // Prepares SELECT statement
        await withConn((conn) => {
          // Use exec for DDL/INSERT
          exec(conn, "CREATE TABLE prepare_test(id INTEGER, name VARCHAR)");
          exec(conn, "INSERT INTO prepare_test VALUES (1, 'test')");
          const handle = duckdb.prepare(
            conn,
            "SELECT * FROM prepare_test WHERE id = ?",
          );
          assertExists(handle);
          duckdb.destroyPrepared(handle);
        });

        // Throws for invalid SQL
        await withConn((conn) => {
          assertThrows(
            () =>
              duckdb.prepare(
                conn,
                "SELECT * FROM nonexistent_table WHERE ?",
              ),
            Error,
          );
        });
      },
    });

    // Step 2: execute prepared
    await t.step({
      name: "execute prepared",
      async fn() {
        // Executes prepared statement
        await withConn((conn) => {
          const prepHandle = duckdb.prepare(conn, "SELECT 1 as num");
          const execHandle = duckdb.executePrepared(prepHandle);
          assertExists(execHandle);
          duckdb.destroyPrepared(prepHandle);
          duckdb.destroyResult(execHandle);
        });

        // Returns column count
        await withConn((conn) => {
          const prepHandle = duckdb.prepare(
            conn,
            "SELECT 1 as a, 2 as b, 3 as c",
          );
          const count = duckdb.preparedColumnCount(prepHandle);
          assertEquals(count, 3n);
          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Step 3: prepared workflow
    await t.step({
      name: "prepared workflow",
      async fn() {
        // Frees prepared statement
        await withConn((conn) => {
          const handle = duckdb.prepare(conn, "SELECT 1");
          duckdb.destroyPrepared(handle);
          duckdb.destroyPrepared(handle);
        });

        // Full workflow: prepare, execute, and fetch results
        await withConn((conn) => {
          // Use exec for DDL/INSERT
          exec(conn, "CREATE TABLE workflow_test(id INTEGER, value TEXT)");
          exec(
            conn,
            "INSERT INTO workflow_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
          );
          // Prepare statement - no parameter
          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM workflow_test WHERE id > 0",
          );
          // Execute
          const execHandle = duckdb.executePrepared(prepHandle);
          // Verify results
          const rowCount = duckdb.rowCount(execHandle);
          assertEquals(rowCount, 3n);
          // Cleanup
          duckdb.destroyPrepared(prepHandle);
          duckdb.destroyResult(execHandle);
        });
      },
    });
  },
});
