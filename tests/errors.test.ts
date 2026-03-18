import { assertEquals, assertThrows } from "@std/assert";
import type {
  ConnectionHandle,
  DatabaseHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "@ggpwnkthx/duckdb";
import { DatabaseError, ValidationError } from "@ggpwnkthx/duckdb";
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
