/**
 * Functional prepared statement operations tests
 */
import { assertEquals, assertExists, assertThrows } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { DatabaseError } from "@ggpwnkthx/duckdb";
import { exec, withConn } from "./utils.ts";

Deno.test({
  name: "prepared: manage prepared statements",
  sanitizeResources: false,
  sanitizeOps: false,
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

// New tests for parameter binding
Deno.test({
  name: "prepared: parameter binding - various types",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Consolidated test for various parameter types
    await t.step({
      name: "bind various parameter types",
      async fn() {
        await withConn((conn) => {
          // Set up test data for various types
          exec(
            conn,
            "CREATE TABLE bind_types_test(id INTEGER, flag BOOLEAN, amount BIGINT, name TEXT, value DOUBLE)",
          );
          exec(
            conn,
            "INSERT INTO bind_types_test VALUES (1, true, 1000, 'Alice', 10.5), (2, false, 2000, 'Bob', 20.5), (3, true, 3000, 'Charlie', 30.5)",
          );

          // Test boolean binding
          const boolPrep = duckdb.prepare(
            conn,
            "SELECT * FROM bind_types_test WHERE flag = ?",
          );
          duckdb.bind(boolPrep, [true]);
          let execHandle = duckdb.executePrepared(boolPrep);
          let rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 2);
          assertEquals(rows[0][1], true);
          duckdb.destroyResult(execHandle);
          duckdb.destroyPrepared(boolPrep);

          // Test integer binding
          const intPrep = duckdb.prepare(
            conn,
            "SELECT * FROM bind_types_test WHERE id = ?",
          );
          duckdb.bind(intPrep, [2]);
          execHandle = duckdb.executePrepared(intPrep);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 2);
          duckdb.destroyResult(execHandle);
          duckdb.destroyPrepared(intPrep);

          // Test bigint binding
          const bigintPrep = duckdb.prepare(
            conn,
            "SELECT * FROM bind_types_test WHERE amount = ?",
          );
          duckdb.bind(bigintPrep, [2000n]);
          execHandle = duckdb.executePrepared(bigintPrep);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][2], 2000n);
          duckdb.destroyResult(execHandle);
          duckdb.destroyPrepared(bigintPrep);

          // Test string binding
          const strPrep = duckdb.prepare(
            conn,
            "SELECT * FROM bind_types_test WHERE name = ?",
          );
          duckdb.bind(strPrep, ["Bob"]);
          execHandle = duckdb.executePrepared(strPrep);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][3], "Bob");
          duckdb.destroyResult(execHandle);
          duckdb.destroyPrepared(strPrep);

          // Test double binding
          const doublePrep = duckdb.prepare(
            conn,
            "SELECT * FROM bind_types_test WHERE value > ?",
          );
          duckdb.bind(doublePrep, [25.0]);
          execHandle = duckdb.executePrepared(doublePrep);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 3);
          duckdb.destroyResult(execHandle);
          duckdb.destroyPrepared(doublePrep);

          // Test NULL binding using IS NOT DISTINCT FROM
          const nullPrep = duckdb.prepare(
            conn,
            "SELECT * FROM bind_types_test WHERE name IS NOT DISTINCT FROM ?",
          );
          duckdb.bind(nullPrep, [null]);
          execHandle = duckdb.executePrepared(nullPrep);
          rows = duckdb.fetchAll(execHandle);
          // No NULL names in test data
          assertEquals(rows.length, 0);
          duckdb.destroyResult(execHandle);
          duckdb.destroyPrepared(nullPrep);

          // Test multiple parameters
          const multiPrep = duckdb.prepare(
            conn,
            "SELECT * FROM bind_types_test WHERE name = ? AND value > ?",
          );
          duckdb.bind(multiPrep, ["Alice", 5.0]);
          execHandle = duckdb.executePrepared(multiPrep);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][3], "Alice");
          assertEquals(rows[0][4], 10.5);
          duckdb.destroyResult(execHandle);
          duckdb.destroyPrepared(multiPrep);
        });
      },
    });

    // Test rebinding (bind new params after execute)
    await t.step({
      name: "rebinding parameters",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE rebind_test(id INTEGER, value TEXT)");
          exec(
            conn,
            "INSERT INTO rebind_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM rebind_test WHERE id = ?",
          );

          // First bind and execute
          duckdb.bind(prepHandle, [1]);
          const execHandle1 = duckdb.executePrepared(prepHandle);
          const rows1 = duckdb.fetchAll(execHandle1);
          assertEquals(rows1.length, 1);
          assertEquals(rows1[0][1], "a");
          duckdb.destroyResult(execHandle1);

          // Rebind with new params and execute again
          duckdb.bind(prepHandle, [2]);
          const execHandle2 = duckdb.executePrepared(prepHandle);
          const rows2 = duckdb.fetchAll(execHandle2);
          assertEquals(rows2.length, 1);
          assertEquals(rows2[0][1], "b");
          duckdb.destroyResult(execHandle2);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });
  },
});

