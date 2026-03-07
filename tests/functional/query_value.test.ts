/**
 * Functional query and value extraction operations tests
 */

import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec, query, withConn } from "./utils.ts";

Deno.test({
  name: "query and value: execute, manage queries, and extract values",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Step 1: execute queries
    await t.step({
      name: "execute queries",
      async fn() {
        // Executes SELECT query
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1 as num");
          assertExists(handle);
          duckdb.destroyResult(handle);
        });

        // Executes INSERT query
        await withConn((conn) => {
          // Use exec for DDL/INSERT - automatically destroys result
          exec(conn, "CREATE TABLE test(id INTEGER, name VARCHAR)");
          exec(conn, "INSERT INTO test VALUES (1, 'test')");

          // Verify data with query
          const rows = query(conn, "SELECT * FROM test");
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 1);
        });
      },
    });

    // Step 2: row count
    await t.step({
      name: "row count",
      async fn() {
        // Returns correct row count
        await withConn((conn) => {
          exec(conn, "CREATE TABLE row_count_test(id INTEGER)");
          exec(conn, "INSERT INTO row_count_test VALUES (1), (2), (3)");
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM row_count_test",
          );
          const count = duckdb.rowCount(handle);
          assertEquals(count, 3n);
          duckdb.destroyResult(handle);
        });

        // Returns 0 for empty result
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM (SELECT 1) WHERE 1=0",
          );
          const count = duckdb.rowCount(handle);
          assertEquals(count, 0n);
          duckdb.destroyResult(handle);
        });
      },
    });

    // Step 3: column metadata with exact type codes
    await t.step({
      name: "column metadata with exact types",
      async fn() {
        // Returns column count
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 1 as a, 2 as b, 3 as c",
          );
          const count = duckdb.columnCount(handle);
          assertEquals(count, 3n);
          duckdb.destroyResult(handle);
        });

        // Returns column name
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1 as my_column");
          const name = duckdb.columnName(handle, 0);
          assertEquals(name, "my_column");
          duckdb.destroyResult(handle);
        });

        // Returns exact column type codes
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 1::INTEGER as int_col, 'text'::VARCHAR as str_col, 1::BIGINT as bigint_col, 1.5::DOUBLE as dbl_col, true::BOOLEAN as bool_col",
          );
          // INTEGER type is 4
          const intType = duckdb.columnType(handle, 0);
          assertEquals(intType, DUCKDB_TYPE.DUCKDB_TYPE_INTEGER);
          // VARCHAR type is 17
          const strType = duckdb.columnType(handle, 1);
          assertEquals(strType, DUCKDB_TYPE.DUCKDB_TYPE_VARCHAR);
          // BIGINT type is 5
          const bigType = duckdb.columnType(handle, 2);
          assertEquals(bigType, DUCKDB_TYPE.DUCKDB_TYPE_BIGINT);
          // DOUBLE type is 7
          const dblType = duckdb.columnType(handle, 3);
          assertEquals(dblType, DUCKDB_TYPE.DUCKDB_TYPE_DOUBLE);
          // BOOLEAN type is 1
          const boolType = duckdb.columnType(handle, 4);
          assertEquals(boolType, DUCKDB_TYPE.DUCKDB_TYPE_BOOLEAN);
          duckdb.destroyResult(handle);
        });

        // Returns all column info
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 1 as id, 'test' as name",
          );
          const infos = duckdb.columnInfos(handle);
          assertEquals(infos.length, 2);
          assertEquals(infos[0].name, "id");
          assertEquals(infos[1].name, "name");
          duckdb.destroyResult(handle);
        });
      },
    });

    // Step 4: destroy result
    await t.step({
      name: "destroy result",
      async fn() {
        // Frees result memory
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          // Should not throw
          duckdb.destroyResult(handle);
        });
      },
    });

    // Step 5: value extraction
    await t.step({
      name: "value extraction",
      async fn() {
        // Detects NULL values
        await withConn((conn) => {
          // Create table with NULL value - use exec
          exec(conn, "CREATE TABLE null_test(id INTEGER, val TEXT)");
          exec(conn, "INSERT INTO null_test VALUES (1, NULL)");
          const handle = duckdb.execute(conn, "SELECT * FROM null_test");
          // The second column (index 1) should be NULL
          const isNull = duckdb.isNull(handle, 0, 1);
          assertEquals(isNull, true);
          duckdb.destroyResult(handle);
        });

        // Returns false for non-NULL values
        await withConn((conn) => {
          exec(conn, "CREATE TABLE non_null_test(id INTEGER, val TEXT)");
          exec(conn, "INSERT INTO non_null_test VALUES (1, 'hello')");
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM non_null_test",
          );
          // The second column should NOT be NULL
          const isNull = duckdb.isNull(handle, 0, 1);
          assertEquals(isNull, false);
          duckdb.destroyResult(handle);
        });

        // Extracts INTEGER values
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 42 as num");
          const intVal = duckdb.getInt32(handle, 0, 0);
          assertEquals(intVal, 42);
          duckdb.destroyResult(handle);
        });

        // Extracts BIGINT values
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 9223372036854775807::BIGINT as num",
          );
          const intVal = duckdb.getInt64(handle, 0, 0);
          assertEquals(intVal, 9223372036854775807n);
          duckdb.destroyResult(handle);
        });

        // Extracts DOUBLE values
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 3.14159::DOUBLE as num",
          );
          const doubleVal = duckdb.getDouble(handle, 0, 0);
          assertEquals(doubleVal, 3.14159);
          duckdb.destroyResult(handle);
        });

        // Extracts VARCHAR values
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 'hello world' as str",
          );
          const strVal = duckdb.getString(handle, 0, 0);
          assertEquals(strVal, "hello world");
          duckdb.destroyResult(handle);
        });

        // Typed getters return null on NULL values
        await withConn((conn) => {
          // getInt32 returns null for NULL
          exec(conn, "CREATE TABLE null_int_test(val INTEGER)");
          exec(conn, "INSERT INTO null_int_test VALUES (NULL)");
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM null_int_test",
          );
          const val = duckdb.getInt32(handle, 0, 0);
          assertEquals(val, null);
          duckdb.destroyResult(handle);
        });

        await withConn((conn) => {
          // getInt64 returns null for NULL
          exec(conn, "CREATE TABLE null_bigint_test(val BIGINT)");
          exec(conn, "INSERT INTO null_bigint_test VALUES (NULL)");
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM null_bigint_test",
          );
          const val = duckdb.getInt64(handle, 0, 0);
          assertEquals(val, null);
          duckdb.destroyResult(handle);
        });

        await withConn((conn) => {
          // getDouble returns null for NULL
          exec(conn, "CREATE TABLE null_double_test(val DOUBLE)");
          exec(conn, "INSERT INTO null_double_test VALUES (NULL)");
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM null_double_test",
          );
          const val = duckdb.getDouble(handle, 0, 0);
          assertEquals(val, null);
          duckdb.destroyResult(handle);
        });

        await withConn((conn) => {
          // getString returns null for NULL
          exec(conn, "CREATE TABLE null_str_test(val TEXT)");
          exec(conn, "INSERT INTO null_str_test VALUES (NULL)");
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM null_str_test",
          );
          const val = duckdb.getString(handle, 0, 0);
          assertEquals(val, null);
          duckdb.destroyResult(handle);
        });
      },
    });

    // Step 6: fetch all
    await t.step({
      name: "fetch all",
      async fn() {
        // Fetches all rows from result
        await withConn((conn) => {
          exec(conn, "CREATE TABLE fetch_test(id INTEGER, name TEXT)");
          exec(
            conn,
            "INSERT INTO fetch_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
          );
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM fetch_test ORDER BY id",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows.length, 3);
          assertEquals(rows[0][0], 1);
          assertEquals(rows[1][0], 2);
          assertEquals(rows[2][0], 3);
          duckdb.destroyResult(handle);
        });

        // Handles NULL values
        await withConn((conn) => {
          exec(conn, "CREATE TABLE fetch_null_test(id INTEGER, val TEXT)");
          exec(
            conn,
            "INSERT INTO fetch_null_test VALUES (1, NULL), (2, 'test')",
          );

          const handle = duckdb.execute(
            conn,
            "SELECT * FROM fetch_null_test ORDER BY id",
          );

          const rows = duckdb.fetchAll(handle);
          assertEquals(rows.length, 2);
          assertEquals(rows[0][1], null);
          assertEquals(rows[1][1], "test");
          duckdb.destroyResult(handle);
        });
      },
    });

    // Step 7: value by type
    await t.step({
      name: "value by type",
      async fn() {
        // Extracts value based on type
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE type_test(id INTEGER, val TEXT, num DOUBLE)",
          );
          exec(conn, "INSERT INTO type_test VALUES (1, 'test', 1.5)");
          const handle = duckdb.execute(conn, "SELECT * FROM type_test");
          // Get column types
          const idType = duckdb.columnType(handle, 0);
          const valType = duckdb.columnType(handle, 1);
          const numType = duckdb.columnType(handle, 2);
          // Extract values by type
          const idVal = duckdb.getValueByType(handle, 0, 0, idType);
          const valVal = duckdb.getValueByType(handle, 0, 1, valType);
          const numVal = duckdb.getValueByType(handle, 0, 2, numType);
          assertEquals(idVal, 1);
          assertEquals(valVal, "test");
          assertEquals(numVal, 1.5);
          duckdb.destroyResult(handle);
        });

        // Handles NULL type
        await withConn((conn) => {
          exec(conn, "CREATE TABLE null_type_test(val TEXT)");
          exec(conn, "INSERT INTO null_type_test VALUES (NULL)");
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM null_type_test",
          );
          const valType = duckdb.columnType(handle, 0);
          const val = duckdb.getValueByType(handle, 0, 0, valType);
          assertEquals(val, null);
          duckdb.destroyResult(handle);
        });
      },
    });

    // Step 8: type tests with exact values
    await t.step({
      name: "type tests with exact values",
      async fn() {
        // BOOLEAN true/false - API contract: returns 1/0 via getInt8
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT true as v UNION ALL SELECT false",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], 1);
          assertEquals(rows[1][0], 0);
          duckdb.destroyResult(handle);
        });

        // TINYINT values
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 1::TINYINT UNION ALL SELECT 127::TINYINT",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], 1);
          assertEquals(rows[1][0], 127);
          duckdb.destroyResult(handle);
        });

        // SMALLINT values
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 1::SMALLINT UNION ALL SELECT 32767::SMALLINT",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], 1);
          assertEquals(rows[1][0], 32767);
          duckdb.destroyResult(handle);
        });

        // FLOAT values
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 1.5::FLOAT",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], 1.5);
          duckdb.destroyResult(handle);
        });

        // HUGEINT large positive - using SQL literal to avoid floating-point precision loss
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT '1208925819614629174706176'::HUGEINT as v",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], 1208925819614629174706176n);
          duckdb.destroyResult(handle);
        });

        // HUGEINT exact positive value
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 12345678901234567890::HUGEINT as v",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], 12345678901234567890n);
          duckdb.destroyResult(handle);
        });

        // HUGEINT negative exact value
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT -12345678901234567890::HUGEINT as v",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], -12345678901234567890n);
          duckdb.destroyResult(handle);
        });

        // HUGEINT zero
        await withConn((conn) => {
          const handle = duckdb.execute(
            conn,
            "SELECT 0::HUGEINT as v",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], 0n);
          duckdb.destroyResult(handle);
        });

        // HUGEINT NULL handling
        await withConn((conn) => {
          exec(conn, "CREATE TABLE hugeint_null_test(v HUGEINT)");
          exec(
            conn,
            "INSERT INTO hugeint_null_test VALUES (NULL), (1::HUGEINT)",
          );
          const handle = duckdb.execute(
            conn,
            "SELECT * FROM hugeint_null_test",
          );
          const rows = duckdb.fetchAll(handle);
          assertEquals(rows[0][0], null);
          assertEquals(rows[1][0], 1n);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

// Negative test cases for getter edge cases
Deno.test({
  name: "query and value: getter edge cases",
  async fn(t) {
    // Out-of-bounds row/column indices
    await t.step({
      name: "out-of-bounds indices throw RangeError",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE bounds_test(id INTEGER)");
          exec(conn, "INSERT INTO bounds_test VALUES (1)");
          const handle = duckdb.execute(conn, "SELECT * FROM bounds_test");

          // Access row index 1 (out of bounds, only row 0 exists)
          // Should throw RangeError
          assertThrows(
            () => duckdb.getInt32(handle, 1, 0),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });

        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1 as a");
          // Access column index 1 (out of bounds, only column 0 exists)
          // Should throw RangeError
          assertThrows(
            () => duckdb.getInt32(handle, 0, 1),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });

    // Empty result metadata
    await t.step({
      name: "empty result metadata",
      async fn() {
        await withConn((conn) => {
          // Query that returns no rows
          const handle = duckdb.execute(conn, "SELECT 1 as num WHERE 1=0");

          // columnName should still work
          const name = duckdb.columnName(handle, 0);
          assertEquals(name, "num");

          // columnType should still return expected type
          const colType = duckdb.columnType(handle, 0);
          assertEquals(colType, DUCKDB_TYPE.DUCKDB_TYPE_INTEGER);

          // rowCount should be 0
          const count = duckdb.rowCount(handle);
          assertEquals(count, 0n);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

// Non-integer numeric indices on getters
Deno.test({
  name: "query and value: non-integer indices on getters",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    await t.step({
      name:
        "getInt32 with Infinity column throws RangeError (Infinity fails bounds check)",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          // Infinity >= colCount is true, triggering out-of-bounds check
          assertThrows(() => duckdb.getInt32(handle, 0, Infinity), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name:
        "getDouble with 1.5 row throws RangeError (fractional fails bounds check)",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1.5");
          // 1.5 >= rowCount (1) is true, triggering out-of-bounds check
          assertThrows(() => duckdb.getDouble(handle, 1.5, 0), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name:
        "getString with NaN column throws RangeError (NaN fails BigInt conversion)",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 'test'");
          // NaN >= colCount is false (NaN comparisons always return false),
          // so bounds check passes, then BigInt(NaN) throws RangeError
          assertThrows(() => duckdb.getString(handle, 0, NaN), RangeError);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name:
        "getValueByType with Infinity row throws RangeError (Infinity fails bounds check)",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.execute(conn, "SELECT 1");
          // Infinity >= rowCount is true, triggering out-of-bounds check
          assertThrows(
            () =>
              duckdb.getValueByType(
                handle,
                Infinity,
                0,
                DUCKDB_TYPE.DUCKDB_TYPE_INTEGER,
              ),
            RangeError,
          );
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});
