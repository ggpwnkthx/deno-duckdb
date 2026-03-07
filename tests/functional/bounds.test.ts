/**
 * Functional out-of-bounds and edge case tests
 *
 * Tests for safe behavior when accessing invalid indices
 */

import { assertEquals, assertThrows } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import { exec, withConn } from "./utils.ts";

// Smoke test: verify library can be loaded and opened successfully
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
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Valid boundary indices - first, middle, last
    await t.step({
      name: "columnName with valid indices 0, 1, 2",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT a, b, c FROM (VALUES (1, 2, 3)) AS t(a, b, c)",
          );
          assertEquals(duckdb.columnName(handle, 0), "a");
          assertEquals(duckdb.columnName(handle, 1), "b");
          assertEquals(duckdb.columnName(handle, 2), "c");
          duckdb.destroyResult(handle);
        });
      },
    });

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
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Valid boundary indices - first and last
    await t.step({
      name: "columnType with valid indices 0 and 1",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 1::INTEGER, 'text'::TEXT",
          );
          assertEquals(
            duckdb.columnType(handle, 0),
            DUCKDB_TYPE.DUCKDB_TYPE_INTEGER,
          );
          assertEquals(
            duckdb.columnType(handle, 1),
            DUCKDB_TYPE.DUCKDB_TYPE_VARCHAR,
          );
          duckdb.destroyResult(handle);
        });
      },
    });

    // Out-of-bounds column type should return INVALID
    await t.step({
      name: "columnType with invalid index returns INVALID",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2, 3");
          // Valid indices are 0, 1, 2
          const type = duckdb.columnType(handle, 999);
          assertEquals(type, DUCKDB_TYPE.DUCKDB_TYPE_INVALID);
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
          assertEquals(type, DUCKDB_TYPE.DUCKDB_TYPE_INVALID);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "bounds: isNull out of bounds",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Valid row and column access
    await t.step({
      name: "isNull with valid row 0 and column 0",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE bounds_null_test(id INTEGER, val TEXT)");
          exec(conn, "INSERT INTO bounds_null_test VALUES (1, 'test')");
          const handle = duckdb.execute(conn, "SELECT * FROM bounds_null_test");
          const result = duckdb.isNull(handle, 0, 0);
          assertEquals(result, false);
          duckdb.destroyResult(handle);
        });
      },
    });

    // Out-of-bounds row index throws RangeError
    await t.step({
      name: "isNull with out-of-bounds row throws RangeError",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE bounds_null_test(id INTEGER, val TEXT)");
          exec(conn, "INSERT INTO bounds_null_test VALUES (1, 'test')");
          const handle = duckdb.execute(conn, "SELECT * FROM bounds_null_test");
          // Row 0 exists, row 999 does not - should throw
          assertThrows(
            () => duckdb.isNull(handle, 999, 0),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });

    // Out-of-bounds column index throws RangeError
    await t.step({
      name: "isNull with out-of-bounds column throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2");
          // Column 0 and 1 exist, column 999 does not - should throw
          assertThrows(
            () => duckdb.isNull(handle, 0, 999),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });

    // Negative row index throws RangeError
    await t.step({
      name: "isNull with negative row throws RangeError",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE bounds_null_test(id INTEGER, val TEXT)");
          exec(conn, "INSERT INTO bounds_null_test VALUES (1, 'test')");
          const handle = duckdb.execute(conn, "SELECT * FROM bounds_null_test");
          // Negative row index - should throw
          assertThrows(
            () => duckdb.isNull(handle, -1, 0),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });

    // Negative column index throws RangeError
    await t.step({
      name: "isNull with negative column throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2");
          // Negative column index - should throw
          assertThrows(
            () => duckdb.isNull(handle, 0, -1),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "bounds: empty result set",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Column metadata should work even on empty results
    await t.step({
      name: "columnType on empty result",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1::INTEGER WHERE 1=0");
          const type = duckdb.columnType(handle, 0);
          // Returns the actual column type even for empty results
          assertEquals(type, DUCKDB_TYPE.DUCKDB_TYPE_INTEGER);
          duckdb.destroyResult(handle);
        });
      },
    });

    // Column name should work on empty result
    await t.step({
      name: "columnName on empty result",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 1::INTEGER AS my_col WHERE 1=0",
          );
          const name = duckdb.columnName(handle, 0);
          // Returns the actual column name even for empty results
          assertEquals(name, "my_col");
          duckdb.destroyResult(handle);
        });
      },
    });

    // Row access on empty result throws RangeError
    await t.step({
      name: "getInt32 on empty result throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1::INTEGER WHERE 1=0");
          assertThrows(
            () => duckdb.getInt32(handle, 0, 0),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "bounds: other getters on bounds errors",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    await t.step({
      name: "getInt32 with out-of-bounds row throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          assertThrows(
            () => duckdb.getInt32(handle, 999, 0),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "getInt32 with out-of-bounds column throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          assertThrows(
            () => duckdb.getInt32(handle, 0, 999),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "getString with negative row throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 'test'");
          assertThrows(
            () => duckdb.getString(handle, -1, 0),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "getDouble with negative column throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1.5");
          assertThrows(
            () => duckdb.getDouble(handle, 0, -1),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "bounds: non-integer numeric indices",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    await t.step({
      name: "columnName with NaN throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2, 3");
          assertThrows(() => duckdb.columnName(handle, NaN), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "columnName with 1.5 throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2, 3");
          assertThrows(() => duckdb.columnName(handle, 1.5), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "columnName with Infinity throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2, 3");
          assertThrows(() => duckdb.columnName(handle, Infinity), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "columnType with NaN throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2, 3");
          assertThrows(() => duckdb.columnType(handle, NaN), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "columnType with Infinity throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1, 2, 3");
          assertThrows(() => duckdb.columnType(handle, Infinity), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "isNull with Infinity row throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          assertThrows(() => duckdb.isNull(handle, Infinity, 0), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "getInt32 with 1.5 column throws RangeError",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          assertThrows(() => duckdb.getInt32(handle, 0, 1.5), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});
