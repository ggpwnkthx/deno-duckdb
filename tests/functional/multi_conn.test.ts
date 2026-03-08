/**
 * Functional multi-connection tests
 *
 * Tests for multiple connections to the same database, shared visibility,
 * and independent query execution across separate connections.
 */

import { assertEquals } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec, query, withDb } from "./utils.ts";

Deno.test({
  name: "multi_conn: multiple connections to one database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Create multiple connections to same database
    await t.step({
      name: "multiple connections exist simultaneously",
      async fn() {
        await withDb(async (db) => {
          // Create multiple connections
          const conn1 = await duckdb.create(db);
          const conn2 = await duckdb.create(db);
          const conn3 = await duckdb.create(db);

          // Verify connections are distinct handles
          const ptr1 = duckdb.getPointerValueConnection(conn1);
          const ptr2 = duckdb.getPointerValueConnection(conn2);
          const ptr3 = duckdb.getPointerValueConnection(conn3);
          assertEquals(ptr1 !== ptr2, true);
          assertEquals(ptr2 !== ptr3, true);
          assertEquals(ptr1 !== ptr3, true);

          // All should be valid
          assertEquals(duckdb.isValidConnection(conn1), true);
          assertEquals(duckdb.isValidConnection(conn2), true);
          assertEquals(duckdb.isValidConnection(conn3), true);

          // All can execute queries independently
          const result1 = duckdb.execute(conn1, "SELECT 1");
          const result2 = duckdb.execute(conn2, "SELECT 2");
          const result3 = duckdb.execute(conn3, "SELECT 3");

          assertEquals(duckdb.fetchAll(result1)[0][0], 1);
          assertEquals(duckdb.fetchAll(result2)[0][0], 2);
          assertEquals(duckdb.fetchAll(result3)[0][0], 3);

          duckdb.destroyResult(result1);
          duckdb.destroyResult(result2);
          duckdb.destroyResult(result3);

          // Cleanup
          duckdb.closeConnection(conn1);
          duckdb.closeConnection(conn2);
          duckdb.closeConnection(conn3);
        });
      },
    });

    // Test shared visibility - both connections see the same data
    await t.step({
      name: "shared database visibility across connections",
      async fn() {
        await withDb(async (db) => {
          const conn1 = await duckdb.create(db);
          const conn2 = await duckdb.create(db);

          // Create table and insert data via conn1
          exec(conn1, "CREATE TABLE isolation_test(id INTEGER, name TEXT)");
          exec(conn1, "INSERT INTO isolation_test VALUES (1, 'Alice')");

          // Conn2 should see the data (same database)
          const rows = query(conn2, "SELECT * FROM isolation_test ORDER BY id");
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 1);
          assertEquals(rows[0][1], "Alice");

          // Conn1 inserts more data
          exec(conn1, "INSERT INTO isolation_test VALUES (2, 'Bob')");

          // Conn2 should see both rows now
          const rows2 = query(
            conn2,
            "SELECT * FROM isolation_test ORDER BY id",
          );
          assertEquals(rows2.length, 2);

          // Cleanup
          duckdb.closeConnection(conn1);
          duckdb.closeConnection(conn2);
        });
      },
    });
  },
});