// Negative test cases for prepared statements
Deno.test({
  name: "prepared: negative cases",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Wrong parameter count - too many bindings
    await t.step({
      name: "bind too many parameters throws error",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE arity_test2(id INTEGER)");

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM arity_test2 WHERE id = ?",
          );
          // Bind two parameters when only one is required
          assertThrows(
            () => duckdb.bind(prepHandle, [1, 2]),
            DatabaseError,
          );
          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Execute without binding required parameters
    await t.step({
      name: "execute without binding required parameters throws error",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE unbound_test(id INTEGER)");
          exec(conn, "INSERT INTO unbound_test VALUES (1)");

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM unbound_test WHERE id = ?",
          );
          // Execute without binding any parameters
          assertThrows(
            () => duckdb.executePrepared(prepHandle),
            DatabaseError,
          );
          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Unsupported bind type rejection
    await t.step({
      name: "bind unsupported type throws error",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE type_test(id INTEGER)");

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM type_test WHERE id = ?",
          );
          // Try to bind an unsupported type (object)
          assertThrows(
            () => duckdb.bind(prepHandle, [{ foo: "bar" }] as unknown as never),
            DatabaseError,
          );
          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Too few parameters bound - throws at execute time
    await t.step({
      name: "bind too few parameters throws error at execute",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE few_params_test(id INTEGER, value TEXT)");
          exec(conn, "INSERT INTO few_params_test VALUES (1, 'a')");

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM few_params_test WHERE id = ? AND value = ?",
          );
          // Bind only one parameter when two are required - throws at execute
          duckdb.bind(prepHandle, [1]);
          assertThrows(
            () => duckdb.executePrepared(prepHandle),
            DatabaseError,
          );
          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Rebinding should not leak old parameter state
    await t.step({
      name: "rebinding does not leak old parameter state",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE leak_test(id INTEGER, value TEXT)");
          exec(
            conn,
            "INSERT INTO leak_test VALUES (1, 'first'), (2, 'second')",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM leak_test WHERE id = ?",
          );

          // First bind and execute - should return row 1
          duckdb.bind(prepHandle, [1]);
          let execHandle = duckdb.executePrepared(prepHandle);
          let rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][1], "first");
          duckdb.destroyResult(execHandle);

          // Rebind with new param (2) and execute - should return row 2
          // If old params leaked, we might get unexpected results
          duckdb.bind(prepHandle, [2]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][1], "second"); // Must be "second", not "first"
          duckdb.destroyResult(execHandle);

          // Verify a third execution with the same bound param still works
          duckdb.bind(prepHandle, [1]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][1], "first"); // Must be "first", not "second"
          duckdb.destroyResult(execHandle);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });
  },
});

