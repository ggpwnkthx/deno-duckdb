/**
 * Functional cross-API consistency tests
 *
 * Tests that all APIs return identical results: fetchAll, typed getters, getValueByType, stream
 */

import { assertEquals, assertThrows } from "@std/assert";

import type { RowData } from "@ggpwnkthx/duckdb";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec, withConn } from "./utils.ts";
import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";

Deno.test({
  name: "consistency: typed getters across all types in single table",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "fetchAll matches typed getters for all types",
      async fn() {
        await withConn((conn) => {
          // Create single table with all types
          exec(
            conn,
            "CREATE TABLE type_getter_test(id INTEGER, big BIGINT, dbl DOUBLE, str TEXT, flag BOOLEAN)",
          );
          exec(
            conn,
            "INSERT INTO type_getter_test VALUES (42, 9223372036854775807, 3.14159, 'hello world', true)",
          );
          const handle = duckdb.execute(conn, "SELECT * FROM type_getter_test");

          // Get via typed getters
          const typedId = duckdb.getInt32(handle, 0, 0);
          const typedBig = duckdb.getInt64(handle, 0, 1);
          const typedDbl = duckdb.getDouble(handle, 0, 2);
          const typedStr = duckdb.getString(handle, 0, 3);
          // Note: BOOLEAN returns as Int8 (0 or 1), not JS boolean
          const typedFlag = duckdb.getValueByType(
            handle,
            0,
            4,
            DUCKDB_TYPE.DUCKDB_TYPE_BOOLEAN,
          );

          // Get via fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllId = rows[0][0];
          const fetchAllBig = rows[0][1];
          const fetchAllDbl = rows[0][2];
          const fetchAllStr = rows[0][3];
          const fetchAllFlag = rows[0][4];

          // Assert all values match
          assertEquals(typedId, fetchAllId);
          assertEquals(typedBig, fetchAllBig);
          assertEquals(typedDbl, fetchAllDbl);
          assertEquals(typedStr, fetchAllStr);
          assertEquals(typedFlag, fetchAllFlag);

          // Verify actual values
          assertEquals(typedId, 42);
          assertEquals(typedBig, 9223372036854775807n);
          assertEquals(typedDbl, 3.14159);
          assertEquals(typedStr, "hello world");
          assertEquals(typedFlag, 1); // BOOLEAN returns 0/1 as number

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: boolean mapping contract",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "BOOLEAN returns 0/1 as numbers, not JS booleans",
      async fn() {
        await withConn((conn) => {
          // Using SELECT with UNION to get true/false values
          const handle = duckdb.execute(
            conn,
            "SELECT true as v UNION ALL SELECT false",
          );

          // Get column type
          const boolType = duckdb.columnType(handle, 0);

          // Verify type is BOOLEAN
          assertEquals(boolType, DUCKDB_TYPE.DUCKDB_TYPE_BOOLEAN);

          // fetchAll should return 0/1 for false/true
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], 1); // true -> 1
          assertEquals(rows[1][0], 0); // false -> 0

          // getValueByType should return 0/1
          const val1 = duckdb.getValueByType(handle, 0, 0, boolType);
          const val2 = duckdb.getValueByType(handle, 1, 0, boolType);
          assertEquals(val1, 1);
          assertEquals(val2, 0);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "stream returns 0/1 for BOOLEAN like fetchAll",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE bool_stream_test(val BOOLEAN)",
          );
          exec(
            conn,
            "INSERT INTO bool_stream_test VALUES (true), (false)",
          );

          // fetchAll
          const handle1 = duckdb.execute(
            conn,
            "SELECT * FROM bool_stream_test ORDER BY val",
          );
          const fetchRows = duckdb.fetchAll(handle1);
          duckdb.destroyResult(handle1);

          // stream
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM bool_stream_test ORDER BY val",
            )
          ) {
            streamRows.push(row);
          }

          // Both should return 0/1 consistently
          assertEquals(fetchRows[0][0], streamRows[0][0]);
          assertEquals(fetchRows[1][0], streamRows[1][0]);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: empty result handling",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "empty result returns empty array across all APIs",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE empty_test(id INTEGER, val TEXT)");
          exec(conn, "INSERT INTO empty_test VALUES (1, 'test')");
          exec(conn, "DELETE FROM empty_test");

          // fetchAll should return empty array
          const handle1 = duckdb.execute(conn, "SELECT * FROM empty_test");
          const fetchRows = duckdb.fetchAll(handle1);
          duckdb.destroyResult(handle1);
          assertEquals(fetchRows, []);

          // stream should yield no rows
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(conn, "SELECT * FROM empty_test")
          ) {
            streamRows.push(row);
          }
          assertEquals(streamRows, []);

          // getValueByType should handle gracefully (out of bounds)
          const handle2 = duckdb.execute(conn, "SELECT * FROM empty_test");
          assertThrows(
            () => {
              duckdb.getValueByType(
                handle2,
                0,
                0,
                DUCKDB_TYPE.DUCKDB_TYPE_INTEGER,
              );
            },
            RangeError,
          );
          duckdb.destroyResult(handle2);
        });
      },
    });

    await t.step({
      name: "COUNT query returns 0 for empty table",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE empty_count(id INTEGER)");
          const handle = duckdb.execute(
            conn,
            "SELECT COUNT(*) FROM empty_count",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], 0n);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: multi-row ordered results",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "fetchAll matches stream for 5+ rows with all columns",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE multi_row_test(id INTEGER, name TEXT, value DOUBLE)",
          );
          exec(
            conn,
            `INSERT INTO multi_row_test VALUES
              (5, 'echo', 2.718),
              (1, 'alpha', 1.414),
              (3, 'charlie', 3.141),
              (4, 'delta', 1.732),
              (2, 'bravo', 2.236)`,
          );

          // fetchAll with ORDER BY
          const handle1 = duckdb.execute(
            conn,
            "SELECT * FROM multi_row_test ORDER BY id",
          );
          const fetchRows = duckdb.fetchAll(handle1);
          duckdb.destroyResult(handle1);

          // stream with ORDER BY
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM multi_row_test ORDER BY id",
            )
          ) {
            streamRows.push(row);
          }

          // Should have 5 rows
          assertEquals(fetchRows.length, 5);
          assertEquals(streamRows.length, 5);

          // Each full row should match
          for (let i = 0; i < fetchRows.length; i++) {
            assertEquals(streamRows[i].length, fetchRows[i].length);
            for (let j = 0; j < fetchRows[i].length; j++) {
              assertEquals(streamRows[i][j], fetchRows[i][j]);
            }
          }

          // Verify specific values
          assertEquals(fetchRows[0][0], 1); // alpha
          assertEquals(fetchRows[1][0], 2); // bravo
          assertEquals(fetchRows[2][0], 3); // charlie
          assertEquals(fetchRows[3][0], 4); // delta
          assertEquals(fetchRows[4][0], 5); // echo
        });
      },
    });

    await t.step({
      name: "getValueByType matches fetchAll for all columns in multi-row",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE multi_type_test(id INTEGER, val TEXT)",
          );
          exec(
            conn,
            "INSERT INTO multi_type_test VALUES (1, 'one'), (2, 'two'), (3, 'three')",
          );
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM multi_type_test ORDER BY id",
          );

          const idType = duckdb.columnType(handle, 0);
          const valType = duckdb.columnType(handle, 1);
          const rows = duckdb.fetchAll(handle);

          // Check each row with getValueByType
          for (let r = 0; r < 3; r++) {
            const idVal = duckdb.getValueByType(handle, r, 0, idType);
            const valVal = duckdb.getValueByType(handle, r, 1, valType);
            assertEquals(idVal, rows[r][0]);
            assertEquals(valVal, rows[r][1]);
          }

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: HugeInt support",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "fetchAll vs getValueByType for HUGEINT",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE hugeint_test(val HUGEINT)",
          );
          // Insert a value larger than BIGINT max
          exec(
            conn,
            "INSERT INTO hugeint_test VALUES (170141183460469231731687303715884105727)",
          );
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM hugeint_test",
          );

          // Get column type
          const hugeintType = duckdb.columnType(handle, 0);
          assertEquals(hugeintType, DUCKDB_TYPE.DUCKDB_TYPE_HUGEINT);

          // Get via fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // Get via getValueByType
          const getValueByTypeVal = duckdb.getValueByType(
            handle,
            0,
            0,
            hugeintType,
          );

          // Both should match
          assertEquals(getValueByTypeVal, fetchAllVal);

          // Verify actual value
          assertEquals(
            fetchAllVal,
            170141183460469231731687303715884105727n,
          );

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "stream matches fetchAll for HUGEINT",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE hugeint_stream_test(id INTEGER, val HUGEINT)",
          );
          exec(
            conn,
            "INSERT INTO hugeint_stream_test VALUES (1, 12345678901234567890), (2, 98765432109876543210)",
          );

          // fetchAll
          const handle1 = duckdb.execute(
            conn,
            "SELECT * FROM hugeint_stream_test ORDER BY id",
          );
          const fetchRows = duckdb.fetchAll(handle1);
          duckdb.destroyResult(handle1);

          // stream
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM hugeint_stream_test ORDER BY id",
            )
          ) {
            streamRows.push(row);
          }

          // Should match
          assertEquals(streamRows[0][1], fetchRows[0][1]);
          assertEquals(streamRows[1][1], fetchRows[1][1]);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: NaN and Infinity handling",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "NaN and Infinity consistent across APIs",
      async fn() {
        await withConn((conn) => {
          // Use 'NaN'::DOUBLE syntax as shown in types.test.ts
          const handle = duckdb.execute(
            conn,
            "SELECT 'NaN'::DOUBLE as nan_val, 'Infinity'::DOUBLE as inf_val, '-Infinity'::DOUBLE as neginf_val",
          );

          // fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchNaN = rows[0][0];
          const fetchInf = rows[0][1];
          const fetchNegInf = rows[0][2];

          // getValueByType for each column
          const nanType = duckdb.columnType(handle, 0);
          const infType = duckdb.columnType(handle, 1);
          const neginfType = duckdb.columnType(handle, 2);

          const getNaN = duckdb.getValueByType(handle, 0, 0, nanType);
          const getInf = duckdb.getValueByType(handle, 0, 1, infType);
          const getNegInf = duckdb.getValueByType(handle, 0, 2, neginfType);

          // Verify consistency
          assertEquals(fetchNaN, getNaN);
          assertEquals(fetchInf, getInf);
          assertEquals(fetchNegInf, getNegInf);

          // Verify NaN behavior
          assertEquals(Number.isNaN(fetchNaN as number), true);
          assertEquals(fetchInf, Infinity);
          assertEquals(fetchNegInf, -Infinity);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "stream matches fetchAll for NaN/Infinity",
      async fn() {
        await withConn((conn) => {
          // Use 'NaN'::DOUBLE and 'Infinity'::DOUBLE syntax
          // fetchAll
          const handle1 = duckdb.execute(
            conn,
            "SELECT 'NaN'::DOUBLE as nan_val, 'Infinity'::DOUBLE as inf_val",
          );
          const fetchRows = duckdb.fetchAll(handle1);
          duckdb.destroyResult(handle1);

          // stream
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT 'NaN'::DOUBLE as nan_val, 'Infinity'::DOUBLE as inf_val",
            )
          ) {
            streamRows.push(row);
          }

          // NaN should match (NaN === NaN is false, use isNaN)
          assertEquals(
            Number.isNaN(streamRows[0][0] as number),
            Number.isNaN(fetchRows[0][0] as number),
          );
          assertEquals(streamRows[0][1], fetchRows[0][1]);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: repeated execution",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "same query executed twice returns identical results",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE repeat_test(id INTEGER, val TEXT)",
          );
          exec(
            conn,
            "INSERT INTO repeat_test VALUES (1, 'first'), (2, 'second')",
          );

          // Execute same query twice - different result handles
          const handle1 = duckdb.execute(
            conn,
            "SELECT * FROM repeat_test ORDER BY id",
          );
          const handle2 = duckdb.execute(
            conn,
            "SELECT * FROM repeat_test ORDER BY id",
          );

          const rows1 = duckdb.fetchAll(handle1);
          const rows2 = duckdb.fetchAll(handle2);

          // Should be identical
          assertEquals(rows1.length, rows2.length);
          for (let i = 0; i < rows1.length; i++) {
            assertEquals(rows1[i].length, rows2[i].length);
            for (let j = 0; j < rows1[i].length; j++) {
              assertEquals(rows1[i][j], rows2[i][j]);
            }
          }

          duckdb.destroyResult(handle1);
          duckdb.destroyResult(handle2);
        });
      },
    });

    await t.step({
      name: "stream with repeated execution",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE repeat_stream_test(val INTEGER)",
          );
          exec(
            conn,
            "INSERT INTO repeat_stream_test VALUES (10), (20), (30)",
          );

          // First stream
          const stream1: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM repeat_stream_test ORDER BY val",
            )
          ) {
            stream1.push(row);
          }

          // Second stream
          const stream2: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM repeat_stream_test ORDER BY val",
            )
          ) {
            stream2.push(row);
          }

          // Should be identical
          assertEquals(stream1.length, stream2.length);
          for (let i = 0; i < stream1.length; i++) {
            assertEquals(stream1[i][0], stream2[i][0]);
          }
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: fetchAll vs getValueByType",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "fetchAll matches getValueByType for various types",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE value_type_test(id INTEGER, val TEXT, num DOUBLE)",
          );
          exec(
            conn,
            "INSERT INTO value_type_test VALUES (1, 'test', 1.5)",
          );
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM value_type_test",
          );

          // Get column types
          const idType = duckdb.columnType(handle, 0);
          const valType = duckdb.columnType(handle, 1);
          const numType = duckdb.columnType(handle, 2);

          // Get values via getValueByType
          const idVal = duckdb.getValueByType(handle, 0, 0, idType);
          const valVal = duckdb.getValueByType(handle, 0, 1, valType);
          const numVal = duckdb.getValueByType(handle, 0, 2, numType);

          // Get values via fetchAll
          const rows = duckdb.fetchAll(handle);
          assertEquals(idVal, rows[0][0]);
          assertEquals(valVal, rows[0][1]);
          assertEquals(numVal, rows[0][2]);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: fetchAll vs stream",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "fetchAll returns same values as stream",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE stream_consistency(id INTEGER, name TEXT)",
          );
          exec(
            conn,
            "INSERT INTO stream_consistency VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Charlie')",
          );

          // Get via fetchAll
          const handle1 = duckdb.execute(
            conn,
            "SELECT * FROM stream_consistency ORDER BY id",
          );
          const fetchAllRows = duckdb.fetchAll(handle1);
          duckdb.destroyResult(handle1);

          // Get via stream
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM stream_consistency ORDER BY id",
            )
          ) {
            streamRows.push(row);
          }

          // Should have same length
          assertEquals(streamRows.length, fetchAllRows.length);

          // Each row should match
          for (let i = 0; i < fetchAllRows.length; i++) {
            assertEquals(streamRows[i][0], fetchAllRows[i][0]);
            assertEquals(streamRows[i][1], fetchAllRows[i][1]);
          }
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: typed getters vs stream",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "typed getters return same values as stream",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE typed_stream_test(id INTEGER, val TEXT)",
          );
          exec(
            conn,
            "INSERT INTO typed_stream_test VALUES (1, 'test')",
          );

          // Get via typed getters
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM typed_stream_test",
          );
          const typedInt = duckdb.getInt32(handle, 0, 0);
          const typedStr = duckdb.getString(handle, 0, 1);
          duckdb.destroyResult(handle);

          // Get via stream
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM typed_stream_test",
            )
          ) {
            streamRows.push(row);
          }

          assertEquals(typedInt, streamRows[0][0]);
          assertEquals(typedStr, streamRows[0][1]);
        });
      },
    });
  },
});

