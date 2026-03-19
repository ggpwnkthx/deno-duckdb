import { assertEquals } from "@std/assert";
import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import { materializeResultObjects, materializeResultRows } from "../utils.ts";

Deno.test({
  name:
    "parity: functional and objective APIs decode the same mixed-type query results",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const sql = `
      SELECT
        1::INTEGER AS id,
        42::UTINYINT AS tiny_uint,
        1000::USMALLINT AS small_uint,
        42::UINTEGER AS uint,
        9223372036854775807::BIGINT AS big_value,
        42::UBIGINT AS ubig,
        'hello'::TEXT AS text_value,
        true AS flag,
        NULL::TEXT AS note,
        3.14::FLOAT AS flt,
        3.14159::DOUBLE AS dbl,
        '12:34:56'::TIME AS t,
        '2024-01-15'::DATE AS created,
        '2024-01-15 12:34:56.123456'::TIMESTAMP AS ts,
        INTERVAL '1 year 2 days' AS span
    `;

    const expectedRows = [[
      1,
      42,
      1000,
      42,
      9223372036854775807n,
      42n,
      "hello",
      true,
      null,
      3.140000104904175,
      3.14159,
      "12:34:56",
      "2024-01-15",
      "2024-01-15 12:34:56.123456",
      { months: 12, days: 2, micros: 0n },
    ]];
    const expectedObjects = [{
      id: 1,
      tiny_uint: 42,
      small_uint: 1000,
      uint: 42,
      big_value: 9223372036854775807n,
      ubig: 42n,
      text_value: "hello",
      flag: true,
      note: null,
      flt: 3.140000104904175,
      dbl: 3.14159,
      t: "12:34:56",
      created: "2024-01-15",
      ts: "2024-01-15 12:34:56.123456",
      span: { months: 12, days: 2, micros: 0n },
    }];

    const functionalDatabase = await functional.open();
    const functionalConnection = await functional.create(functionalDatabase);

    const objectiveDatabase = new objective.Database();
    const objectiveConnection = await objectiveDatabase.connect();

    try {
      // Use prepared statements to get ResultHandle for functional API
      const stmt = functional.prepare(functionalConnection, sql);
      const functionalResult = functional.executePrepared(stmt);

      const objectiveResult = objectiveConnection.execute(sql);

      try {
        const functionalReader = functional.createResultReader(functionalResult);
        assertEquals(materializeResultRows(functionalReader), expectedRows);
        assertEquals(
          materializeResultObjects(functionalReader),
          expectedObjects,
        );
        assertEquals([...objectiveResult.rows()], expectedRows);
        assertEquals([...objectiveResult.objects()], expectedObjects);
      } finally {
        functional.destroyResult(functionalResult);
        functional.destroyPrepared(stmt);
        objectiveResult.close();
      }
    } finally {
      objectiveConnection.close();
      objectiveDatabase.close();
      functional.closeConnection(functionalConnection);
      functional.closeDatabase(functionalDatabase);
    }
  },
});

Deno.test({
  name: "parity: functional and objective prepared statements return the same rows",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const createTable =
      "CREATE TABLE parity_items(id INTEGER, name TEXT, active BOOLEAN)";
    const insertData =
      "INSERT INTO parity_items VALUES (1, 'alpha', true), (2, 'beta', false), (3, 'gamma', true)";

    const functionalDatabase = await functional.open();
    const functionalConnection = await functional.create(functionalDatabase);

    const objectiveDatabase = new objective.Database();
    const objectiveConnection = await objectiveDatabase.connect();

    try {
      // Execute DDL on functional connection
      {
        const stmt = functional.prepare(functionalConnection, createTable);
        const result = functional.executePrepared(stmt);
        functional.destroyResult(result);
        functional.destroyPrepared(stmt);
      }
      {
        const stmt = functional.prepare(functionalConnection, insertData);
        const result = functional.executePrepared(stmt);
        functional.destroyResult(result);
        functional.destroyPrepared(stmt);
      }

      // Execute DDL on objective connection
      {
        const result = objectiveConnection.execute(createTable);
        result.close();
      }
      {
        const result = objectiveConnection.execute(insertData);
        result.close();
      }

      // Test SELECT queries
      const functionalStatement = functional.prepare(
        functionalConnection,
        "SELECT id, name FROM parity_items WHERE active = ? ORDER BY id",
      );
      const objectiveStatement = objectiveConnection.prepare(
        "SELECT id, name FROM parity_items WHERE active = ? ORDER BY id",
      );

      try {
        functional.bind(functionalStatement, [true]);
        const functionalResult = functional.executePrepared(
          functionalStatement,
        );

        const objectiveResult = objectiveStatement.bind([true]).execute();

        try {
          const expected = [
            [1, "alpha"],
            [3, "gamma"],
          ];

          const functionalReader = functional.createResultReader(functionalResult);
          assertEquals(materializeResultRows(functionalReader), expected);
          assertEquals([...objectiveResult.rows()], expected);
        } finally {
          functional.destroyResult(functionalResult);
          objectiveResult.close();
        }
      } finally {
        functional.destroyPrepared(functionalStatement);
        objectiveStatement.close();
      }
    } finally {
      objectiveConnection.close();
      objectiveDatabase.close();
      functional.closeConnection(functionalConnection);
      functional.closeDatabase(functionalDatabase);
    }
  },
});
