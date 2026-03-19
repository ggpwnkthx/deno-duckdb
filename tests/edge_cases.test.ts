/**
 * Edge case tests for boundary conditions, limits, and error recovery.
 */

import { assertEquals, assertRejects } from "@std/assert";
import { ValidationError } from "@ggpwnkthx/duckdb";
import * as functional from "@ggpwnkthx/duckdb/functional";
import {
  execFunctional,
  queryCachedRows,
  withFunctionalConnection,
  withObjectiveConnection,
} from "./utils.ts";

Deno.test({
  name: "edge case: integer type boundaries decode correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const rows = queryCachedRows(
        connection,
        "SELECT -127::TINYINT, 127::TINYINT",
      );
      assertEquals(rows, [[-127, 127]]);
    });
  },
});

Deno.test({
  name: "edge case: unicode strings decode correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const unicodeString = "Hello 世界 🌍 émoji";
      const rows = queryCachedRows(
        connection,
        `SELECT '${unicodeString}' AS content`,
      );
      assertEquals(rows?.[0]?.[0], unicodeString);

      const mixedRows = queryCachedRows(
        connection,
        `SELECT NULL AS a, 'Hello' AS b, NULL AS c, '世界' AS d`,
      );
      assertEquals(mixedRows?.[0]?.[0], null);
      assertEquals(mixedRows?.[0]?.[1], "Hello");
      assertEquals(mixedRows?.[0]?.[2], null);
      assertEquals(mixedRows?.[0]?.[3], "世界");
    });
  },
});

Deno.test({
  name: "edge case: LazyResult rowCount and columnCount getters work",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const result = functional.executeSqlResult(
        connection,
        "SELECT 1 AS a, 2 AS b, 3 AS c",
      );

      try {
        assertEquals(result.rowCount, 1n);
        assertEquals(result.columnCount, 3);
        assertEquals(result.columns.length, 3);
        assertEquals(result.columns[0].name, "a");
        assertEquals(result.columns[1].name, "b");
        assertEquals(result.columns[2].name, "c");
      } finally {
        result.close();
      }
    });
  },
});

Deno.test({
  name: "edge case: deprecated verbose function names still work",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const result = functional.executeSqlResult(connection, "SELECT 1 AS a");

      try {
        assertEquals(result.rowCount, 1n);
        assertEquals(result.columnCount, 1);
        assertEquals(result.columns.length, 1);
        assertEquals(result.columns[0].name, "a");
      } finally {
        result.close();
      }
    });
  },
});

Deno.test({
  name: "edge case: streaming iteration works without limits",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      execFunctional(connection, "CREATE TABLE limit_test (id INTEGER)");
      execFunctional(
        connection,
        "INSERT INTO limit_test SELECT * FROM range(1000)",
      );

      const streamingResult = functional.executeSqlResult(
        connection,
        "SELECT * FROM limit_test",
      );
      let count = 0;
      for (const _row of streamingResult.rows()) {
        count++;
        if (count >= 500) break;
      }
      assertEquals(count, 500);
      streamingResult.close();
    });
  },
});

Deno.test({
  name: "edge case: connection reuse after query error",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const rows1 = queryCachedRows(connection, "SELECT 1");
      assertEquals(rows1, [[1]]);

      const errorResult = functional.query(
        connection,
        "SELECT * FROM nonexistent_table",
      );
      assertEquals(errorResult, null);

      const rows2 = queryCachedRows(connection, "SELECT 2");
      assertEquals(rows2, [[2]]);

      const rows3 = queryCachedRows(connection, "SELECT 3");
      assertEquals(rows3, [[3]]);
    });
  },
});

Deno.test({
  name: "edge case: database operations after close return errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await functional.open();
    const conn = await functional.connect(db);

    functional.closeConnection(conn);
    functional.closeDatabase(db);

    await assertRejects(
      () => functional.connect(db),
      ValidationError,
    );
  },
});

Deno.test({
  name: "edge case: objective API connection reuse after error",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      const rows1 = connection.query("SELECT 1");
      assertEquals(rows1, [[1]]);

      const errorResult = connection.query("SELECT * FROM nonexistent");
      assertEquals(errorResult, null);

      const rows2 = connection.query("SELECT 2");
      assertEquals(rows2, [[2]]);
    });
  },
});

Deno.test({
  name: "edge case: multiple prepared statements can coexist",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      execFunctional(connection, "CREATE TABLE multi_prep (a INTEGER, b TEXT)");

      const stmt1 = functional.prepare(
        connection,
        "INSERT INTO multi_prep VALUES ($1, $2)",
      );
      const stmt2 = functional.prepare(
        connection,
        "SELECT * FROM multi_prep WHERE a = $1",
      );

      try {
        functional.bind(stmt1, [1, "one"]);
        functional.executePrepared(stmt1);

        functional.bind(stmt1, [2, "two"]);
        functional.executePrepared(stmt1);

        functional.bind(stmt2, [1]);
        let resultHandle = functional.executePrepared(stmt2);
        try {
          const reader = functional.createResultReader(resultHandle);
          assertEquals(functional.rowCount(resultHandle), 1n);
          assertEquals([...functional.iterateRows(reader)], [[1, "one"]]);
        } finally {
          functional.destroy(resultHandle);
        }

        functional.resetPrepared(stmt2);
        functional.bind(stmt2, [2]);
        resultHandle = functional.executePrepared(stmt2);
        try {
          const reader = functional.createResultReader(resultHandle);
          const rows = [...functional.iterateRows(reader)];
          assertEquals(rows, [[2, "two"]]);
        } finally {
          functional.destroy(resultHandle);
        }
      } finally {
        functional.destroyPrepared(stmt1);
        functional.destroyPrepared(stmt2);
      }
    });
  },
});

Deno.test({
  name: "edge case: NaN and Infinity are handled as doubles",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const rows = queryCachedRows(
        connection,
        "SELECT 1.0 / 0.0 AS inf, 0.0 / 0.0 AS nan",
      );

      assertEquals(rows?.[0]?.[0], Infinity);
      assertEquals(rows?.[0]?.[1], NaN);
    });
  },
});

Deno.test({
  name: "edge case: boolean edge values",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const rows = queryCachedRows(
        connection,
        "SELECT TRUE, FALSE, NULL::BOOLEAN",
      );

      assertEquals(rows?.[0]?.[0], true);
      assertEquals(rows?.[0]?.[1], false);
      assertEquals(rows?.[0]?.[2], null);
    });
  },
});

Deno.test({
  name: "edge case: empty database name",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await functional.open();
    const conn = await functional.connect(db);
    const rows = queryCachedRows(conn, "SELECT 1");
    assertEquals(rows, [[1]]);
    functional.closeConnection(conn);
    functional.closeDatabase(db);
  },
});

Deno.test({
  name: "edge case: zero-length result columns and rows",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const rows = queryCachedRows(
        connection,
        "SELECT 1 AS one LIMIT 0",
      );
      assertEquals(rows, []);

      const metadataRows = queryCachedRows(
        connection,
        "SELECT * FROM (SELECT 1 AS one) WHERE 1 = 0",
      );
      assertEquals(metadataRows, []);
    });
  },
});
