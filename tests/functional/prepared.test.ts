/**
 * Functional prepared statement operations tests
 */
import { assertEquals, assertExists, assertRejects } from "@std/assert";
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
    await duckdb.closeConnection(conn);
    await duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "prepare: prepares SELECT statement",
  async fn() {
    await withConn(async (conn) => {
      // Use exec for DDL/INSERT
      await exec(conn, "CREATE TABLE prepare_test(id INTEGER, name VARCHAR)");
      await exec(conn, "INSERT INTO prepare_test VALUES (1, 'test')");

      const handle = await duckdb.prepare(
        conn,
        "SELECT * FROM prepare_test WHERE id = ?",
      );
      assertExists(handle);

      await duckdb.destroyPrepared(handle);
    });
  },
});

Deno.test({
  name: "prepare: throws for invalid SQL",
  async fn() {
    await withConn(async (conn) => {
      await assertRejects(
        async () =>
          await duckdb.prepare(
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
    await withConn(async (conn) => {
      const prepHandle = await duckdb.prepare(conn, "SELECT 1 as num");

      const execHandle = await duckdb.executePrepared(prepHandle);
      assertExists(execHandle);

      await duckdb.destroyPrepared(prepHandle);
      await duckdb.destroyResult(execHandle);
    });
  },
});

Deno.test({
  name: "preparedColumnCount: returns column count",
  async fn() {
    await withConn(async (conn) => {
      const prepHandle = await duckdb.prepare(
        conn,
        "SELECT 1 as a, 2 as b, 3 as c",
      );

      const count = await duckdb.preparedColumnCount(prepHandle);
      assertEquals(count, 3n);

      await duckdb.destroyPrepared(prepHandle);
    });
  },
});

Deno.test({
  name: "destroyPrepared: frees prepared statement",
  async fn() {
    await withConn(async (conn) => {
      const handle = await duckdb.prepare(conn, "SELECT 1");

      // Should not throw
      await duckdb.destroyPrepared(handle);

      // Destroying again should be safe
      await duckdb.destroyPrepared(handle);
    });
  },
});

Deno.test({
  name: "full workflow: prepare, execute, and fetch results",
  async fn() {
    await withConn(async (conn) => {
      // Use exec for DDL/INSERT
      await exec(conn, "CREATE TABLE workflow_test(id INTEGER, value TEXT)");
      await exec(
        conn,
        "INSERT INTO workflow_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
      );

      // Prepare statement - no parameter
      const prepHandle = await duckdb.prepare(
        conn,
        "SELECT * FROM workflow_test WHERE id > 0",
      );

      // Execute
      const execHandle = await duckdb.executePrepared(prepHandle);

      // Verify results
      const rowCount = await duckdb.rowCount(execHandle);
      assertEquals(rowCount, 3n);

      // Cleanup
      await duckdb.destroyPrepared(prepHandle);
      await duckdb.destroyResult(execHandle);
    });
  },
});
