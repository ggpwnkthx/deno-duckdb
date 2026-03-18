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
        9223372036854775807::BIGINT AS big_value,
        'hello'::TEXT AS text_value,
        true AS flag,
        NULL::TEXT AS note,
        '2024-01-15'::DATE AS created,
        INTERVAL '1 year 2 days' AS span
    `;

    const expectedRows = [[
      1,
      9223372036854775807n,
      "hello",
      true,
      null,
      "2024-01-15",
      { months: 12, days: 2, micros: 0n },
    ]];
    const expectedObjects = [{
      id: 1,
      big_value: 9223372036854775807n,
      text_value: "hello",
      flag: true,
      note: null,
      created: "2024-01-15",
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
