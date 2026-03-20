import { assertEquals, assertThrows } from "@std/assert";
import {
  DatabaseError,
  InvalidResourceError,
  ValidationError,
} from "@ggpwnkthx/duckdb";
import * as functional from "@ggpwnkthx/duckdb/functional";
import { Database } from "@ggpwnkthx/duckdb/objective";
import {
  execFunctional,
  test,
  withFunctionalConnection,
  withObjectiveConnection,
} from "../utils.ts";

function testBothApis(
  name: string,
  fn: (connection: {
    query: (sql: string) => unknown[] | null;
    exec: (sql: string) => void;
    execute: (
      sql: string,
    ) => {
      close: () => void;
      rows: () => Iterable<unknown[]>;
      objects: () => Iterable<Record<string, unknown>>;
    };
    prepare: (sql: string) => {
      bind: (params: unknown[]) => unknown;
      execute: () => { close: () => void; rows: () => Iterable<unknown[]> };
      reset: () => unknown;
      close: () => void;
    };
    rawConnection: unknown;
  }) => void | Promise<void>,
) {
  test(`functional: ${name}`, () =>
    withFunctionalConnection((conn) => {
      fn({
        query: (sql) => functional.query(conn, sql),
        exec: (sql) => {
          const r = functional.executeSqlResult(conn, sql);
          r.close();
        },
        execute: (sql) => {
          const r = functional.executeSqlResult(conn, sql);
          return {
            close: () => r.close(),
            rows: () => functional.iterateRows(r),
            objects: () => functional.iterateObjects(r),
          };
        },
        prepare: (sql) => {
          const stmt = functional.prepare(conn, sql);
          return {
            bind: (params) => functional.bind(stmt, params as never[]),
            execute: () => {
              const r = functional.executePrepared(stmt);
              return {
                close: () => functional.destroy(r),
                rows: () => {
                  const reader = functional.createResultReader(r);
                  return functional.iterateRows(reader);
                },
              };
            },
            reset: () => functional.resetPrepared(stmt),
            close: () => functional.destroyPrepared(stmt),
          };
        },
        rawConnection: conn,
      });
    }));

  test(`objective: ${name}`, () =>
    withObjectiveConnection((_db, conn) => {
      fn({
        query: (sql) => conn.query(sql),
        exec: (sql) => {
          const r = conn.execute(sql);
          r.close();
        },
        execute: (sql) => {
          const r = conn.execute(sql);
          return {
            close: () => r.close(),
            rows: () => r.rows(),
            objects: () => r.objects(),
          };
        },
        prepare: (sql) => {
          const stmt = conn.prepare(sql);
          return {
            bind: (params) => stmt.bind(params as never[]),
            execute: () => {
              const r = stmt.execute();
              return { close: () => r.close(), rows: () => r.rows() };
            },
            reset: () => stmt.reset(),
            close: () => stmt.close(),
          };
        },
        rawConnection: conn,
      });
    }));
}

// ============================================
// Handle Validation
// ============================================

test("handles are valid after open", async () => {
  const database = await functional.open(undefined, { threads: 2n });
  const connection = await functional.connect(database);

  assertEquals(functional.isValidDatabase(database), true);
  assertEquals(functional.isValidConnection(connection), true);

  functional.closeConnection(connection);
  functional.closeDatabase(database);

  assertEquals(functional.isValidConnection(connection), false);
  assertEquals(functional.isValidDatabase(database), false);
});

test("Database.connect opens lazily", async () => {
  const database = new Database();
  assertEquals(database.closed, false);

  const connection = await database.connect();
  assertEquals(connection.closed, false);

  const result = connection.execute("SELECT 1 AS value");
  assertEquals([...result.rows()], [[1]]);
  result.close();

  connection.close();
  assertEquals(connection.closed, true);

  database.close();
  assertEquals(database.closed, true);
});

// ============================================
// Basic Query Execution
// ============================================

testBothApis("query returns cached rows", (api) => {
  api.exec("CREATE TABLE items(id INTEGER, name TEXT)");
  api.exec("INSERT INTO items VALUES (1, 'alpha'), (2, 'beta')");

  const rows = api.query("SELECT * FROM items ORDER BY id") as unknown[][];
  assertEquals(rows, [[1, "alpha"], [2, "beta"]]);
});

testBothApis("queryObjects returns object rows", (api) => {
  api.exec("CREATE TABLE items(id INTEGER, name TEXT)");
  api.exec("INSERT INTO items VALUES (1, 'alpha'), (2, 'beta')");

  const result = api.execute("SELECT * FROM items ORDER BY id");
  const objects = [...result.objects()] as unknown as Record<string, unknown>[];
  result.close();
  assertEquals(objects, [{ id: 1, name: "alpha" }, { id: 2, name: "beta" }]);
});

