import { assertEquals, assertThrows } from "@std/assert";
import { DatabaseError, functional, ValidationError } from "@ggpwnkthx/duckdb";
import { execFunctional, withFunctionalConnection } from "./utils.ts";

Deno.test({
  name: "functional: database and connection lifecycle exposes valid handles",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const database = await functional.open({ threads: "2" });
    const connection = await functional.create(database);

    assertEquals(functional.isValidDatabase(database), true);
    assertEquals(functional.isValidConnection(connection), true);
    assertEquals(functional.getPointerValue(database) !== 0n, true);
    assertEquals(functional.getPointerValueConnection(connection) !== 0n, true);

    functional.closeConnection(connection);
    functional.closeDatabase(database);

    assertEquals(functional.isValidConnection(connection), false);
    assertEquals(functional.isValidDatabase(database), false);
  },
});

Deno.test({
  name: "functional: query returns cached rows directly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      execFunctional(
        connection,
        `CREATE TABLE items(
          id INTEGER,
          total BIGINT,
          name TEXT,
          active BOOLEAN,
          created DATE,
          note TEXT
        )`,
      );
      execFunctional(
        connection,
        `INSERT INTO items VALUES
          (1, 10, 'alpha', true,  '2024-01-15', NULL),
          (2, 20, 'beta',  false, '2024-01-16', 'memo')`,
      );

      // query returns iterator, use spread to convert to array
      const rows = [
        ...functional.query(
          connection,
          "SELECT * FROM items ORDER BY id",
        )!,
      ];

      assertEquals(rows, [
        [1, 10n, "alpha", true, "2024-01-15", null],
        [2, 20n, "beta", false, "2024-01-16", "memo"],
      ]);

      // Test queryObjects for object format
      const objects = [
        ...functional.queryObjects(
          connection,
          "SELECT * FROM items ORDER BY id",
        )!,
      ];

      assertEquals(objects, [
        {
          id: 1,
          total: 10n,
          name: "alpha",
          active: true,
          created: "2024-01-15",
          note: null,
        },
        {
          id: 2,
          total: 20n,
          name: "beta",
          active: false,
          created: "2024-01-16",
          note: "memo",
        },
      ]);
    });
  },
});

Deno.test({
  name:
    "functional: exact decimal strings and blob bytes decode correctly without SQL casts",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      // Note: BIT type requires CAST to VARCHAR for reliable FFI reading
      // due to DuckDB C API limitation (no direct column data for BIT)
      const rows = [
        ...functional.query(
          connection,
          "SELECT 12.34::DECIMAL(10,2) AS amount, unhex('C0FFEE') AS payload, '10101'::BIT::VARCHAR AS bits",
        )!,
      ];

      assertEquals(rows, [
        ["12.34", new Uint8Array([0xC0, 0xFF, 0xEE]), "10101"],
      ]);

      const objects = [
        ...functional.queryObjects(
          connection,
          "SELECT 12.34::DECIMAL(10,2) AS amount, unhex('C0FFEE') AS payload, '10101'::BIT::VARCHAR AS bits",
        )!,
      ];

      assertEquals(objects, [
        {
          amount: "12.34",
          payload: new Uint8Array([0xC0, 0xFF, 0xEE]),
          bits: "10101",
        },
      ]);
    });
  },
});

Deno.test({
  name: "functional: empty results return empty array",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const rows = [
        ...functional.query(
          connection,
          "SELECT 1::INTEGER AS value WHERE 1 = 0",
        )!,
      ];

      assertEquals(rows, []);
    });
  },
});

Deno.test({
  name: "functional: prepared statements can be rebound, reset, and reused",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      execFunctional(
        connection,
        `CREATE TABLE prepared_items(id INTEGER, name TEXT, active BOOLEAN)`,
      );
      execFunctional(
        connection,
        `INSERT INTO prepared_items VALUES
          (1, 'alpha', true),
          (2, 'beta', false),
          (3, 'gamma', true)`,
      );

      const statement = functional.prepare(
        connection,
        "SELECT name FROM prepared_items WHERE id = ? AND active = ?",
      );

      try {
        assertEquals(functional.preparedColumnCount(statement), 1n);

        functional.bind(statement, [1, true]);
        let result = functional.executePrepared(statement);

        try {
          const reader = functional.createResultReader(result);
          assertEquals([...functional.iterateRows(reader)], [["alpha"]]);
        } finally {
          functional.destroyResult(result);
        }

        functional.bind(statement, [2, false]);
        result = functional.executePrepared(statement);

        try {
          const reader = functional.createResultReader(result);
          assertEquals([...functional.iterateRows(reader)], [["beta"]]);
        } finally {
          functional.destroyResult(result);
        }

        functional.resetPreparedSync(statement);
        assertThrows(
          () => functional.executePrepared(statement),
          DatabaseError,
        );

        functional.bind(statement, [3, true]);
        result = functional.executePrepared(statement);

        try {
          const reader = functional.createResultReader(result);
          assertEquals([...functional.iterateRows(reader)], [["gamma"]]);
        } finally {
          functional.destroyResult(result);
        }
      } finally {
        functional.destroyPrepared(statement);
      }
    });
  },
});

Deno.test({
  name: "functional: integer binding rejects unsafe JS integers",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const statement = functional.prepare(connection, "SELECT ?");
      try {
        const error = assertThrows(
          () => functional.bind(statement, [Number.MAX_SAFE_INTEGER + 1]),
          ValidationError,
          "safe integer",
        );
        assertEquals(error.code, "VALIDATION_ERROR");
      } finally {
        functional.destroyPrepared(statement);
      }
    });
  },
});

Deno.test({
  name: "functional: sync destroy helpers do not poison the active connection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      // Test that cached queries work after sync destroy
      const rows1 = [...functional.query(connection, "SELECT 1 AS value")!];
      assertEquals(rows1, [[1]]);

      const statement = functional.prepare(connection, "SELECT 2 AS value");
      functional.destroyPreparedSync(statement);

      // Another cached query should work
      const rows2 = [...functional.query(connection, "SELECT 3 AS value")!];
      assertEquals(rows2, [[3]]);
    });
  },
});