Deno.test({
  name: "consistency: NULL handling across APIs",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "NULL handling is consistent across APIs",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE null_consistency(id INTEGER, val TEXT)");
          exec(
            conn,
            "INSERT INTO null_consistency VALUES (1, NULL), (2, 'test')",
          );

          // fetchAll
          const handle1 = duckdb.execute(
            conn,
            "SELECT * FROM null_consistency ORDER BY id",
          );
          const fetchRows = duckdb.fetchAll(handle1);
          duckdb.destroyResult(handle1);

          // stream
          const streamRows: RowData[] = [];
          for (
            const row of duckdb.stream(
              conn,
              "SELECT * FROM null_consistency ORDER BY id",
            )
          ) {
            streamRows.push(row);
          }

          // Both should return null for the NULL value
          assertEquals(fetchRows[0][1], null);
          assertEquals(streamRows[0][1], null);

          // Both should return 'test' for the non-NULL value
          assertEquals(fetchRows[1][1], "test");
          assertEquals(streamRows[1][1], "test");
        });
      },
    });

    await t.step({
      name: "isNull matches fetchAll null detection",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE is_null_test(id INTEGER, val TEXT)");
          exec(
            conn,
            "INSERT INTO is_null_test VALUES (1, NULL), (2, 'test')",
          );
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM is_null_test ORDER BY id",
          );

          // Row 0, col 1 should be null
          assertEquals(duckdb.isNull(handle, 0, 1), true);

          // Row 1, col 1 should not be null
          assertEquals(duckdb.isNull(handle, 1, 1), false);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});