testBothApis("empty results return empty array", (api) => {
  const rows = api.query("SELECT 1::INTEGER AS value WHERE 1 = 0") as unknown[][];
  assertEquals(rows, []);
});

// ============================================
// Prepared Statements
// ============================================

testBothApis("prepared statements can be rebound, reset, and reused", (api) => {
  api.exec("CREATE TABLE prep_items(id INTEGER, name TEXT, active BOOLEAN)");
  api.exec(
    "INSERT INTO prep_items VALUES (1, 'alpha', true), (2, 'beta', false), (3, 'gamma', true)",
  );

  const stmt = api.prepare("SELECT name FROM prep_items WHERE id = ? AND active = ?");

  stmt.bind([1, true]);
  let result = stmt.execute();
  assertEquals([...result.rows()], [["alpha"]]);
  result.close();

  stmt.bind([2, false]);
  result = stmt.execute();
  assertEquals([...result.rows()], [["beta"]]);
  result.close();

  stmt.reset();

  stmt.bind([3, true]);
  result = stmt.execute();
  assertEquals([...result.rows()], [["gamma"]]);
  result.close();

  stmt.close();
});

test("integer binding rejects unsafe JS integers", () =>
  withFunctionalConnection((connection) => {
    const stmt = functional.prepare(connection, "SELECT ?");
    try {
      const error = assertThrows(
        () => functional.bind(stmt, [Number.MAX_SAFE_INTEGER + 1]),
        ValidationError,
        "safe integer",
      );
      assertEquals(error.code, "VALIDATION_ERROR");
    } finally {
      functional.destroyPrepared(stmt);
    }
  }));

// ============================================
// String Handling
// ============================================

testBothApis("larger strings decode correctly", (api) => {
  const mediumString = "x".repeat(100);
  const largeString = "y".repeat(1000);
  const xlargeString = "z".repeat(10240);

  const mediumRows = api.query(`SELECT '${mediumString}' AS content`) as unknown[][];
  assertEquals(mediumRows[0][0], mediumString);

  const largeRows = api.query(`SELECT '${largeString}' AS content`) as unknown[][];
  assertEquals(largeRows[0][0], largeString);

  const xlargeRows = api.query(`SELECT '${xlargeString}' AS content`) as unknown[][];
  assertEquals(xlargeRows[0][0], xlargeString);

  const emptyRows = api.query(`SELECT '' AS content`) as unknown[][];
  assertEquals(emptyRows[0][0], "");

  const nullRows = api.query(`SELECT NULL AS content`) as unknown[][];
  assertEquals(nullRows[0][0], null);

  const mixedRows = api.query(
    `SELECT NULL AS a, '${largeString}' AS b UNION ALL SELECT '${mediumString}', NULL`,
  ) as unknown[][];
  assertEquals(mixedRows[0][0], null);
  assertEquals(mixedRows[0][1], largeString);
  assertEquals(mixedRows[1][0], mediumString);
  assertEquals(mixedRows[1][1], null);
});

test("destroy helpers do not poison the active connection", () =>
  withFunctionalConnection((connection) => {
    const rows1 = [...functional.query(connection, "SELECT 1 AS value")!];
    assertEquals(rows1, [[1]]);

    const statement = functional.prepare(connection, "SELECT 2 AS value");
    functional.destroyPrepared(statement);

    const rows2 = [...functional.query(connection, "SELECT 3 AS value")!];
    assertEquals(rows2, [[3]]);
  }));

// ============================================
// LazyResult Features
// ============================================

test("LazyResult getRow and getObjectRow work directly", () =>
  withFunctionalConnection((connection) => {
    execFunctional(connection, "CREATE TABLE lazy_test(id INTEGER, name TEXT)");
    execFunctional(
      connection,
      "INSERT INTO lazy_test VALUES (1, 'first'), (2, 'second')",
    );

    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM lazy_test ORDER BY id",
    );
    try {
      assertEquals(result.getRow(0), [1, "first"]);
      assertEquals(result.getRow(1), [2, "second"]);
      assertEquals(result.getObjectRow(0), { id: 1, name: "first" });
      assertEquals(result.getObjectRow(1), { id: 2, name: "second" });
    } finally {
      result.close();
    }
  }));

test("LazyResult toArray works", () =>
  withFunctionalConnection((connection) => {
    execFunctional(connection, "CREATE TABLE limit_test(id INTEGER)");
    execFunctional(connection, "INSERT INTO limit_test VALUES (1), (2), (3), (4), (5)");

    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM limit_test ORDER BY id",
    );
    try {
      const all = result.toArray();
      assertEquals(all.length, 5);
      assertEquals(result.toArray().length, 5);
    } finally {
      result.close();
    }
  }));

