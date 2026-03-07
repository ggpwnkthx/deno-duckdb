/**
 * Functional type coverage tests
 *
 * Tests for extended type support: NaN, Infinity, and value extraction
 */

import { assertEquals, assertExists } from "@std/assert";

import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec, withConn } from "./utils.ts";

Deno.test({
  name: "types: floating-point special values",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "NaN handling",
      async fn() {
        await withConn((conn) => {
          // NaN from SQL
          const handle = duckdb.execute(conn, "SELECT 'NaN'::DOUBLE");
          const rows = duckdb.fetchAll(handle);
          assertExists(rows[0][0]);
          // NaN should be returned as a number
          assertEquals(typeof rows[0][0], "number");
          // Check it's actually NaN
          assertEquals(Number.isNaN(rows[0][0] as number), true);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "Infinity handling",
      async fn() {
        await withConn((conn) => {
          // Positive Infinity
          const handle = duckdb.execute(conn, "SELECT 'Infinity'::DOUBLE");
          const rows = duckdb.fetchAll(handle);
          // Keep assertExists for sanity check, but use exact value assertion
          assertExists(rows[0][0]);
          assertEquals(rows[0][0], Infinity);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "Negative Infinity handling",
      async fn() {
        await withConn((conn) => {
          // Negative Infinity
          const handle = duckdb.execute(conn, "SELECT '-Infinity'::DOUBLE");
          const rows = duckdb.fetchAll(handle);
          // Keep assertExists for sanity check, but use exact value assertion
          assertExists(rows[0][0]);
          assertEquals(rows[0][0], -Infinity);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "Negative zero handling",
      async fn() {
        await withConn((conn) => {
          // Negative zero from SQL
          const handle = duckdb.execute(conn, "SELECT '-0'::DOUBLE");
          const rows = duckdb.fetchAll(handle);
          assertExists(rows[0][0]);
          // Negative zero should be returned as a number
          assertEquals(typeof rows[0][0], "number");
          // Check it's actually -0 (negative zero)
          const val = rows[0][0] as number;
          assertEquals(Object.is(val, -0), true);
          assertEquals(1 / val, -Infinity); // Mathematical test for -0
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: getValueByType consistency",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "getValueByType matches fetchAll for various types",
      async fn() {
        await withConn((conn) => {
          // Create table with various types
          exec(
            conn,
            "CREATE TABLE type_consistency_test(id INTEGER, val TEXT)",
          );
          exec(
            conn,
            "INSERT INTO type_consistency_test VALUES (1, 'test')",
          );

          const handle = duckdb.execute(
            conn,
            "SELECT * FROM type_consistency_test",
          );

          // Get column types
          const idType = duckdb.columnType(handle, 0);
          const valType = duckdb.columnType(handle, 1);

          // Use getValueByType
          const idVal = duckdb.getValueByType(handle, 0, 0, idType);
          const valVal = duckdb.getValueByType(handle, 0, 1, valType);

          // Get fetchAll values
          const rows = duckdb.fetchAll(handle);

          // Compare
          assertEquals(idVal, rows[0][0]);
          assertEquals(valVal, rows[0][1]);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});