// Additional tests for binding state correctness
Deno.test({
  name: "prepared: binding state correctness",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Multi-parameter state leakage test
    await t.step({
      name: "multi-parameter binding state isolation",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE multi_param_test(id INTEGER, name TEXT, value INTEGER)",
          );
          exec(
            conn,
            "INSERT INTO multi_param_test VALUES (1, 'Alice', 100), (2, 'Bob', 200), (3, 'Charlie', 300)",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM multi_param_test WHERE name = ? AND value > ?",
          );

          // First bind with name='Alice', value=50
          duckdb.bind(prepHandle, ["Alice", 50]);
          let execHandle = duckdb.executePrepared(prepHandle);
          let rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][1], "Alice");
          assertEquals(rows[0][2], 100);
          duckdb.destroyResult(execHandle);

          // Rebind with name='Bob', value=150
          // Should NOT include Alice with old value=50 leaking in
          duckdb.bind(prepHandle, ["Bob", 150]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][1], "Bob");
          assertEquals(rows[0][2], 200);
          duckdb.destroyResult(execHandle);

          // Rebind with name='Charlie', value=250
          // Should NOT include Bob with old value leaking in
          duckdb.bind(prepHandle, ["Charlie", 250]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][1], "Charlie");
          assertEquals(rows[0][2], 300);
          duckdb.destroyResult(execHandle);

          // Back to Alice with different value threshold
          duckdb.bind(prepHandle, ["Alice", 150]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          // Alice has value=100, which is NOT > 150, so should return 0 rows
          assertEquals(rows.length, 0);
          duckdb.destroyResult(execHandle);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Partial rebinding test - bind 2 params, then bind only 1
    await t.step({
      name: "partial rebinding with fewer parameters",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE partial_bind_test(id INTEGER, name TEXT)",
          );
          exec(
            conn,
            "INSERT INTO partial_bind_test VALUES (1, 'Alice'), (2, 'Bob')",
          );

          // Prepare statement that expects 2 parameters
          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM partial_bind_test WHERE id = ? AND name = ?",
          );

          // Bind both parameters
          duckdb.bind(prepHandle, [1, "Alice"]);
          let execHandle = duckdb.executePrepared(prepHandle);
          let rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 1);
          duckdb.destroyResult(execHandle);

          // Now bind only 1 parameter (different from what was bound before)
          // This should fail at execute since 2 are required
          duckdb.bind(prepHandle, [2]);
          assertThrows(
            () => duckdb.executePrepared(prepHandle),
            DatabaseError,
          );

          // But binding both again should work correctly
          duckdb.bind(prepHandle, [2, "Bob"]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 2);
          assertEquals(rows[0][1], "Bob");
          duckdb.destroyResult(execHandle);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Execution after failure test
    await t.step({
      name: "execution after failure recovers correctly",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE after_fail_test(id INTEGER, value TEXT)",
          );
          exec(
            conn,
            "INSERT INTO after_fail_test VALUES (1, 'one'), (2, 'two')",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM after_fail_test WHERE id = ?",
          );

          // Try to execute without binding any parameters - should fail
          assertThrows(
            () => duckdb.executePrepared(prepHandle),
            DatabaseError,
          );

          // Now bind correct params and execute again - should work
          duckdb.bind(prepHandle, [1]);
          let execHandle = duckdb.executePrepared(prepHandle);
          let rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][1], "one");
          duckdb.destroyResult(execHandle);

          // Bind different param and execute again - should still work
          duckdb.bind(prepHandle, [2]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][1], "two");
          duckdb.destroyResult(execHandle);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Arity change test - binding behavior with different parameter counts
    await t.step({
      name: "arity change behavior",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE arity_change_test(id INTEGER, name TEXT, value INTEGER)",
          );
          exec(
            conn,
            "INSERT INTO arity_change_test VALUES (1, 'test', 10)",
          );

          // Prepare a 2-parameter statement
          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM arity_change_test WHERE name = ? AND value > ?",
          );

          // Bind 2 params - should work
          duckdb.bind(prepHandle, ["test", 5]);
          let execHandle = duckdb.executePrepared(prepHandle);
          let rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          duckdb.destroyResult(execHandle);

          // Bind 2 different params - should work
          duckdb.bind(prepHandle, ["nonexistent", 100]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 0);
          duckdb.destroyResult(execHandle);

          // Bind with different values again
          duckdb.bind(prepHandle, ["test", 15]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          // value=10 is NOT > 15, so should return 0 rows
          assertEquals(rows.length, 0);
          duckdb.destroyResult(execHandle);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });
  },
});

// Edge cases for prepared statements
Deno.test({
  name: "prepared: edge cases",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Preparing statement that returns no columns
    await t.step({
      name: "prepare statement that produces no columns",
      async fn() {
        await withConn((conn) => {
          // Some statements might not return columns (like DDL)
          // But SELECT always returns at least one column
          // Test with constant expression
          const prepHandle = duckdb.prepare(conn, "SELECT 1");
          const colCount = duckdb.preparedColumnCount(prepHandle);
          // Even "SELECT 1" returns 1 column
          assertEquals(colCount >= 1n, true);
          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Binding to statement that returns no rows
    await t.step({
      name: "binding produces no rows",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE no_rows_test(id INTEGER, value TEXT)",
          );
          exec(
            conn,
            "INSERT INTO no_rows_test VALUES (1, 'a'), (2, 'b')",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM no_rows_test WHERE id = ?",
          );
          // Bind a non-existent value
          duckdb.bind(prepHandle, [999]);
          const execHandle = duckdb.executePrepared(prepHandle);
          const rows = duckdb.fetchAll(execHandle);
          // Should return 0 rows
          assertEquals(rows.length, 0);
          duckdb.destroyResult(execHandle);

          // But binding a valid value should still work
          duckdb.bind(prepHandle, [1]);
          const execHandle2 = duckdb.executePrepared(prepHandle);
          const rows2 = duckdb.fetchAll(execHandle2);
          assertEquals(rows2.length, 1);
          assertEquals(rows2[0][1], "a");
          duckdb.destroyResult(execHandle2);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Prepare and execute multiple times
    await t.step({
      name: "prepare can be executed multiple times",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE multi_exec_test(id INTEGER)",
          );
          exec(
            conn,
            "INSERT INTO multi_exec_test VALUES (1), (2), (3)",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM multi_exec_test WHERE id > ?",
          );

          // Execute 3 times with different bindings
          for (let i = 0; i < 3; i++) {
            duckdb.bind(prepHandle, [i]);
            const execHandle = duckdb.executePrepared(prepHandle);
            const rows = duckdb.fetchAll(execHandle);
            assertEquals(rows.length, 3 - i);
            duckdb.destroyResult(execHandle);
          }

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });
  },
});
