/**
 * Functional type coverage tests
 *
 * Tests for extended type support: DATE, TIME, TIMESTAMP, DECIMAL, unsigned types, etc.
 * Note: NaN, Infinity tests are in consistency.test.ts
 */

import { assertEquals } from "@std/assert";

import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import { exec, withConn } from "./utils.ts";

// NaN, Infinity, and negative zero are tested in consistency.test.ts

Deno.test({
  name: "types: DATE type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "DATE column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT '2024-01-15'::DATE");
          const typeEnum = duckdb.columnType(handle, 0);
          // DATE should be type 13 (DUCKDB_TYPE_DATE)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_DATE);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "DATE NULL handling via getValueByType",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE date_test(d DATE)");
          exec(conn, "INSERT INTO date_test VALUES (NULL)");

          const handle = duckdb.query(conn, "SELECT d FROM date_test");
          const typeEnum = duckdb.columnType(handle, 0);
          const val = duckdb.getValueByType(handle, 0, 0, typeEnum);

          // NULL should be returned as null
          assertEquals(val, null);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: TIME type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "TIME column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT '14:30:00'::TIME");
          const typeEnum = duckdb.columnType(handle, 0);
          // TIME should be type 16 (DUCKDB_TYPE_TIME)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_TIME);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "TIME NULL handling via getValueByType",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE time_test(t TIME)");
          exec(conn, "INSERT INTO time_test VALUES (NULL)");

          const handle = duckdb.query(conn, "SELECT t FROM time_test");
          const typeEnum = duckdb.columnType(handle, 0);
          const val = duckdb.getValueByType(handle, 0, 0, typeEnum);

          // NULL should be returned as null
          assertEquals(val, null);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: TIMESTAMP type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "TIMESTAMP column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(
            conn,
            "SELECT '2024-01-15 14:30:00'::TIMESTAMP",
          );
          const typeEnum = duckdb.columnType(handle, 0);
          // TIMESTAMP should be type 15 (DUCKDB_TYPE_TIMESTAMP)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "TIMESTAMP NULL handling via getValueByType",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE ts_test(ts TIMESTAMP)");
          exec(conn, "INSERT INTO ts_test VALUES (NULL)");

          const handle = duckdb.query(conn, "SELECT ts FROM ts_test");
          const typeEnum = duckdb.columnType(handle, 0);
          const val = duckdb.getValueByType(handle, 0, 0, typeEnum);

          // NULL should be returned as null
          assertEquals(val, null);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: DECIMAL type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "DECIMAL column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT '123.45'::DECIMAL(5,2)");
          const typeEnum = duckdb.columnType(handle, 0);
          // DECIMAL should be type 20 (DUCKDB_TYPE_DECIMAL)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_DECIMAL);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "DECIMAL NULL handling via getValueByType",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE decimal_test(d DECIMAL(5,2))");
          exec(conn, "INSERT INTO decimal_test VALUES (NULL)");

          const handle = duckdb.query(conn, "SELECT d FROM decimal_test");
          const typeEnum = duckdb.columnType(handle, 0);
          const val = duckdb.getValueByType(handle, 0, 0, typeEnum);

          // NULL should be returned as null
          assertEquals(val, null);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: BLOB type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "BLOB column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT 'hello'::BLOB");
          const typeEnum = duckdb.columnType(handle, 0);
          // BLOB should be type 19 (DUCKDB_TYPE_BLOB)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_BLOB);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "BLOB NULL handling via getValueByType",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE blob_test(b BLOB)");
          exec(conn, "INSERT INTO blob_test VALUES (NULL)");

          const handle = duckdb.query(conn, "SELECT b FROM blob_test");
          const typeEnum = duckdb.columnType(handle, 0);
          const val = duckdb.getValueByType(handle, 0, 0, typeEnum);

          // NULL should be returned as null
          assertEquals(val, null);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: unsigned integer type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "UTINYINT type detection",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT 1::UTINYINT");
          const typeEnum = duckdb.columnType(handle, 0);
          // If successful, should be UTINYINT
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_UTINYINT);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "UINTEGER type detection",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT 1::UINTEGER");
          const typeEnum = duckdb.columnType(handle, 0);
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_UINTEGER);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "UBIGINT type detection",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT 1::UBIGINT");
          const typeEnum = duckdb.columnType(handle, 0);
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_UBIGINT);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: DATE value retrieval",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "DATE fetchAll returns string representation",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE date_val_test(d DATE)");
          exec(conn, "INSERT INTO date_val_test VALUES ('2024-01-15')");

          const handle = duckdb.query(conn, "SELECT d FROM date_val_test");
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // DATE should be returned as string
          assertEquals(typeof fetchAllVal, "string");
          assertEquals(fetchAllVal, "2024-01-15");

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: TIME value retrieval",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "TIME fetchAll returns string representation",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE time_val_test(t TIME)");
          exec(conn, "INSERT INTO time_val_test VALUES ('14:30:00')");

          const handle = duckdb.query(conn, "SELECT t FROM time_val_test");
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // TIME should be returned as string
          assertEquals(typeof fetchAllVal, "string");
          assertEquals(fetchAllVal, "14:30:00");

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: TIMESTAMP value retrieval",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "TIMESTAMP fetchAll returns string representation",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE ts_val_test(ts TIMESTAMP)");
          exec(
            conn,
            "INSERT INTO ts_val_test VALUES ('2024-01-15 14:30:00')",
          );

          const handle = duckdb.query(conn, "SELECT ts FROM ts_val_test");
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // TIMESTAMP should be returned as string
          assertEquals(typeof fetchAllVal, "string");
          // DuckDB may return with microseconds
          const valStr = fetchAllVal as string;
          assertEquals(valStr.startsWith("2024-01-15"), true);

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: TIMESTAMP with microseconds",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "TIMESTAMP with fractional seconds exact value",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE ts_us_test(ts TIMESTAMP)");
          exec(
            conn,
            "INSERT INTO ts_us_test VALUES ('2024-01-15 14:30:30.123456')",
          );

          const handle = duckdb.query(conn, "SELECT ts FROM ts_us_test");
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // TIMESTAMP should be returned as string
          assertEquals(typeof fetchAllVal, "string");
          // Exact value test - not just startsWith
          assertEquals(fetchAllVal, "2024-01-15 14:30:30.123456");

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: pre-epoch TIMESTAMP",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "TIMESTAMP before 1970",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE pre_epoch_test(ts TIMESTAMP)");
          exec(
            conn,
            "INSERT INTO pre_epoch_test VALUES ('1960-01-01 00:00:00')",
          );

          const handle = duckdb.query(
            conn,
            "SELECT ts FROM pre_epoch_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // TIMESTAMP should be returned as string
          assertEquals(typeof fetchAllVal, "string");
          // Should preserve the pre-epoch date
          assertEquals(fetchAllVal, "1960-01-01 00:00:00");

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "TIMESTAMP very early date",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE early_date_test(ts TIMESTAMP)");
          exec(
            conn,
            "INSERT INTO early_date_test VALUES ('1900-01-01 00:00:00')",
          );

          const handle = duckdb.query(
            conn,
            "SELECT ts FROM early_date_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          assertEquals(typeof fetchAllVal, "string");
          assertEquals(fetchAllVal, "1900-01-01 00:00:00");

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: DECIMAL value retrieval",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "DECIMAL fetchAll returns bigint value",
      async fn() {
        await withConn((conn) => {
          // DECIMAL(5,2) stores 123.45 as internal value 12345
          exec(conn, "CREATE TABLE decimal_val_test(d DECIMAL(5,2))");
          exec(conn, "INSERT INTO decimal_val_test VALUES (123.45)");

          const handle = duckdb.query(
            conn,
            "SELECT d FROM decimal_val_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll - DECIMAL is returned as bigint (internal representation)
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // DECIMAL should be returned as bigint (internal integer representation)
          assertEquals(typeof fetchAllVal, "bigint");
          // Internal value is 12345 for DECIMAL(5,2) with value 123.45
          assertEquals(fetchAllVal, 12345n);

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "DECIMAL getValueByType matches fetchAll",
      async fn() {
        await withConn((conn) => {
          // DECIMAL(9,2) - enough for 1234567.89
          exec(
            conn,
            "CREATE TABLE decimal_consistency_test(d DECIMAL(9,2))",
          );
          exec(
            conn,
            "INSERT INTO decimal_consistency_test VALUES (1234567.89)",
          );

          const handle = duckdb.query(
            conn,
            "SELECT d FROM decimal_consistency_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);

          // They should match - internal representation is 123456789
          assertEquals(getVal, fetchAllVal);
          assertEquals(fetchAllVal, 123456789n);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: unsigned integer value retrieval",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "UTINYINT value retrieval",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE utinyint_test(v UTINYINT)");
          exec(conn, "INSERT INTO utinyint_test VALUES (200)");

          const handle = duckdb.query(
            conn,
            "SELECT v FROM utinyint_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // UTINYINT should be returned as number (uint8)
          assertEquals(typeof fetchAllVal, "number");
          assertEquals(fetchAllVal, 200);

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "USMALLINT value retrieval",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE usmallint_test(v USMALLINT)");
          exec(conn, "INSERT INTO usmallint_test VALUES (40000)");

          const handle = duckdb.query(
            conn,
            "SELECT v FROM usmallint_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // USMALLINT should be returned as number (uint16)
          assertEquals(typeof fetchAllVal, "number");
          assertEquals(fetchAllVal, 40000);

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "UINTEGER value retrieval",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE uinteger_test(v UINTEGER)");
          exec(conn, "INSERT INTO uinteger_test VALUES (3000000000)");

          const handle = duckdb.query(
            conn,
            "SELECT v FROM uinteger_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // UINTEGER should be returned as number (uint32)
          assertEquals(typeof fetchAllVal, "number");
          assertEquals(fetchAllVal, 3000000000);

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "UBIGINT value retrieval",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE ubigint_test(v UBIGINT)");
          exec(
            conn,
            "INSERT INTO ubigint_test VALUES (18446744073709551615)",
          );

          const handle = duckdb.query(
            conn,
            "SELECT v FROM ubigint_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // UBIGINT should be returned as bigint
          assertEquals(typeof fetchAllVal, "bigint");
          assertEquals(fetchAllVal, 18446744073709551615n);

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "Unsigned types consistency across APIs",
      async fn() {
        await withConn((conn) => {
          exec(
            conn,
            "CREATE TABLE unsigned_consistency_test(u UINTEGER)",
          );
          exec(
            conn,
            "INSERT INTO unsigned_consistency_test VALUES (1234567890)",
          );

          const handle = duckdb.query(
            conn,
            "SELECT u FROM unsigned_consistency_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);

          // All should return the same value
          assertEquals(getVal, fetchAllVal);
          assertEquals(fetchAllVal, 1234567890);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: INTERVAL type detection and value retrieval",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "INTERVAL column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(
            conn,
            "SELECT INTERVAL '1 year 2 months 3 days'",
          );
          const typeEnum = duckdb.columnType(handle, 0);
          // INTERVAL should be type 15 (DUCKDB_TYPE_INTERVAL)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_INTERVAL);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "INTERVAL value retrieval returns object",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE interval_test(i INTERVAL)");
          exec(
            conn,
            "INSERT INTO interval_test VALUES ('1 year 2 months 3 days')",
          );

          const handle = duckdb.query(conn, "SELECT i FROM interval_test");
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // INTERVAL should be returned as object with months, days, micros
          assertEquals(typeof fetchAllVal, "object");
          const interval = fetchAllVal as {
            months: number;
            days: number;
            micros: bigint;
          };
          assertEquals(interval.months, 14); // 1 year + 2 months = 14 months
          assertEquals(interval.days, 3);
          assertEquals(interval.micros, 0n);

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "INTERVAL NULL handling via getValueByType",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE interval_null_test(i INTERVAL)");
          exec(conn, "INSERT INTO interval_null_test VALUES (NULL)");

          const handle = duckdb.query(
            conn,
            "SELECT i FROM interval_null_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);
          const val = duckdb.getValueByType(handle, 0, 0, typeEnum);

          // NULL should be returned as null
          assertEquals(val, null);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: UHUGEINT type detection and value retrieval",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "UHUGEINT column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT 1::UHUGEINT");
          const typeEnum = duckdb.columnType(handle, 0);
          // UHUGEINT should be type 17 (DUCKDB_TYPE_UHUGEINT)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_UHUGEINT);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "UHUGEINT value retrieval",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE uhugeint_test(v UHUGEINT)");
          exec(
            conn,
            "INSERT INTO uhugeint_test VALUES (340282366920938463463374607431768211455)",
          ); // 2^128 - 1

          const handle = duckdb.query(conn, "SELECT v FROM uhugeint_test");
          const typeEnum = duckdb.columnType(handle, 0);

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // UHUGEINT should be returned as bigint
          assertEquals(typeof fetchAllVal, "bigint");
          assertEquals(fetchAllVal, 340282366920938463463374607431768211455n);

          // Test getValueByType
          const getVal = duckdb.getValueByType(handle, 0, 0, typeEnum);
          assertEquals(getVal, fetchAllVal);

          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "UHUGEINT NULL handling via getValueByType",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE uhugeint_null_test(v UHUGEINT)");
          exec(conn, "INSERT INTO uhugeint_null_test VALUES (NULL)");

          const handle = duckdb.query(
            conn,
            "SELECT v FROM uhugeint_null_test",
          );
          const typeEnum = duckdb.columnType(handle, 0);
          const val = duckdb.getValueByType(handle, 0, 0, typeEnum);

          // NULL should be returned as null
          assertEquals(val, null);

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: UUID type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "UUID column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(
            conn,
            "SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID",
          );
          const typeEnum = duckdb.columnType(handle, 0);
          // UUID should be type 27 (DUCKDB_TYPE_UUID)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_UUID);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: timestamp variant type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "TIMESTAMP_S column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(
            conn,
            "SELECT '2024-01-15 14:30:00'::TIMESTAMP_S",
          );
          const typeEnum = duckdb.columnType(handle, 0);
          // TIMESTAMP_S should be type 20 (DUCKDB_TYPE_TIMESTAMP_S)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP_S);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "TIMESTAMP_MS column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(
            conn,
            "SELECT '2024-01-15 14:30:00'::TIMESTAMP_MS",
          );
          const typeEnum = duckdb.columnType(handle, 0);
          // TIMESTAMP_MS should be type 21 (DUCKDB_TYPE_TIMESTAMP_MS)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP_MS);
          duckdb.destroyResult(handle);
        });
      },
    });

    await t.step({
      name: "TIMESTAMP_NS column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(
            conn,
            "SELECT '2024-01-15 14:30:00'::TIMESTAMP_NS",
          );
          const typeEnum = duckdb.columnType(handle, 0);
          // TIMESTAMP_NS should be type 22 (DUCKDB_TYPE_TIMESTAMP_NS)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_TIMESTAMP_NS);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: LIST type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "LIST column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT [1, 2, 3]::INTEGER[]");
          const typeEnum = duckdb.columnType(handle, 0);
          // LIST should be type 24 (DUCKDB_TYPE_LIST)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_LIST);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: STRUCT type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "STRUCT column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT {'a': 1, 'b': 2}");
          const typeEnum = duckdb.columnType(handle, 0);
          // STRUCT should be type 25 (DUCKDB_TYPE_STRUCT)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_STRUCT);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: MAP type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "MAP value retrieval returns string (fallback)",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TABLE map_test(v MAP(VARCHAR, INTEGER))");
          exec(conn, "INSERT INTO map_test VALUES ({'a': 1, 'b': 2})");

          const handle = duckdb.query(conn, "SELECT v FROM map_test");

          // Test fetchAll
          const rows = duckdb.fetchAll(handle);
          const fetchAllVal = rows[0][0];

          // MAP should fall back to string representation
          assertEquals(typeof fetchAllVal, "string");

          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: BIT type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "BIT column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          const handle = duckdb.query(conn, "SELECT '101'::BIT");
          const typeEnum = duckdb.columnType(handle, 0);
          // BIT should be type 29 (DUCKDB_TYPE_BIT)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_BIT);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});

Deno.test({
  name: "types: ENUM type detection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step({
      name: "ENUM column type is correctly identified",
      async fn() {
        await withConn((conn) => {
          exec(conn, "CREATE TYPE mood AS ENUM ('sad', 'ok', 'happy')");
          const handle = duckdb.query(conn, "SELECT 'happy'::mood");
          const typeEnum = duckdb.columnType(handle, 0);
          // ENUM should be type 23 (DUCKDB_TYPE_ENUM)
          assertEquals(typeEnum, DUCKDB_TYPE.DUCKDB_TYPE_ENUM);
          duckdb.destroyResult(handle);
        });
      },
    });
  },
});
