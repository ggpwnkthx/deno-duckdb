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
  name: "prepared: parameter binding",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Bind boolean parameter
    await t.step({
      name: "bind boolean parameter",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE bind_bool_test(id INTEGER, flag BOOLEAN)",
          );
          exec(conn, "INSERT INTO bind_bool_test VALUES (1, true), (2, false)");

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM bind_bool_test WHERE flag = ?",
          );
          // Bind true (should return row with id=1)
          duckdb.bind(prepHandle, [true]);
          const execHandle = duckdb.executePrepared(prepHandle);
          const rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 1);
          // BOOLEAN returns JS boolean
          assertEquals(rows[0][1], true);
          duckdb.destroyResult(execHandle);

          // Rebind with false and execute again
          duckdb.bind(prepHandle, [false]);
          const execHandle2 = duckdb.executePrepared(prepHandle);
          const rows2 = duckdb.fetchAll(execHandle2);
          assertEquals(rows2.length, 1);
          assertEquals(rows2[0][0], 2);
          assertEquals(rows2[0][1], false);
          duckdb.destroyResult(execHandle2);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Bind integer parameter
    await t.step({
      name: "bind integer parameter",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE bind_int_test(id INTEGER, value TEXT)");
          exec(
            conn,
            "INSERT INTO bind_int_test VALUES (1, 'one'), (2, 'two'), (3, 'three')",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM bind_int_test WHERE id = ?",
          );
          duckdb.bind(prepHandle, [42]);
          const execHandle = duckdb.executePrepared(prepHandle);
          const rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 0);
          duckdb.destroyResult(execHandle);

          duckdb.bind(prepHandle, [2]);
          const execHandle2 = duckdb.executePrepared(prepHandle);
          const rows2 = duckdb.fetchAll(execHandle2);
          assertEquals(rows2.length, 1);
          assertEquals(rows2[0][0], 2);
          assertEquals(rows2[0][1], "two");
          duckdb.destroyResult(execHandle2);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Bind bigint parameter
    await t.step({
      name: "bind bigint parameter",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE bind_bigint_test(id BIGINT, value TEXT)");
          exec(
            conn,
            "INSERT INTO bind_bigint_test VALUES (9223372036854775807, 'max'), (-9223372036854775808, 'min')",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM bind_bigint_test WHERE id = ?",
          );
          duckdb.bind(prepHandle, [9223372036854775807n]);
          const execHandle = duckdb.executePrepared(prepHandle);
          const rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 9223372036854775807n);
          assertEquals(rows[0][1], "max");
          duckdb.destroyResult(execHandle);

          duckdb.bind(prepHandle, [-9223372036854775808n]);
          const execHandle2 = duckdb.executePrepared(prepHandle);
          const rows2 = duckdb.fetchAll(execHandle2);
          assertEquals(rows2.length, 1);
          assertEquals(rows2[0][0], -9223372036854775808n);
          assertEquals(rows2[0][1], "min");
          duckdb.destroyResult(execHandle2);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Bind string parameter
    await t.step({
      name: "bind string parameter",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE bind_str_test(id INTEGER, name TEXT)",
          );
          exec(
            conn,
            "INSERT INTO bind_str_test VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM bind_str_test WHERE name = ?",
          );
          duckdb.bind(prepHandle, ["Bob"]);
          const execHandle = duckdb.executePrepared(prepHandle);
          const rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 2);
          assertEquals(rows[0][1], "Bob");
          duckdb.destroyResult(execHandle);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Bind null parameter using IS NOT DISTINCT FROM
    await t.step({
      name: "bind null parameter",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE bind_null_test(id INTEGER, value TEXT)",
          );
          exec(
            conn,
            "INSERT INTO bind_null_test VALUES (1, 'has value'), (2, NULL)",
          );

          // Use IS NOT DISTINCT FROM for proper NULL comparison
          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM bind_null_test WHERE value IS NOT DISTINCT FROM ?",
          );

          // Bind a non-null value first
          duckdb.bind(prepHandle, ["has value"]);
          let execHandle = duckdb.executePrepared(prepHandle);
          let rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 1);
          assertEquals(rows[0][1], "has value");
          duckdb.destroyResult(execHandle);

          // Now bind NULL
          duckdb.bind(prepHandle, [null]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 2);
          assertEquals(rows[0][1], null);
          duckdb.destroyResult(execHandle);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Bind multiple parameters
    await t.step({
      name: "bind multiple parameters",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE bind_multi_test(id INTEGER, name TEXT, value INTEGER)",
          );
          exec(
            conn,
            "INSERT INTO bind_multi_test VALUES (1, 'Alice', 100), (2, 'Bob', 200), (3, 'Charlie', 300)",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM bind_multi_test WHERE name = ? AND value > ?",
          );

          // Test with name that doesn't match
          duckdb.bind(prepHandle, ["Alice", 150]);
          let execHandle = duckdb.executePrepared(prepHandle);
          let rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 0);
          duckdb.destroyResult(execHandle);

          // Test with matching name but value too low
          duckdb.bind(prepHandle, ["Bob", 250]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 0);
          duckdb.destroyResult(execHandle);

          // Test with matching name and value
          duckdb.bind(prepHandle, ["Bob", 150]);
          execHandle = duckdb.executePrepared(prepHandle);
          rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 2);
          assertEquals(rows[0][1], "Bob");
          assertEquals(rows[0][2], 200);
          duckdb.destroyResult(execHandle);

          duckdb.destroyPrepared(prepHandle);
        });
      },
    });

    // Bind floating-point parameter
    await t.step({
      name: "bind floating-point parameter",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE bind_double_test(id INTEGER, value DOUBLE)",
          );
          exec(
            conn,
            "INSERT INTO bind_double_test VALUES (1, 1.5), (2, 2.5), (3, 3.14)",
          );

          const prepHandle = duckdb.prepare(
            conn,
            "SELECT * FROM bind_double_test WHERE value > ?",
          );
          duckdb.bind(prepHandle, [2.0]);
          const execHandle = duckdb.executePrepared(prepHandle);
          const rows = duckdb.fetchAll(execHandle);
          assertEquals(rows.length, 2);
          assertEquals(rows[0][0], 2);
          assertEquals(rows[1][0], 3);
          duckdb.destroyResult(execHandle);

          duckdb.destroyPrepared(prepHandle);
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
