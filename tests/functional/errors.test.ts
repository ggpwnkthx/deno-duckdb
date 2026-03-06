/**
 * Functional error assertion tests
 *
 * Tests for specific error types, error messages, and error properties
 */

import { assertEquals, assertThrows } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { DatabaseError, QueryError } from "@ggpwnkthx/duckdb";
import { query, withConn } from "./utils.ts";

Deno.test({
  name: "errors: QueryError with invalid SQL",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Invalid SQL should throw QueryError with query property
    await t.step({
      name: "invalid table name throws error with query info",
      async fn() {
        await withConn((conn) => {
          const invalidQuery = "SELECT * FROM nonexistent_table_xyz";
          assertThrows(
            () => duckdb.execute(conn, invalidQuery),
            QueryError,
          );
        });
      },
    });

    // Syntax error should throw
    await t.step({
      name: "syntax error throws error",
      async fn() {
        await withConn((conn) => {
          assertThrows(
            () => duckdb.execute(conn, "SELCT 1"),
            QueryError,
          );
        });
      },
    });

    // QueryError should have stable query property
    await t.step({
      name: "QueryError has stable query property",
      async fn() {
        await withConn((conn) => {
          const sql = "SELECT * FROM nonexistent";
          try {
            duckdb.execute(conn, sql);
            throw new Error("Should have thrown");
          } catch (e) {
            const err = e as QueryError;
            // Error should be QueryError with query property
            assertEquals(err instanceof QueryError, true);
            // The query property should contain the original SQL
            assertEquals(err.query, sql);
          }
        });
      },
    });

    // Connection remains usable after query error
    await t.step({
      name: "connection remains usable after query error",
      async fn() {
        await withConn((conn) => {
          // First, cause an error
          try {
            duckdb.execute(conn, "SELECT * FROM nonexistent_table");
          } catch (e) {
            // Verify it's a QueryError
            assertEquals(e instanceof QueryError, true);
          }

          // Connection should still work
          const rows = query(conn, "SELECT 1 as test");
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 1);
        });
      },
    });
  },
});

Deno.test({
  name: "errors: empty SQL",
  async fn(t) {
    // Empty SQL should throw
    await t.step({
      name: "empty SQL throws error",
      async fn() {
        await withConn((conn) => {
          assertThrows(
            () => duckdb.execute(conn, ""),
            QueryError,
          );
        });
      },
    });

    // Whitespace-only SQL should throw
    await t.step({
      name: "whitespace-only SQL throws error",
      async fn() {
        await withConn((conn) => {
          assertThrows(
            () => duckdb.execute(conn, "   "),
            QueryError,
          );
        });
      },
    });
  },
});

Deno.test({
  name: "errors: prepare with invalid SQL",
  async fn(t) {
    // Prepare with invalid SQL should throw DatabaseError (not QueryError)
    await t.step({
      name: "prepare invalid SQL throws",
      async fn() {
        await withConn((conn) => {
          assertThrows(
            () => duckdb.prepare(conn, "PREPARE nonexistent"),
            DatabaseError,
          );
        });
      },
    });

    // Prepare with invalid table
    await t.step({
      name: "prepare with invalid table throws",
      async fn() {
        await withConn((conn) => {
          assertThrows(
            () => duckdb.prepare(conn, "SELECT * FROM invalid_table_xyz"),
            DatabaseError,
          );
        });
      },
    });
  },
});
