/**
 * Functional invalid handle input tests
 *
 * Tests that validation functions fail fast when given invalid inputs
 * like non-Uint8Array types or wrong-length buffers.
 */

import { assertThrows } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import type {
  ConnectionHandle,
  DatabaseHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "@ggpwnkthx/duckdb";

// Helper to create handles of specific sizes
function createBuffer(size: number): Uint8Array {
  return new Uint8Array(new ArrayBuffer(size));
}

// Invalid type inputs (not Uint8Array)
const invalidTypes = [
  { value: null, desc: "null" },
  { value: undefined, desc: "undefined" },
  { value: 42, desc: "number" },
  { value: "string", desc: "string" },
  { value: {}, desc: "plain object" },
  { value: [], desc: "array" },
  { value: new ArrayBuffer(8), desc: "ArrayBuffer" },
  { value: new Int8Array(8), desc: "Int8Array" },
  { value: new Int32Array(8), desc: "Int32Array" },
] as const;

// Wrong-length Uint8Arrays (not 8 or 48 bytes - the valid handle sizes)
const wrongLengthBuffers = [
  { len: 0, desc: "empty buffer" },
  { len: 4, desc: "4-byte buffer (half pointer)" },
  { len: 16, desc: "16-byte buffer (double pointer)" },
] as const;

// Wrong-length buffers for ResultHandle (not 48 bytes)
const wrongLengthResultBuffers = [
  { len: 0, desc: "empty buffer" },
  { len: 4, desc: "4-byte buffer" },
  { len: 8, desc: "8-byte buffer (pointer size)" },
  { len: 16, desc: "16-byte buffer" },
] as const;

Deno.test({
  name: "handles: DatabaseHandle validation (8 bytes)",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Test non-Uint8Array types
    await t.step({
      name: "closeDatabase rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () => duckdb.closeDatabase(value as unknown as DatabaseHandle),
            Error,
            "DatabaseHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "isValidDatabase rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () => duckdb.isValidDatabase(value as unknown as DatabaseHandle),
            Error,
            "DatabaseHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "getPointerValue rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () => duckdb.getPointerValue(value as unknown as DatabaseHandle),
            Error,
            "DatabaseHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    // Test wrong-length buffers
    await t.step({
      name: "closeDatabase rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () => duckdb.closeDatabase(createBuffer(len) as DatabaseHandle),
            Error,
            "DatabaseHandle must be 8 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "isValidDatabase rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () => duckdb.isValidDatabase(createBuffer(len) as DatabaseHandle),
            Error,
            "DatabaseHandle must be 8 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "getPointerValue rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () => duckdb.getPointerValue(createBuffer(len) as DatabaseHandle),
            Error,
            "DatabaseHandle must be 8 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });
  },
});

Deno.test({
  name: "handles: ConnectionHandle validation (8 bytes)",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Test non-Uint8Array types
    await t.step({
      name: "closeConnection rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () => duckdb.closeConnection(value as unknown as ConnectionHandle),
            Error,
            "ConnectionHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "isValidConnection rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () =>
              duckdb.isValidConnection(value as unknown as ConnectionHandle),
            Error,
            "ConnectionHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "getPointerValueConnection rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () =>
              duckdb.getPointerValueConnection(
                value as unknown as ConnectionHandle,
              ),
            Error,
            "ConnectionHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    // Test wrong-length buffers
    await t.step({
      name: "closeConnection rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () => duckdb.closeConnection(createBuffer(len) as ConnectionHandle),
            Error,
            "ConnectionHandle must be 8 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "isValidConnection rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () =>
              duckdb.isValidConnection(createBuffer(len) as ConnectionHandle),
            Error,
            "ConnectionHandle must be 8 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "getPointerValueConnection rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () =>
              duckdb.getPointerValueConnection(
                createBuffer(len) as ConnectionHandle,
              ),
            Error,
            "ConnectionHandle must be 8 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });
  },
});

Deno.test({
  name: "handles: ConnectionHandle validation in execute (8 bytes)",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Test non-Uint8Array types
    await t.step({
      name: "execute rejects non-Uint8Array connection",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () =>
              duckdb.execute(value as unknown as ConnectionHandle, "SELECT 1"),
            Error,
            "ConnectionHandle must be a Uint8Array",
            `Should reject ${desc} as connection`,
          );
        }
      },
    });

    // Test wrong-length buffers
    await t.step({
      name: "execute rejects wrong-length connection buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () =>
              duckdb.execute(createBuffer(len) as ConnectionHandle, "SELECT 1"),
            Error,
            "ConnectionHandle must be 8 bytes",
            `Should reject ${desc} as connection`,
          );
        }
      },
    });
  },
});

