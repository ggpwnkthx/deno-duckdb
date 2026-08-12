import { assertEquals, assertThrows } from "@std/assert";
import { QueryError } from "@ggpwnkthx/duckdb";
import * as functional from "@ggpwnkthx/duckdb/functional";
import { test, withFunctionalConnection, withObjectiveConnection } from "../utils.ts";

function currentSetting(
  connection: Parameters<typeof functional.query>[0],
  name: string,
): string {
  const rows = functional.query(
    connection,
    `SELECT current_setting('${name}') AS v`,
  );
  if (!rows || rows.length !== 1 || rows[0].length !== 1) {
    throw new Error(`current_setting('${name}') did not return a scalar`);
  }
  return rows[0][0] as string;
}

test("functional: applySessionConfig sets a single local option", () =>
  withFunctionalConnection((conn) => {
    functional.applySessionConfig(conn, { home_directory: "/tmp/duckdb-test" });
    const actual = currentSetting(conn, "home_directory");
    assertEquals(actual, "/tmp/duckdb-test");
  }));

test("functional: applySessionConfig joins string arrays with commas", () =>
  withFunctionalConnection((conn) => {
    functional.applySessionConfig(conn, { search_path: ["main"] });
    const actual = currentSetting(conn, "search_path");
    assertEquals(actual, "main");
  }));

test("functional: applySessionConfig throws ValidationError on unknown key", () =>
  withFunctionalConnection((conn) => {
    assertThrows(
      () => {
        functional.applySessionConfig(
          conn,
          { unknown_session_option: "value" } as never,
        );
      },
      Error,
      "Unknown config key",
    );
  }));

test("functional: applySessionConfig throws ValidationError on invalid value", () =>
  withFunctionalConnection((conn) => {
    assertThrows(
      () => {
        functional.applySessionConfig(
          conn,
          { search_path: 123 } as never,
        );
      },
      Error,
      "Invalid session config",
    );
  }));

test("functional: applySessionConfig escapes single quotes in values", () =>
  withFunctionalConnection((conn) => {
    functional.applySessionConfig(conn, { home_directory: "o'reilly" });
    const actual = currentSetting(conn, "home_directory");
    assertEquals(actual, "o'reilly");
  }));

test("functional: applySessionConfig throws QueryError when SET fails", () =>
  withFunctionalConnection((conn) => {
    let caught: unknown = null;
    try {
      functional.applySessionConfig(conn, { schema: "non_existent_schema" });
    } catch (e) {
      caught = e;
    }
    if (!(caught instanceof QueryError)) {
      throw new Error(
        `Expected QueryError, got ${caught?.constructor?.name ?? typeof caught}`,
      );
    }
    assertEquals(caught.code, "QUERY_ERROR");
  }));

test("objective: Connection.setConfig applies a local option", () =>
  withObjectiveConnection((_db, conn) => {
    conn.setConfig({ home_directory: "/tmp/duckdb-test" });
    const result = conn.execute(
      "SELECT current_setting('home_directory') AS v",
    );
    try {
      const rows = [...result.objects()];
      assertEquals(rows[0].v, "/tmp/duckdb-test");
    } finally {
      result.close();
    }
  }));

test("objective: Connection.setConfig throws QueryError on failure", () =>
  withObjectiveConnection((_db, conn) => {
    let caught: unknown = null;
    try {
      conn.setConfig({ schema: "non_existent_schema" });
    } catch (e) {
      caught = e;
    }
    if (!(caught instanceof QueryError)) {
      throw new Error(
        `Expected QueryError, got ${caught?.constructor?.name ?? typeof caught}`,
      );
    }
    assertEquals(caught.code, "QUERY_ERROR");
  }));

test("parity: functional and objective APIs agree on setConfig", () =>
  withFunctionalConnection((conn) => {
    functional.applySessionConfig(conn, { schema: "main" });
    assertEquals(currentSetting(conn, "schema"), "main");
  }));

test("parity: objective Connection.setConfig produces matching setting", () =>
  withObjectiveConnection((_db, conn) => {
    conn.setConfig({ schema: "main" });
    const result = conn.execute("SELECT current_setting('schema') AS v");
    try {
      const rows = [...result.objects()];
      assertEquals(rows[0].v, "main");
    } finally {
      result.close();
    }
  }));
