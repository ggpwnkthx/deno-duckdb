import { assertEquals, assertThrows } from "@std/assert";
import { Database } from "@ggpwnkthx/duckdb/objective";
import { DatabaseError, InvalidResourceError } from "@ggpwnkthx/duckdb";
import { withObjectiveConnection } from "../utils.ts";

Deno.test({
  name: "objective: Database.connect opens lazily and returns working connections",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const database = new Database();

    assertEquals(database.closed, false);

    const connection = await database.connect();
    // Use queryResult for tests that need QueryResult features
    const result = connection.execute("SELECT 1 AS value");

    try {
      assertEquals([...result.rows()], [[1]]);
    } finally {
      result.close();
      connection.close();
      database.close();
    }

    assertEquals(database.closed, true);
  },
});

Deno.test({
  name: "objective: QueryResult exposes metadata, rows, objects, and defensive copies",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      // Use queryResult for DDL (returns QueryResult for metadata access)
      for (
        const sql of [
          "CREATE TABLE items(id INTEGER, name TEXT, amount DOUBLE, payload BLOB)",
          "INSERT INTO items VALUES (1, 'alpha', 1.5, unhex('CAFE')), (2, 'beta', 2.5, unhex('BEEF'))",
        ]
      ) {
        const result = connection.execute(sql);
        result.close();
      }

      // Use queryResult for tests that need QueryResult metadata methods
      const result = connection.execute("SELECT * FROM items ORDER BY id");

      try {
        assertEquals(result.rowCount(), 2n);
        assertEquals(result.columnCount(), 4n);
        assertEquals(
          result.columnInfos.map((column: { name: string }) => column.name),
          ["id", "name", "amount", "payload"],
        );
        assertEquals(result.row(0), [1, "alpha", 1.5, new Uint8Array([0xCA, 0xFE])]);
        assertEquals([...result.rows()], [
          [1, "alpha", 1.5, new Uint8Array([0xCA, 0xFE])],
          [2, "beta", 2.5, new Uint8Array([0xBE, 0xEF])],
        ]);
        assertEquals([...result.objects()], [
          { id: 1, name: "alpha", amount: 1.5, payload: new Uint8Array([0xCA, 0xFE]) },
          { id: 2, name: "beta", amount: 2.5, payload: new Uint8Array([0xBE, 0xEF]) },
        ]);

        const rows1 = [...result.rows()];
        (rows1[0][3] as Uint8Array)[0] = 0;

        const rows2 = [...result.rows()];
        assertEquals(rows2, [
          [1, "alpha", 1.5, new Uint8Array([0xCA, 0xFE])],
          [2, "beta", 2.5, new Uint8Array([0xBE, 0xEF])],
        ]);

        const objects1 = [...result.objects()];
        (objects1[0].payload as Uint8Array)[0] = 0;

        const objects2 = [...result.objects()];
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
  name: "objective: QueryResult.rows and objects return decoded values",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      // Use queryResult for DDL
      for (
        const sql of [
          "CREATE TABLE typed_items(id INTEGER, name TEXT, active BOOLEAN)",
          "INSERT INTO typed_items VALUES (1, 'alpha', true), (2, 'beta', false)",
        ]
      ) {
        const result = connection.execute(sql);
        result.close();
      }

      // Use queryResult for tests that need QueryResult
      const result = connection.execute("SELECT * FROM typed_items ORDER BY id");

      assertEquals(
        [...result.rows()],
        [
          [1, "alpha", true],
          [2, "beta", false],
        ],
      );

      result.close();

      const result2 = connection.execute(
        "SELECT id, name FROM typed_items ORDER BY id",
      );

      assertEquals(
        [...result2.objects()],
        [
          { id: 1, name: "alpha" },
          { id: 2, name: "beta" },
        ],
      );

      result2.close();
    });
  },
});

