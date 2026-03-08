/**
 * Functional query operations tests
 */
import { assertEquals, assertExists, assertThrows } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { QueryError } from "@ggpwnkthx/duckdb";
import { exec, withConn } from "./utils.ts";

Deno.test({
  name: "query: executeAndFetchAll returns correct rows",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      // Create and populate table
      exec(conn, "CREATE TABLE fetch_all_test(id INTEGER, name TEXT)");
      exec(
        conn,
        "INSERT INTO fetch_all_test VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')",
      );

      // Use executeAndFetchAll to get all rows
      const rows = duckdb.executeAndFetchAll(
        conn,
        "SELECT * FROM fetch_all_test ORDER BY id",
      );

      assertExists(rows);
      assertEquals(rows.length, 3);
      assertEquals(rows[0][0], 1);
      assertEquals(rows[0][1], "Alice");
      assertEquals(rows[1][0], 2);
      assertEquals(rows[1][1], "Bob");
      assertEquals(rows[2][0], 3);
      assertEquals(rows[2][1], "Charlie");
    });
  },
});

Deno.test({
  name: "executeAndFetchAll handles empty result",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE empty_test(id INTEGER)");
      exec(conn, "INSERT INTO empty_test VALUES (1)");

      // Query that returns no rows
      const rows = duckdb.executeAndFetchAll(
        conn,
        "SELECT * FROM empty_test WHERE id = 999",
      );

      assertExists(rows);
      assertEquals(rows.length, 0);
    });
  },
});

Deno.test({
  name:
    "executeAndFetchAll properly destroys result handle (no resource leaks)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE leak_test(id INTEGER)");
      exec(conn, "INSERT INTO leak_test VALUES (1), (2), (3)");

      // Execute multiple queries - if handles aren't cleaned up, we'd have issues
      for (let i = 0; i < 10; i++) {
        const rows = duckdb.executeAndFetchAll(conn, "SELECT * FROM leak_test");
        assertEquals(rows.length, 3);
      }

      // Also test with different queries
      const rows1 = duckdb.executeAndFetchAll(conn, "SELECT 1 as num");
      assertEquals(rows1[0][0], 1);

      const rows2 = duckdb.executeAndFetchAll(
        conn,
        "SELECT 'hello' as greeting",
      );
      assertEquals(rows2[0][0], "hello");
    });
  },
});

Deno.test({
  name: "executeAndFetchAll handles single row result",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE single_row_test(id INTEGER, value TEXT)");
      exec(conn, "INSERT INTO single_row_test VALUES (42, 'the answer')");

      const rows = duckdb.executeAndFetchAll(
        conn,
        "SELECT * FROM single_row_test",
      );

      assertEquals(rows.length, 1);
      assertEquals(rows[0][0], 42);
      assertEquals(rows[0][1], "the answer");
    });
  },
});

Deno.test({
  name: "executeAndFetchAll error handling for invalid query",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      // Try to execute an invalid SQL query
      assertThrows(
        () =>
          duckdb.executeAndFetchAll(conn, "SELECT * FROM nonexistent_table"),
        QueryError,
      );
    });
  },
});

Deno.test({
  name: "executeAndFetchAll with aggregate functions",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE agg_test(id INTEGER, value INTEGER)");
      exec(conn, "INSERT INTO agg_test VALUES (1, 10), (2, 20), (3, 30)");

      // Test SUM
      const sumRows = duckdb.executeAndFetchAll(
        conn,
        "SELECT SUM(value) as total FROM agg_test",
      );
      assertEquals(sumRows[0][0], 60n);

      // Test COUNT
      const countRows = duckdb.executeAndFetchAll(
        conn,
        "SELECT COUNT(*) as cnt FROM agg_test",
      );
      assertEquals(countRows[0][0], 3n);

      // Test AVG
      const avgRows = duckdb.executeAndFetchAll(
        conn,
        "SELECT AVG(value) as avg_val FROM agg_test",
      );
      assertEquals(avgRows[0][0], 20);
    });
  },
});

Deno.test({
  name: "executeAndFetchAll with JOIN",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE users(id INTEGER, name TEXT)");
      exec(
        conn,
        "CREATE TABLE orders(id INTEGER, user_id INTEGER, amount INTEGER)",
      );
      exec(conn, "INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob')");
      exec(
        conn,
        "INSERT INTO orders VALUES (1, 1, 100), (2, 1, 200), (3, 2, 150)",
      );

      // Order by amount to get predictable results
      const rows = duckdb.executeAndFetchAll(
        conn,
        "SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id ORDER BY o.amount",
      );

      assertEquals(rows.length, 3);
      // Ordered by amount: 100, 150, 200
      assertEquals(rows[0][0], "Alice");
      assertEquals(rows[0][1], 100);
      assertEquals(rows[1][0], "Bob");
      assertEquals(rows[1][1], 150);
      assertEquals(rows[2][0], "Alice");
      assertEquals(rows[2][1], 200);
    });
  },
});

Deno.test({
  name: "query: destroyResultSync works when library is loaded",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withConn((conn) => {
      exec(conn, "CREATE TABLE sync_destroy_test(id INTEGER)");
      exec(conn, "INSERT INTO sync_destroy_test VALUES (1)");

      // Create a result handle
      const resultHandle = duckdb.execute(
        conn,
        "SELECT * FROM sync_destroy_test",
      );

      // Verify it has data
      const rows = duckdb.fetchAll(resultHandle);
      assertEquals(rows.length, 1);

      // Use sync destroy
      duckdb.destroyResultSync(resultHandle);
    });
  },
});
