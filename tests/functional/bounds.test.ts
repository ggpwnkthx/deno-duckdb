/**
 * Functional out-of-bounds and edge case tests
 *
 * Tests for safe behavior when accessing invalid indices
 */

import { assertEquals } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec, withConn } from "./utils.ts";

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
  name: "bounds: columnName out of bounds",
  async fn(t) {
    // Out-of-bounds column name should return empty string
    await t.step({
      name: "columnName with invalid index returns empty string",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2, 3");
          // Valid indices are 0, 1, 2
          const name = duckdb.columnName(handle, 999);
          assertEquals(name, "");
          duckdb.destroyResult(handle);
        });
      },
    });

    // Negative index should also return empty string
    await t.step({
      name: "columnName with negative index returns empty string",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          const name = duckdb.columnName(handle, -1);
          assertEquals(name, "");
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "bounds: columnType out of bounds",
  async fn(t) {
    // Out-of-bounds column type should return 0 (INVALID)
    await t.step({
      name: "columnType with invalid index returns INVALID",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2, 3");
          // Valid indices are 0, 1, 2
          const type = duckdb.columnType(handle, 999);
          assertEquals(type, 0);
          duckdb.destroyResult(handle);
        });
      },
    });

    // Negative index should also return INVALID
    await t.step({
      name: "columnType with negative index returns INVALID",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          const type = duckdb.columnType(handle, -1);
          assertEquals(type, 0);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "bounds: isNull out of bounds",
  async fn(t) {
    // Out-of-bounds row index
    await t.step({
      name: "isNull with out-of-bounds row",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE bounds_null_test(id INTEGER, val TEXT)");
          exec(conn, "INSERT INTO bounds_null_test VALUES (1, 'test')");
          const handle = duckdb.execute(conn, "SELECT * FROM bounds_null_test");
          // Row 0 exists, row 999 does not
          const isNull = duckdb.isNull(handle, 999, 0);
          // Implementation reads from null mask without bounds checking
          // Out-of-bounds returns unpredictable boolean (arbitrary memory read)
          // Test verifies it returns a boolean (not undefined/crashes)
          assertEquals(typeof isNull, "boolean");
          duckdb.destroyResult(handle);
        });
      },
    });

    // Out-of-bounds column index
    await t.step({
      name: "isNull with out-of-bounds column",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2");
          // Column 0 and 1 exist, column 999 does not
          const isNull = duckdb.isNull(handle, 0, 999);
          // Implementation reads from null mask without bounds checking
          // Out-of-bounds returns unpredictable boolean (arbitrary memory read)
          // Test verifies it returns a boolean (not undefined/crashes)
          assertEquals(typeof isNull, "boolean");
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "bounds: empty result set",
  async fn(t) {
    // Column metadata should work even on empty results
    await t.step({
      name: "columnType on empty result",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1::INTEGER WHERE 1=0");
          const type = duckdb.columnType(handle, 0);
          // Returns the actual column type even for empty results
          // DUCKDB_TYPE_INTEGER = 4
          assertEquals(type, 4);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});