Deno.test({
  name: "handles: ResultHandle validation (48 bytes)",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Test non-Uint8Array types
    await t.step({
      name: "rowCount rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () => duckdb.rowCount(value as unknown as ResultHandle),
            Error,
            "ResultHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "columnCount rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () => duckdb.columnCount(value as unknown as ResultHandle),
            Error,
            "ResultHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "columnName rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () => duckdb.columnName(value as unknown as ResultHandle, 0),
            Error,
            "ResultHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "destroyResult rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () => duckdb.destroyResult(value as unknown as ResultHandle),
            Error,
            "ResultHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    // Test wrong-length buffers (not 48 bytes)
    await t.step({
      name: "rowCount rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthResultBuffers) {
          assertThrows(
            () => duckdb.rowCount(createBuffer(len) as ResultHandle),
            Error,
            "ResultHandle must be 48 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "columnCount rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthResultBuffers) {
          assertThrows(
            () => duckdb.columnCount(createBuffer(len) as ResultHandle),
            Error,
            "ResultHandle must be 48 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "columnName rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthResultBuffers) {
          assertThrows(
            () => duckdb.columnName(createBuffer(len) as ResultHandle, 0),
            Error,
            "ResultHandle must be 48 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "destroyResult rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthResultBuffers) {
          assertThrows(
            () => duckdb.destroyResult(createBuffer(len) as ResultHandle),
            Error,
            "ResultHandle must be 48 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });
  },
});

Deno.test({
  name: "handles: PreparedStatementHandle validation (8 bytes)",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Test non-Uint8Array types
    await t.step({
      name: "executePrepared rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () =>
              duckdb.executePrepared(
                value as unknown as PreparedStatementHandle,
              ),
            Error,
            "PreparedStatementHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "preparedColumnCount rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () =>
              duckdb.preparedColumnCount(
                value as unknown as PreparedStatementHandle,
              ),
            Error,
            "PreparedStatementHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "destroyPrepared rejects non-Uint8Array types",
      fn() {
        for (const { value, desc } of invalidTypes) {
          assertThrows(
            () =>
              duckdb.destroyPrepared(
                value as unknown as PreparedStatementHandle,
              ),
            Error,
            "PreparedStatementHandle must be a Uint8Array",
            `Should reject ${desc}`,
          );
        }
      },
    });

    // Test wrong-length buffers
    await t.step({
      name: "executePrepared rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () =>
              duckdb.executePrepared(
                createBuffer(len) as PreparedStatementHandle,
              ),
            Error,
            "PreparedStatementHandle must be 8 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "preparedColumnCount rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () =>
              duckdb.preparedColumnCount(
                createBuffer(len) as PreparedStatementHandle,
              ),
            Error,
            "PreparedStatementHandle must be 8 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });

    await t.step({
      name: "destroyPrepared rejects wrong-length buffers",
      fn() {
        for (const { len, desc } of wrongLengthBuffers) {
          assertThrows(
            () =>
              duckdb.destroyPrepared(
                createBuffer(len) as PreparedStatementHandle,
              ),
            Error,
            "PreparedStatementHandle must be 8 bytes",
            `Should reject ${desc}`,
          );
        }
      },
    });
  },
});

Deno.test({
  name: "handles: cross-handle type validation",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Test that handles of wrong type are rejected
    // ConnectionHandle (8 bytes) passed to functions expecting ResultHandle (48 bytes)
    await t.step({
      name: "ResultHandle functions reject 8-byte ConnectionHandle",
      fn() {
        const connHandle = createBuffer(8); // 8-byte buffer

        assertThrows(
          () => duckdb.rowCount(connHandle as ResultHandle),
          Error,
          "ResultHandle must be 48 bytes",
        );
        assertThrows(
          () => duckdb.columnCount(connHandle as ResultHandle),
          Error,
          "ResultHandle must be 48 bytes",
        );
        assertThrows(
          () => duckdb.columnName(connHandle as ResultHandle, 0),
          Error,
          "ResultHandle must be 48 bytes",
        );
        assertThrows(
          () => duckdb.destroyResult(connHandle as ResultHandle),
          Error,
          "ResultHandle must be 48 bytes",
        );
      },
    });

    // ResultHandle (48 bytes) passed to functions expecting ConnectionHandle (8 bytes)
    await t.step({
      name: "ConnectionHandle functions reject 48-byte ResultHandle",
      fn() {
        const resultHandle = createBuffer(48); // 48-byte buffer

        assertThrows(
          () => duckdb.closeConnection(resultHandle as ConnectionHandle),
          Error,
          "ConnectionHandle must be 8 bytes",
        );
        assertThrows(
          () => duckdb.isValidConnection(resultHandle as ConnectionHandle),
          Error,
          "ConnectionHandle must be 8 bytes",
        );
        assertThrows(
          () =>
            duckdb.getPointerValueConnection(resultHandle as ConnectionHandle),
          Error,
          "ConnectionHandle must be 8 bytes",
        );
        assertThrows(
          () => duckdb.execute(resultHandle as ConnectionHandle, "SELECT 1"),
          Error,
          "ConnectionHandle must be 8 bytes",
        );
      },
    });

    // PreparedStatementHandle (8 bytes) passed to ResultHandle functions
    await t.step({
      name: "ResultHandle functions reject 8-byte PreparedStatementHandle",
      fn() {
        const prepHandle = createBuffer(8); // 8-byte buffer

        assertThrows(
          () => duckdb.rowCount(prepHandle as ResultHandle),
          Error,
          "ResultHandle must be 48 bytes",
        );
        assertThrows(
          () => duckdb.columnCount(prepHandle as ResultHandle),
          Error,
          "ResultHandle must be 48 bytes",
        );
      },
    });

    // ResultHandle (48 bytes) passed to PreparedStatementHandle functions
    await t.step({
      name: "PreparedStatementHandle functions reject 48-byte ResultHandle",
      fn() {
        const resultHandle = createBuffer(48); // 48-byte buffer

        assertThrows(
          () =>
            duckdb.executePrepared(
              resultHandle as PreparedStatementHandle,
            ),
          Error,
          "PreparedStatementHandle must be 8 bytes",
        );
        assertThrows(
          () =>
            duckdb.preparedColumnCount(
              resultHandle as PreparedStatementHandle,
            ),
          Error,
          "PreparedStatementHandle must be 8 bytes",
        );
        assertThrows(
          () => duckdb.destroyPrepared(resultHandle as PreparedStatementHandle),
          Error,
          "PreparedStatementHandle must be 8 bytes",
        );
      },
    });
  },
});

Deno.test({
  name: "handles: error messages identify failing handle type",
  sanitizeResources: true,
  sanitizeOps: true,
  async fn(t) {
    // Verify error messages include the correct handle type name
    await t.step({
      name: "DatabaseHandle error messages contain 'DatabaseHandle'",
      fn() {
        assertThrows(
          () => duckdb.closeDatabase(null as unknown as DatabaseHandle),
          Error,
          "DatabaseHandle",
        );
        assertThrows(
          () => duckdb.closeDatabase(createBuffer(4) as DatabaseHandle),
          Error,
          "DatabaseHandle",
        );
      },
    });

    await t.step({
      name: "ConnectionHandle error messages contain 'ConnectionHandle'",
      fn() {
        assertThrows(
          () => duckdb.closeConnection(null as unknown as ConnectionHandle),
          Error,
          "ConnectionHandle",
        );
        assertThrows(
          () => duckdb.closeConnection(createBuffer(4) as ConnectionHandle),
          Error,
          "ConnectionHandle",
        );
      },
    });

    await t.step({
      name: "ResultHandle error messages contain 'ResultHandle'",
      fn() {
        assertThrows(
          () => duckdb.rowCount(null as unknown as ResultHandle),
          Error,
          "ResultHandle",
        );
        assertThrows(
          () => duckdb.rowCount(createBuffer(8) as ResultHandle),
          Error,
          "ResultHandle",
        );
      },
    });

    await t.step({
      name:
        "PreparedStatementHandle error messages contain 'PreparedStatementHandle'",
      fn() {
        assertThrows(
          () =>
            duckdb.executePrepared(null as unknown as PreparedStatementHandle),
          Error,
          "PreparedStatementHandle",
        );
        assertThrows(
          () =>
            duckdb.executePrepared(createBuffer(48) as PreparedStatementHandle),
          Error,
          "PreparedStatementHandle",
        );
      },
    });
  },
});
