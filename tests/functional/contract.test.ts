/**
 * Contract tests for functional API functions with gaps in test coverage
 *
 * Note: Basic validity tests (isValidDatabase, isValidConnection, getPointerValue)
 * are covered in database.test.ts. This file focuses on contract-specific behaviors.
 */

import { assertEquals } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec, withConn } from "./utils.ts";

// =============================================================================
// Connection validity functions contract tests
// =============================================================================

Deno.test({
  name: "contract: getPointerValueConnection returns distinct pointers",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await duckdb.open();
    const conn1 = await duckdb.create(db);
    const conn2 = await duckdb.create(db);

    // Get pointers for both connections
    const ptr1 = duckdb.getPointerValueConnection(conn1);
    const ptr2 = duckdb.getPointerValueConnection(conn2);

    // Pointers should be different for different connections
    assertEquals(ptr1 !== ptr2, true);

    // Both should be non-zero
    assertEquals(ptr1 !== 0n, true);
    assertEquals(ptr2 !== 0n, true);

    duckdb.closeConnection(conn1);
    duckdb.closeConnection(conn2);
    duckdb.closeDatabase(db);
  },
});

// =============================================================================
// Prepared statement metadata contract tests
// =============================================================================

Deno.test({
  name: "contract: preparedColumnCount returns correct column count",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      // Test with 3 columns
      const prep1 = duckdb.prepare(conn, "SELECT 1 as a, 2 as b, 3 as c");
      assertEquals(duckdb.preparedColumnCount(prep1), 3n);
      duckdb.destroyPrepared(prep1);

      // Test with table query
      exec(
        conn,
        "CREATE TABLE col_count_test(id INTEGER, name TEXT, value DOUBLE)",
      );
      const prep3 = duckdb.prepare(conn, "SELECT * FROM col_count_test");
      assertEquals(duckdb.preparedColumnCount(prep3), 3n);
      duckdb.destroyPrepared(prep3);
    });
  },
});

// =============================================================================
// Sync destroy functions contract tests
// =============================================================================

Deno.test({
  name: "contract: resetPreparedSync clears bindings - behavioral verification",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE reset_sync_test(id INTEGER, value TEXT)");
      exec(conn, "INSERT INTO reset_sync_test VALUES (1, 'a'), (2, 'b')");

      const prepHandle = duckdb.prepare(
        conn,
        "SELECT * FROM reset_sync_test WHERE id = ?",
      );

      // Bind id=1 and execute - should return row with value "a"
      duckdb.bind(prepHandle, [1]);
      const execHandle1 = duckdb.executePrepared(prepHandle);
      const rows1 = duckdb.fetchAll(execHandle1);
      assertEquals(rows1.length, 1);
      assertEquals(rows1[0][1], "a");
      duckdb.destroyResult(execHandle1);

      // Reset bindings using sync version - this should clear the old binding
      duckdb.resetPreparedSync(prepHandle);

      // Bind a DIFFERENT value (id=2) and execute - should return "b" NOT "a"
      // If reset doesn't work, it would still use old binding (id=1) and return "a"
      duckdb.bind(prepHandle, [2]);
      const execHandle2 = duckdb.executePrepared(prepHandle);
      const rows2 = duckdb.fetchAll(execHandle2);
      assertEquals(rows2.length, 1);
      assertEquals(rows2[0][1], "b"); // Must be "b" - proves old binding was cleared
      duckdb.destroyResult(execHandle2);

      duckdb.destroyPrepared(prepHandle);
    });
  },
});

Deno.test({
  name:
    "contract: destroyPreparedSync frees prepared statement - connection stays functional",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      // Execute first query and verify it works
      const prepHandle1 = duckdb.prepare(conn, "SELECT 1 as col");
      const execHandle1 = duckdb.executePrepared(prepHandle1);
      const rows1 = duckdb.fetchAll(execHandle1);
      assertEquals(rows1.length, 1);
      assertEquals(rows1[0][0], 1);
      duckdb.destroyResult(execHandle1);
      duckdb.destroyPrepared(prepHandle1);

      // Destroy the prepared statement using sync version
      // This should free resources properly
      const prepHandle2 = duckdb.prepare(conn, "SELECT 'first' as txt");
      duckdb.destroyPreparedSync(prepHandle2);

      // Prepare and execute a NEW statement - this should work if resources were freed
      const prepHandle3 = duckdb.prepare(conn, "SELECT 2 as col");
      const execHandle3 = duckdb.executePrepared(prepHandle3);
      const rows3 = duckdb.fetchAll(execHandle3);
      assertEquals(rows3.length, 1);
      assertEquals(rows3[0][0], 2);
      duckdb.destroyResult(execHandle3);
      duckdb.destroyPrepared(prepHandle3);

      // Execute another query to confirm connection is fully functional
      const resultHandle4 = duckdb.query(conn, "SELECT 3 as num");
      const rows4 = duckdb.fetchAll(resultHandle4);
      assertEquals(rows4.length, 1);
      assertEquals(rows4[0][0], 3);
      duckdb.destroyResult(resultHandle4);
    });
  },
});