Deno.test({
  name: "multi_conn: queries and prepared statements across connections",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Sequential queries on different connections
    await t.step({
      name: "sequential queries on separate connections",
      async fn() {
        await withDb(async (db) => {
          // Setup data
          const connSetup = await duckdb.create(db);
          exec(connSetup, "CREATE TABLE multi_conn_data(id INTEGER, val TEXT)");
          exec(connSetup, "INSERT INTO multi_conn_data VALUES (1, 'one')");
          exec(connSetup, "INSERT INTO multi_conn_data VALUES (2, 'two')");
          duckdb.closeConnection(connSetup);

          const conn1 = await duckdb.create(db);
          const conn2 = await duckdb.create(db);

          // Query from conn1
          const rows1 = query(
            conn1,
            "SELECT * FROM multi_conn_data WHERE id = 1",
          );
          assertEquals(rows1.length, 1);
          assertEquals(rows1[0][1], "one");

          // Query from conn2
          const rows2 = query(
            conn2,
            "SELECT * FROM multi_conn_data WHERE id = 2",
          );
          assertEquals(rows2.length, 1);
          assertEquals(rows2[0][1], "two");

          // Query again from conn1
          const rows3 = query(conn1, "SELECT COUNT(*) FROM multi_conn_data");
          assertEquals(rows3[0][0], 2n);

          duckdb.closeConnection(conn1);
          duckdb.closeConnection(conn2);
        });
      },
    });

    // Independent queries across connections
    await t.step({
      name: "independent queries across connections",
      async fn() {
        await withDb(async (db) => {
          const connSetup = await duckdb.create(db);
          exec(
            connSetup,
            "CREATE TABLE multi_conn_data2(id INTEGER, val TEXT)",
          );
          exec(connSetup, "INSERT INTO multi_conn_data2 VALUES (1, 'first')");
          exec(connSetup, "INSERT INTO multi_conn_data2 VALUES (2, 'second')");
          duckdb.closeConnection(connSetup);

          const conn1 = await duckdb.create(db);
          const conn2 = await duckdb.create(db);

          const result1 = query(
            conn1,
            "SELECT * FROM multi_conn_data2 WHERE id = 1",
          );
          const result2 = query(
            conn2,
            "SELECT * FROM multi_conn_data2 WHERE id = 2",
          );

          assertEquals(result1.length, 1);
          assertEquals(result1[0][0], 1);
          assertEquals(result1[0][1], "first");

          assertEquals(result2.length, 1);
          assertEquals(result2[0][0], 2);
          assertEquals(result2[0][1], "second");

          duckdb.closeConnection(conn1);
          duckdb.closeConnection(conn2);
        });
      },
    });

    // Prepared statements on separate connections
    await t.step({
      name: "prepared statements on separate connections",
      async fn() {
        await withDb(async (db) => {
          const connSetup = await duckdb.create(db);
          exec(connSetup, "CREATE TABLE prep_multi(id INTEGER, val TEXT)");
          exec(connSetup, "INSERT INTO prep_multi VALUES (1, 'a'), (2, 'b')");
          duckdb.closeConnection(connSetup);

          const conn1 = await duckdb.create(db);
          const conn2 = await duckdb.create(db);

          // Prepare on conn1
          const prep1 = duckdb.prepare(
            conn1,
            "SELECT * FROM prep_multi WHERE id = ?",
          );
          duckdb.bind(prep1, [1]);
          let result1 = duckdb.executePrepared(prep1);
          let rows1 = duckdb.fetchAll(result1);
          assertEquals(rows1.length, 1);
          assertEquals(rows1[0][1], "a");
          duckdb.destroyResult(result1);

          // Prepare on conn2
          const prep2 = duckdb.prepare(
            conn2,
            "SELECT * FROM prep_multi WHERE id = ?",
          );
          duckdb.bind(prep2, [2]);
          const result2 = duckdb.executePrepared(prep2);
          const rows2 = duckdb.fetchAll(result2);
          assertEquals(rows2.length, 1);
          assertEquals(rows2[0][1], "b");
          duckdb.destroyResult(result2);

          // Reuse conn1's prepared statement
          duckdb.bind(prep1, [2]);
          result1 = duckdb.executePrepared(prep1);
          rows1 = duckdb.fetchAll(result1);
          assertEquals(rows1.length, 1);
          assertEquals(rows1[0][1], "b");
          duckdb.destroyResult(result1);

          duckdb.destroyPrepared(prep1);
          duckdb.destroyPrepared(prep2);
          duckdb.closeConnection(conn1);
          duckdb.closeConnection(conn2);
        });
      },
    });

    // Independent prepared statement execution
    await t.step({
      name: "independent prepared statements on separate connections",
      async fn() {
        await withDb(async (db) => {
          const connSetup = await duckdb.create(db);
          exec(connSetup, "CREATE TABLE prep_multi2(id INTEGER, val TEXT)");
          exec(
            connSetup,
            "INSERT INTO prep_multi2 VALUES (1, 'a'), (2, 'b'), (3, 'c')",
          );
          duckdb.closeConnection(connSetup);

          const conn1 = await duckdb.create(db);
          const conn2 = await duckdb.create(db);

          const prep1 = duckdb.prepare(
            conn1,
            "SELECT * FROM prep_multi2 WHERE id = ?",
          );
          const prep2 = duckdb.prepare(
            conn2,
            "SELECT * FROM prep_multi2 WHERE val = ?",
          );
          duckdb.bind(prep1, [1]);
          duckdb.bind(prep2, ["b"]);
          const result1 = duckdb.executePrepared(prep1);
          const result2 = duckdb.executePrepared(prep2);

          const rows1 = duckdb.fetchAll(result1);
          const rows2 = duckdb.fetchAll(result2);

          assertEquals(rows1.length, 1);
          assertEquals(rows1[0][1], "a");

          assertEquals(rows2.length, 1);
          assertEquals(rows2[0][0], 2);

          duckdb.destroyResult(result1);
          duckdb.destroyResult(result2);
          duckdb.destroyPrepared(prep1);
          duckdb.destroyPrepared(prep2);
          duckdb.closeConnection(conn1);
          duckdb.closeConnection(conn2);
        });
      },
    });
  },
});