Deno.test({
  name: "objective: prepared statements are fluent, resettable, and reusable",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      // Use queryResult for DDL
      for (
        const sql of [
          "CREATE TABLE prepared_items(id INTEGER, name TEXT)",
          "INSERT INTO prepared_items VALUES (1, 'alpha'), (2, 'beta')",
        ]
      ) {
        const result = connection.execute(sql);
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
          assertEquals([...result.rows()], [["alpha"]]);
        } finally {
          result.close();
        }

        assertEquals(statement.reset(), statement);
        assertThrows(() => statement.execute(), DatabaseError);

        result = statement.bind([2]).execute();
        try {
          assertEquals([...result.rows()], [["beta"]]);
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
    // Use queryResult for tests that need QueryResult
    const result = connection.execute("SELECT 1 AS value");
    const statement = connection.prepare("SELECT 1 AS value");

    result.close();
    statement.close();
    connection.close();
    database.close();

    assertThrows(
      () => result.row(0),
      InvalidResourceError,
      "QueryResult is closed",
    );
    assertThrows(
      () => statement.execute(),
      InvalidResourceError,
      "PreparedStatement is closed",
    );
    // For closed connection, queryResult throws
    assertThrows(
      () => connection.execute("SELECT 1"),
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

Deno.test({
  name: "objective: larger strings decode correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      // Test medium string (100 chars)
      const mediumString = "x".repeat(100);
      const mediumResult = connection.execute(`SELECT '${mediumString}' AS content`);
      assertEquals([...mediumResult.rows()][0][0], mediumString);
      mediumResult.close();

      // Test large string (1000 chars)
      const largeString = "y".repeat(1000);
      const largeResult = connection.execute(`SELECT '${largeString}' AS content`);
      assertEquals([...largeResult.rows()][0][0], largeString);
      largeResult.close();

      // Test extra large string (10KB)
      const xlargeString = "z".repeat(10240);
      const xlargeResult = connection.execute(`SELECT '${xlargeString}' AS content`);
      assertEquals([...xlargeResult.rows()][0][0], xlargeString);
      xlargeResult.close();

      // Test empty string
      const emptyResult = connection.execute(`SELECT '' AS content`);
      assertEquals([...emptyResult.rows()][0][0], "");
      emptyResult.close();

      // Test NULL string
      const nullResult = connection.execute(`SELECT NULL AS content`);
      assertEquals([...nullResult.rows()][0][0], null);
      nullResult.close();

      // Test mixed NULL and large strings
      const mixedResult = connection.execute(
        `SELECT NULL AS a, '${largeString}' AS b UNION ALL SELECT '${mediumString}', NULL`,
      );
      const mixedRows = [...mixedResult.rows()];
      assertEquals(mixedRows[0][0], null);
      assertEquals(mixedRows[0][1], largeString);
      assertEquals(mixedRows[1][0], mediumString);
      assertEquals(mixedRows[1][1], null);
      mixedResult.close();
    });
  },
});

Deno.test({
  name: "objective: all integer and temporal types decode correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      const result = connection.execute(`
        SELECT
          42::TINYINT AS tiny,
          1000::SMALLINT AS small,
          42::INTEGER AS int,
          42::BIGINT AS big,
          42::UTINYINT AS utiny,
          1000::USMALLINT AS usmall,
          42::UINTEGER AS uint,
          42::UBIGINT AS ubig,
          3.14::FLOAT AS flt,
          3.14159::DOUBLE AS dbl,
          '12:34:56'::TIME AS t,
          '2024-01-15 12:34:56.123456'::TIMESTAMP AS ts,
          INTERVAL '1 year 2 days 3 hours' AS span
      `);

      const rows = [...result.rows()];
      assertEquals(rows[0][0], 42); // TINYINT
      assertEquals(rows[0][1], 1000); // SMALLINT
      assertEquals(rows[0][2], 42); // INTEGER
      assertEquals(rows[0][3], 42n); // BIGINT
      assertEquals(rows[0][4], 42); // UTINYINT
      assertEquals(rows[0][5], 1000); // USMALLINT
      assertEquals(rows[0][6], 42); // UINTEGER
      assertEquals(rows[0][7], 42n); // UBIGINT
      assertEquals(rows[0][8], 3.140000104904175); // FLOAT
      assertEquals(rows[0][9], 3.14159); // DOUBLE
      assertEquals(rows[0][10], "12:34:56"); // TIME
      assertEquals(rows[0][11], "2024-01-15 12:34:56.123456"); // TIMESTAMP
      assertEquals(rows[0][12], { months: 12, days: 2, micros: 10800000000n }); // INTERVAL
      result.close();
    });
  },
});

Deno.test({
  name: "objective: cached query returns rows directly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await withObjectiveConnection((_database, connection) => {
      // Use cached query for data retrieval
      const rows = connection.query("SELECT 1 AS value");
      assertEquals(rows, [[1]]);

      // Use cached queryObjects for object format
      const objects = connection.queryObjects("SELECT 1 AS id, 'test' AS name");
      assertEquals(objects, [{ id: 1, name: "test" }]);
    });
  },
});

Deno.test({
  name:
    "objective: closing connection cascades to prepared statements and query results",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const database = new Database();
    const connection = await database.connect();

    // Create a prepared statement and execute a query (leaving them open)
    const statement = connection.prepare("SELECT 1 AS value");
    const result = connection.execute("SELECT 2 AS value");

    // Close the connection - should cascade to children
    connection.close();
    database.close();

    // Verify children are closed
    assertThrows(
      () => statement.execute(),
      InvalidResourceError,
      "PreparedStatement is closed",
    );
    assertThrows(
      () => result.row(0),
      InvalidResourceError,
      "QueryResult is closed",
    );
  },
});

Deno.test({
  name: "objective: closing database cascades through connections to their children",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const database = new Database();
    const connection = await database.connect();

    // Create children without explicitly closing connection
    const statement = connection.prepare("SELECT 1 AS value");
    const result = connection.execute("SELECT 2 AS value");

    // Close database directly - should cascade all the way down
    database.close();

    // Verify all resources are closed
    assertThrows(
      () => connection.execute("SELECT 1"),
      InvalidResourceError,
      "Connection is closed",
    );
    assertThrows(
      () => statement.execute(),
      InvalidResourceError,
      "PreparedStatement is closed",
    );
    assertThrows(
      () => result.row(0),
      InvalidResourceError,
      "QueryResult is closed",
    );
  },
});
