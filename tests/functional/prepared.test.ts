/**
 * Functional prepared statement operations tests
 */
import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { functional as duckdb } from "@ggpwnkthx/duckdb";
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
  name: "prepare: prepares SELECT statement",
  async fn() {
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
  },
});

Deno.test({
  name: "prepare: throws for invalid SQL",
  async fn() {
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

Deno.test({
  name: "executePrepared: executes prepared statement",
  async fn() {
    await withConn((conn) => {
      const prepHandle = duckdb.prepare(conn, "SELECT 1 as num");
      const execHandle = duckdb.executePrepared(prepHandle);
      assertExists(execHandle);
      duckdb.destroyPrepared(prepHandle);
      duckdb.destroyResult(execHandle);
    });
  },
});

Deno.test({
  name: "preparedColumnCount: returns column count",
  async fn() {
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

Deno.test({
  name: "destroyPrepared: frees prepared statement",
  async fn() {
    await withConn((conn) => {
      const handle = duckdb.prepare(conn, "SELECT 1");
      duckdb.destroyPrepared(handle);
      duckdb.destroyPrepared(handle);
    });
  },
});

Deno.test({
  name: "full workflow: prepare, execute, and fetch results",
  async fn() {
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