test("LazyResult toObjectArray works", () =>
  withFunctionalConnection((connection) => {
    execFunctional(connection, "CREATE TABLE obj_limit_test(id INTEGER, name TEXT)");
    execFunctional(
      connection,
      "INSERT INTO obj_limit_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
    );

    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM obj_limit_test ORDER BY id",
    );
    try {
      const all = result.toObjectArray();
      assertEquals(all.length, 3);
      assertEquals(all[0], { id: 1, name: "a" });
      assertEquals(all[1], { id: 2, name: "b" });
      assertEquals(all[2], { id: 3, name: "c" });
    } finally {
      result.close();
    }
  }));

test("LazyResult reader caching returns same instance", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(connection, "SELECT 1, 2, 3");
    try {
      const reader1 = result.reader();
      const reader2 = result.reader();
      assertEquals(reader1, reader2);
    } finally {
      result.close();
    }
  }));

test("LazyResult close is idempotent", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(connection, "SELECT 1");
    result.close();
    result.close();
  }));

test("executePreparedResult creates LazyResult", () =>
  withFunctionalConnection((connection) => {
    execFunctional(connection, "CREATE TABLE prep_test(id INTEGER)");
    execFunctional(connection, "INSERT INTO prep_test VALUES (10), (20), (30)");

    const stmt = functional.prepare(connection, "SELECT * FROM prep_test ORDER BY id");
    try {
      const result = functional.executePreparedResult(stmt);
      try {
        const rows = result.toArray();
        assertEquals(rows, [[10], [20], [30]]);
      } finally {
        result.close();
      }
    } finally {
      functional.destroyPrepared(stmt);
    }
  }));

// ============================================
// Objective API Specific
// ============================================

test("QueryResult exposes metadata, rows, objects, and defensive copies", () =>
  withObjectiveConnection((_database, connection) => {
    connection.execute(
      "CREATE TABLE items(id INTEGER, name TEXT, amount DOUBLE, payload BLOB)",
    ).close();
    connection.execute(
      "INSERT INTO items VALUES (1, 'alpha', 1.5, unhex('CAFE')), (2, 'beta', 2.5, unhex('BEEF'))",
    ).close();

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
    } finally {
      result.close();
    }
  }));

test("prepared statements are fluent, resettable, and reusable", () =>
  withObjectiveConnection((_database, connection) => {
    connection.execute("CREATE TABLE prepared_items(id INTEGER, name TEXT)").close();
    connection.execute("INSERT INTO prepared_items VALUES (1, 'alpha'), (2, 'beta')")
      .close();

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
  }));

test("closed resources fail fast with typed errors", async () => {
  const database = new Database();
  const connection = await database.connect();
  const result = connection.execute("SELECT 1 AS value");
  const statement = connection.prepare("SELECT 1 AS value");

  result.close();
  statement.close();
  connection.close();
  database.close();

  assertThrows(() => result.row(0), InvalidResourceError, "QueryResult is closed");
  assertThrows(
    () => statement.execute(),
    InvalidResourceError,
    "PreparedStatement is closed",
  );
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
});

test("closing connection cascades to prepared statements and query results", async () => {
  const database = new Database();
  const connection = await database.connect();

  const statement = connection.prepare("SELECT 1 AS value");
  const result = connection.execute("SELECT 2 AS value");

  connection.close();
  database.close();

  assertThrows(
    () => statement.execute(),
    InvalidResourceError,
    "PreparedStatement is closed",
  );
  assertThrows(() => result.row(0), InvalidResourceError, "QueryResult is closed");
});

test("closing database cascades through connections to their children", async () => {
  const database = new Database();
  const connection = await database.connect();

  const statement = connection.prepare("SELECT 1 AS value");
  const result = connection.execute("SELECT 2 AS value");

  database.close();

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
  assertThrows(() => result.row(0), InvalidResourceError, "QueryResult is closed");
});

test("Database.open static factory creates and opens database", async () => {
  const database = await Database.open(":memory:");

  try {
    assertEquals(database.closed, false);
    const connection = await database.connect();
    try {
      const result = connection.execute("SELECT 42 AS answer");
      assertEquals([...result.rows()], [[42]]);
      result.close();
    } finally {
      connection.close();
    }
  } finally {
    database.close();
  }

  assertEquals(database.closed, true);
});

test("cached query returns rows directly", () =>
  withObjectiveConnection((_database, connection) => {
    const rows = connection.query("SELECT 1 AS value");
    assertEquals(rows, [[1]]);

    const objects = connection.queryObjects("SELECT 1 AS id, 'test' AS name");
    assertEquals(objects, [{ id: 1, name: "test" }]);
  }));
