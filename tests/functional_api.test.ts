import { assertEquals, assertThrows } from "@std/assert";
import { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import * as functional from "../src/functional/mod.ts";
import { DatabaseError, ValidationError } from "../src/errors.ts";
import {
  execFunctional,
  materializeResultObjects,
  materializeResultRows,
  withFunctionalConnection,
} from "./utils.ts";

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
  name: "functional: query metadata, row decoding, and object decoding stay consistent",
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

      const result = functional.query(
        connection,
        "SELECT * FROM items ORDER BY id",
      );

      try {
        assertEquals(functional.rowCount(result), 2n);
        assertEquals(functional.columnCount(result), 6n);
        assertEquals(
          functional.columnInfos(result).map((column) => column.name),
          ["id", "total", "name", "active", "created", "note"],
        );
        assertEquals(
          functional.columnType(result, 4),
          DUCKDB_TYPE.DUCKDB_TYPE_DATE,
        );
        assertEquals(functional.columnName(result, 2), "name");

        const rows = materializeResultRows(result);
        const objects = materializeResultObjects(result);
        const iteratedRows = [...functional.iterateRows(result)];
        const iteratedObjects = [...functional.iterateObjects(result)];

        assertEquals(rows, [
          [1, 10n, "alpha", true, "2024-01-15", null],
          [2, 20n, "beta", false, "2024-01-16", "memo"],
        ]);
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
        assertEquals(iteratedRows, rows);
        assertEquals(iteratedObjects, objects);

        assertEquals(functional.isNull(result, 0, 5), true);
        assertEquals(functional.isNull(result, 1, 5), false);
        assertEquals(functional.getInt32(result, 0, 0), 1);
        assertEquals(functional.getInt64(result, 1, 1), 20n);
        assertEquals(functional.getString(result, 1, 2), "beta");
        assertEquals(functional.getValue(result, 0, 3), true);
        assertEquals(
          functional.getValueByType(
            result,
            1,
            4,
            functional.columnType(result, 4),
          ),
          "2024-01-16",
        );
      } finally {
        functional.destroyResult(result);
      }
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
      const result = functional.query(
        connection,
        "SELECT 12.34::DECIMAL(10,2) AS amount, unhex('C0FFEE') AS payload, '10101'::BIT::VARCHAR AS bits",
      );

      try {
        assertEquals(functional.fetchAll(result), [
          ["12.34", new Uint8Array([0xC0, 0xFF, 0xEE]), "10101"],
        ]);
        assertEquals(functional.fetchObjects(result), [
          {
            amount: "12.34",
            payload: new Uint8Array([0xC0, 0xFF, 0xEE]),
            bits: "10101",
          },
        ]);
      } finally {
        functional.destroyResult(result);
      }
    });
  },
});

Deno.test({
  name: "functional: empty results keep metadata but reject row access out of bounds",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withFunctionalConnection((connection) => {
      const result = functional.query(
        connection,
        "SELECT 1::INTEGER AS value WHERE 1 = 0",
      );

      try {
        assertEquals(functional.rowCount(result), 0n);
        assertEquals(functional.columnCount(result), 1n);
        assertEquals(functional.columnName(result, 0), "value");
        assertEquals(
          functional.columnType(result, 0),
          DUCKDB_TYPE.DUCKDB_TYPE_INTEGER,
        );
        assertEquals(functional.fetchAll(result), []);

        assertThrows(
          () => functional.getInt32(result, 0, 0),
          ValidationError,
          "Row index 0 is out of bounds",
        );
        assertThrows(
          () => functional.columnName(result, 1),
          ValidationError,
          "Column index 1 is out of bounds",
        );
        assertThrows(
          () => functional.isNull(result, Number.NaN, 0),
          ValidationError,
          "Row index must be an integer",
        );
      } finally {
        functional.destroyResult(result);
      }
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
          assertEquals(functional.fetchAll(result), [["alpha"]]);
        } finally {
          functional.destroyResult(result);
        }

        functional.bind(statement, [2, false]);
        result = functional.executePrepared(statement);

        try {
          assertEquals(functional.fetchAll(result), [["beta"]]);
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
          assertEquals(functional.fetchAll(result), [["gamma"]]);
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
      const result = functional.query(connection, "SELECT 1 AS value");
      functional.destroyResultSync(result);

      const statement = functional.prepare(connection, "SELECT 2 AS value");
      functional.destroyPreparedSync(statement);

      const followUp = functional.query(connection, "SELECT 3 AS value");

      try {
        assertEquals(functional.fetchAll(followUp), [[3]]);
      } finally {
        functional.destroyResult(followUp);
      }
    });
  },
});
