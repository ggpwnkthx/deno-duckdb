import { assertEquals, assertThrows } from "@std/assert";
import type {
  ConnectionHandle,
  DatabaseHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "@ggpwnkthx/duckdb";
import {
  DatabaseError,
  DuckDBError,
  InvalidResourceError,
  ValidationError,
} from "@ggpwnkthx/duckdb";
import * as functional from "@ggpwnkthx/duckdb/functional";
import { withFunctionalConnection } from "./utils.ts";

function invalidBuffer(size: number): Uint8Array {
  return new Uint8Array(new ArrayBuffer(size));
}

Deno.test({
  name: "functional: invalid SQL returns null (cached query returns null on failure)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const sql = "SELECT * FROM missing_table_for_test";

      // Cached query returns null on failure instead of throwing
      const result = functional.query(connection, sql);
      assertEquals(result, null);
    });
  },
});

Deno.test({
  name: "functional: empty SQL is rejected before FFI execution",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const error = assertThrows(
        () => functional.query(connection, "   "),
        ValidationError,
        "SQL query cannot be empty",
      );

      assertEquals(error.code, "VALIDATION_ERROR");
    });
  },
});

Deno.test({
  name:
    "functional: prepare failures surface DatabaseError and binding rejects unsupported types",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const prepareError = assertThrows(
        () => functional.prepare(connection, "SELECT * FROM nope_again"),
        DatabaseError,
      );
      assertEquals(prepareError.message.includes("nope_again"), true);

      const statement = functional.prepare(connection, "SELECT ?");
      try {
        const bindError = assertThrows(
          () => functional.bind(statement, [{}] as never[]),
          ValidationError,
          "Unsupported parameter type",
        );

        assertEquals(bindError.context?.type, "object");
      } finally {
        functional.destroyPrepared(statement);
      }
    });
  },
});

Deno.test("functional: representative handle validation uses typed ValidationError", () => {
  assertThrows(
    () => functional.closeDatabase(null as unknown as DatabaseHandle),
    ValidationError,
    "DatabaseHandle must be a Uint8Array",
  );
  assertThrows(
    () => functional.closeConnection(invalidBuffer(7) as ConnectionHandle),
    ValidationError,
    "ConnectionHandle must be 8 bytes",
  );
  assertThrows(
    () =>
      functional.executePrepared(
        invalidBuffer(48) as PreparedStatementHandle,
      ),
    ValidationError,
    "PreparedStatementHandle must be 8 bytes",
  );
  assertThrows(
    () => functional.rowCount(invalidBuffer(8) as ResultHandle),
    ValidationError,
    "ResultHandle must be 48 bytes",
  );
});

Deno.test({
  name: "DuckDBError: non-Error cause is stored directly on error object",
  fn() {
    const error = new DuckDBError({
      code: "DATABASE_ERROR",
      message: "test error",
      cause: "plain string cause",
    });

    assertEquals(error.cause, "plain string cause");
    assertEquals(error.code, "DATABASE_ERROR");
  },
});

Deno.test({
  name: "DuckDBError: object cause is stored directly on error object",
  fn() {
    const cause = { code: "ERR_SOME_THING", detail: "some details" };
    const error = new DuckDBError({
      code: "DATABASE_ERROR",
      message: "test error",
      cause,
    });

    assertEquals(error.cause, cause);
    assertEquals((error.cause as typeof cause).code, "ERR_SOME_THING");
  },
});

Deno.test({
  name: "DuckDBError: Error cause is wrapped in standard cause property",
  fn() {
    const cause = new Error("inner error");
    const error = new DuckDBError({
      code: "DATABASE_ERROR",
      message: "test error",
      cause,
    });

    assertEquals(error.cause instanceof Error, true);
    assertEquals((error.cause as Error).message, "inner error");
  },
});

Deno.test({
  name: "DuckDBError: undefined cause does not set cause property",
  fn() {
    const error = new DuckDBError({
      code: "DATABASE_ERROR",
      message: "test error",
    });

    assertEquals(error.cause, undefined);
    assertEquals(error.code, "DATABASE_ERROR");
  },
});

Deno.test({
  name: "DatabaseError: propagates non-Error cause to error object",
  fn() {
    const cause = "string cause";
    const error = new DatabaseError("db failed", undefined, cause);

    assertEquals(error.cause, cause);
    assertEquals(error.code, "DATABASE_ERROR");
  },
});

Deno.test({
  name: "InvalidResourceError: can be instantiated directly",
  fn() {
    const error = new InvalidResourceError("resource is closed", {
      resourceType: "Connection",
    });

    assertEquals(error.code, "INVALID_RESOURCE");
    assertEquals(error.message, "resource is closed");
    assertEquals(error.context?.resourceType, "Connection");
  },
});

Deno.test({
  name: "ValidationError: can be instantiated directly",
  fn() {
    const error = new ValidationError("invalid value", {
      value: 42,
      field: "age",
    });

    assertEquals(error.code, "VALIDATION_ERROR");
    assertEquals(error.message, "invalid value");
    assertEquals(error.context?.field, "age");
  },
});
