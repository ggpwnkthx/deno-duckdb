/**
 * Edge case tests for boundary conditions, limits, and error recovery.
 * Only tests that are truly edge-case specific and not covered in api.test.ts.
 */

import { assertEquals, assertRejects } from "@std/assert";
import { ValidationError } from "@ggpwnkthx/duckdb";
import * as functional from "@ggpwnkthx/duckdb/functional";
import {
  execFunctional,
  queryCachedRows,
  test,
  withFunctionalConnection,
  withObjectiveConnection,
} from "./utils.ts";

test("NaN and Infinity are handled as doubles", () =>
  withFunctionalConnection((connection) => {
    const rows = queryCachedRows(
      connection,
      "SELECT 1.0 / 0.0 AS inf, 0.0 / 0.0 AS nan",
    );

    assertEquals(rows?.[0]?.[0], Infinity);
    assertEquals(rows?.[0]?.[1], NaN);
  }));

test("zero-length result columns and rows", () =>
  withFunctionalConnection((connection) => {
    const rows = queryCachedRows(connection, "SELECT 1 AS one LIMIT 0");
    assertEquals(rows, []);

    const metadataRows = queryCachedRows(
      connection,
      "SELECT * FROM (SELECT 1 AS one) WHERE 1 = 0",
    );
    assertEquals(metadataRows, []);
  }));

test("UUID type decodes as string", () =>
  withFunctionalConnection((connection) => {
    const rows = queryCachedRows(
      connection,
      "SELECT '550e8400-e29b-41d4-a716-446655440000'::UUID::VARCHAR AS id",
    );
    assertEquals(rows?.[0]?.[0], "550e8400-e29b-41d4-a716-446655440000");
  }));

test("BIT type decodes as string", () =>
  withFunctionalConnection((connection) => {
    const rows = queryCachedRows(
      connection,
      "SELECT '01010101'::BIT::VARCHAR AS bits",
    );
    assertEquals(rows?.[0]?.[0], "01010101");
  }));

test("streaming iteration allows early termination", () =>
  withFunctionalConnection((connection) => {
    execFunctional(connection, "CREATE TABLE limit_test (id INTEGER)");
    execFunctional(connection, "INSERT INTO limit_test SELECT * FROM range(1000)");

    const result = functional.executeSqlResult(connection, "SELECT * FROM limit_test");
    let count = 0;
    for (const _row of result.rows()) {
      count++;
      if (count >= 500) break;
    }
    assertEquals(count, 500);
    result.close();
  }));

test("connection reuses after query error", () =>
  withFunctionalConnection((connection) => {
    const rows1 = queryCachedRows(connection, "SELECT 1");
    assertEquals(rows1, [[1]]);

    const errorResult = functional.query(connection, "SELECT * FROM nonexistent_table");
    assertEquals(errorResult, null);

    const rows2 = queryCachedRows(connection, "SELECT 2");
    assertEquals(rows2, [[2]]);

    const rows3 = queryCachedRows(connection, "SELECT 3");
    assertEquals(rows3, [[3]]);
  }));

test("database operations after close return errors", async () => {
  const db = await functional.open();
  const conn = await functional.connect(db);

  functional.closeConnection(conn);
  functional.closeDatabase(db);

  await assertRejects(() => functional.connect(db), ValidationError);
});

test("objective connection reuses after error", () =>
  withObjectiveConnection((_database, connection) => {
    const rows1 = connection.query("SELECT 1");
    assertEquals(rows1, [[1]]);

    const errorResult = connection.query("SELECT * FROM nonexistent");
    assertEquals(errorResult, null);

    const rows2 = connection.query("SELECT 2");
    assertEquals(rows2, [[2]]);
  }));
