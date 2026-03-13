import { assertEquals, assertThrows } from "@std/assert";
import { Database } from "../src/objective/mod.ts";
import { DatabaseError, InvalidResourceError } from "../src/errors.ts";
import { withObjectiveConnection } from "./utils.ts";

Deno.test({
  name:
    "objective: Database.connect opens lazily and returns working connections",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const database = new Database();

    assertEquals(database.isClosed(), false);

    const connection = await database.connect();
    const result = connection.query("SELECT 1 AS value");

    try {
      assertEquals(result.fetchAll(), [[1]]);
    } finally {
      result.close();
      connection.close();
      database.close();
    }

    assertEquals(database.isClosed(), true);
  },
});

Deno.test({
  name:
    "objective: QueryResult exposes metadata, rows, objects, and defensive copies",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      for (
        const sql of [
          "CREATE TABLE items(id INTEGER, name TEXT, amount DOUBLE, payload BLOB)",
          "INSERT INTO items VALUES (1, 'alpha', 1.5, unhex('CAFE')), (2, 'beta', 2.5, unhex('BEEF'))",
        ]
      ) {
        const result = connection.query(sql);
        result.close();
      }

      const result = connection.query("SELECT * FROM items ORDER BY id");

      try {
        assertEquals(result.rowCount(), 2n);
        assertEquals(result.columnCount(), 4n);
        assertEquals(
          result.getColumnInfos().map((column) => column.name),
          ["id", "name", "amount", "payload"],
        );
        assertEquals(result.getRow(0), [1, "alpha", 1.5, new Uint8Array([0xCA, 0xFE])]);
        assertEquals([...result.rows()], [
          [1, "alpha", 1.5, new Uint8Array([0xCA, 0xFE])],
          [2, "beta", 2.5, new Uint8Array([0xBE, 0xEF])],
        ]);
        assertEquals([...result.objects()], [
          { id: 1, name: "alpha", amount: 1.5, payload: new Uint8Array([0xCA, 0xFE]) },
          { id: 2, name: "beta", amount: 2.5, payload: new Uint8Array([0xBE, 0xEF]) },
        ]);

        const rows1 = result.fetchAll();
        (rows1[0][3] as Uint8Array)[0] = 0;

        const rows2 = result.fetchAll();
        assertEquals(rows2, [
          [1, "alpha", 1.5, new Uint8Array([0xCA, 0xFE])],
          [2, "beta", 2.5, new Uint8Array([0xBE, 0xEF])],
        ]);

        const objects1 = result.toArrayOfObjects();
        (objects1[0].payload as Uint8Array)[0] = 0;

        const objects2 = result.toArrayOfObjects();
        assertEquals(objects2, [
          { id: 1, name: "alpha", amount: 1.5, payload: new Uint8Array([0xCA, 0xFE]) },
          { id: 2, name: "beta", amount: 2.5, payload: new Uint8Array([0xBE, 0xEF]) },
        ]);
      } finally {
        result.close();
      }
    });
  },
});

Deno.test({
  name:
    "objective: queryAll, queryObjects, and queryTyped share the same decoded values",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      for (
        const sql of [
          "CREATE TABLE typed_items(id INTEGER, name TEXT, active BOOLEAN)",
          "INSERT INTO typed_items VALUES (1, 'alpha', true), (2, 'beta', false)",
        ]
      ) {
        const result = connection.query(sql);
        result.close();
      }

      assertEquals(
        connection.queryAll("SELECT * FROM typed_items ORDER BY id"),
        [
          [1, "alpha", true],
          [2, "beta", false],
        ],
      );

      assertEquals(
        connection.queryObjects("SELECT * FROM typed_items ORDER BY id"),
        [
          { id: 1, name: "alpha", active: true },
          { id: 2, name: "beta", active: false },
        ],
      );

      assertEquals(
        connection.queryTyped("SELECT id, name FROM typed_items ORDER BY id"),
        [
          { id: 1, name: "alpha" },
          { id: 2, name: "beta" },
        ],
      );

      assertEquals(
        connection.queryTyped(
          "SELECT id, name FROM typed_items ORDER BY id",
          (row) => ({
            key: `${row.id}:${row.name}`,
          }),
        ),
        [{ key: "1:alpha" }, { key: "2:beta" }],
      );
    });
  },
});

Deno.test({
  name: "objective: prepared statements are fluent, resettable, and reusable",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      for (
        const sql of [
          "CREATE TABLE prepared_items(id INTEGER, name TEXT)",
          "INSERT INTO prepared_items VALUES (1, 'alpha'), (2, 'beta')",
        ]
      ) {
        const result = connection.query(sql);
        result.close();
      }

      const statement = connection.prepare(
        "SELECT name FROM prepared_items WHERE id = ?",
      );

      try {
        assertEquals(statement.columnCount(), 1n);
        assertEquals(statement.bind([1]), statement);

        let result = statement.execute();
        try {
          assertEquals(result.fetchAll(), [["alpha"]]);
        } finally {
          result.close();
        }

        assertEquals(statement.reset(), statement);
        assertThrows(() => statement.execute(), DatabaseError);

        result = statement.bind([2]).execute();
        try {
          assertEquals(result.fetchAll(), [["beta"]]);
        } finally {
          result.close();
        }
      } finally {
        statement.close();
      }
    });
  },
});

Deno.test({
  name: "objective: closed resources fail fast with typed errors",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const database = new Database();
    const connection = await database.connect();
    const result = connection.query("SELECT 1 AS value");
    const statement = connection.prepare("SELECT 1 AS value");

    result.close();
    statement.close();
    connection.close();
    database.close();

    assertThrows(
      () => result.getRow(0),
      InvalidResourceError,
      "QueryResult is closed",
    );
    assertThrows(
      () => statement.execute(),
      InvalidResourceError,
      "PreparedStatement is closed",
    );
    assertThrows(
      () => connection.query("SELECT 1"),
      InvalidResourceError,
      "Connection is closed",
    );

    const secondDatabase = new Database();
    secondDatabase.close();

    let caught: unknown;
    try {
      await secondDatabase.connect();
    } catch (error) {
      caught = error;
    }

    assertEquals(caught instanceof DatabaseError, true);
    assertEquals((caught as Error).message, "Database is closed");
  },
});