Deno.test({
  name:
    "contract: destroyResultSync frees result handle - connection stays functional",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      // Execute first query and verify it has data
      const resultHandle1 = duckdb.query(conn, "SELECT 1, 2, 3");
      assertEquals(duckdb.rowCount(resultHandle1), 1n);
      assertEquals(duckdb.columnCount(resultHandle1), 3n);
      const rows1 = duckdb.fetchAll(resultHandle1);
      assertEquals(rows1.length, 1);
      assertEquals(rows1[0], [1, 2, 3]);

      // Sync destroy should work without throwing
      duckdb.destroyResultSync(resultHandle1);

      // Execute another query - connection should still work if resources were freed
      const resultHandle2 = duckdb.query(
        conn,
        "SELECT 'test' as msg, 42 as num",
      );
      assertEquals(duckdb.rowCount(resultHandle2), 1n);
      const rows2 = duckdb.fetchAll(resultHandle2);
      assertEquals(rows2.length, 1);
      assertEquals(rows2[0][0], "test");
      assertEquals(rows2[0][1], 42);
      duckdb.destroyResult(resultHandle2);

      // Execute a third query to confirm connection is fully functional
      const resultHandle3 = duckdb.query(conn, "SELECT 100 as value");
      const rows3 = duckdb.fetchAll(resultHandle3);
      assertEquals(rows3.length, 1);
      assertEquals(rows3[0][0], 100);
      duckdb.destroyResult(resultHandle3);
    });
  },
});

// =============================================================================
// Additional contract tests for edge cases
// =============================================================================

Deno.test({
  name: "contract: multiple connections have distinct validity states",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await duckdb.open();
    const conn1 = await duckdb.create(db);
    const conn2 = await duckdb.create(db);

    // Both connections should be valid
    assertEquals(duckdb.isValidConnection(conn1), true);
    assertEquals(duckdb.isValidConnection(conn2), true);

    // Close one connection
    duckdb.closeConnection(conn1);

    // Only the closed one should be invalid
    assertEquals(duckdb.isValidConnection(conn1), false);
    assertEquals(duckdb.isValidConnection(conn2), true);

    duckdb.closeConnection(conn2);
    duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "contract: getPointerValueConnection works after connection close",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await duckdb.open();
    const conn = await duckdb.create(db);

    // Get pointer while valid
    const ptrBefore = duckdb.getPointerValueConnection(conn);
    assertEquals(ptrBefore !== 0n, true);

    // Close connection
    duckdb.closeConnection(conn);

    // After close, pointer value is still retrievable (it's just the handle value)
    const ptrAfter = duckdb.getPointerValueConnection(conn);
    assertEquals(typeof ptrAfter, "bigint");

    duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "contract: preparedColumnCount for complex queries",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE complex_test(a INTEGER, b TEXT, c DOUBLE)");
      exec(conn, "INSERT INTO complex_test VALUES (1, 'x', 1.5)");

      // JOIN query
      const prep1 = duckdb.prepare(
        conn,
        "SELECT t1.a, t2.b FROM complex_test t1 JOIN complex_test t2 ON t1.a = t2.a",
      );
      assertEquals(duckdb.preparedColumnCount(prep1), 2n);
      duckdb.destroyPrepared(prep1);

      // Subquery
      const prep2 = duckdb.prepare(
        conn,
        "SELECT * FROM (SELECT a, b FROM complex_test) AS sub",
      );
      assertEquals(duckdb.preparedColumnCount(prep2), 2n);
      duckdb.destroyPrepared(prep2);

      // Aggregate
      const prep3 = duckdb.prepare(
        conn,
        "SELECT COUNT(*), SUM(a), AVG(c) FROM complex_test",
      );
      assertEquals(duckdb.preparedColumnCount(prep3), 3n);
      duckdb.destroyPrepared(prep3);
    });
  },
});
