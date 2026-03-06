/**
 * Functional error assertion tests
 *
 * Tests for specific error types, error messages, and error properties
 */

import { assertEquals, assertThrows } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { DatabaseError, QueryError } from "@ggpwnkthx/duckdb";
import { withConn } from "./utils.ts";

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
          const query = "SELECT * FROM nonexistent_table_xyz";
          assertThrows(
            () => duckdb.execute(conn, query),
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

    // Invalid SQL should have meaningful error message
    await t.step({
      name: "QueryError has query property",
      async fn() {
        await withConn((conn) => {
          try {
            duckdb.execute(conn, "SELECT * FROM nonexistent");
            throw new Error("Should have thrown");
          } catch (e) {
            const err = e as QueryError;
            // Error should be QueryError with query property
            assertEquals(err instanceof QueryError, true);
            assertEquals(typeof err.query, "string");
          }
        });
      },
    });
  },
});

Deno.test({
  name: "errors: empty SQL",
  sanitizeResources: false,
  sanitizeOps: false,
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
  sanitizeResources: false,
  sanitizeOps: false,
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
