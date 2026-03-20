import { assertEquals } from "@std/assert";
import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import { materializeResultObjects, materializeResultRows } from "../utils.ts";

Deno.test({
  name: "parity: both APIs decode the same mixed-type query results",
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

    const functionalDatabase = await functional.open();
    const functionalConnection = await functional.connect(functionalDatabase);

    const objectiveDatabase = new objective.Database();
    const objectiveConnection = await objectiveDatabase.connect();

    try {
      const stmt = functional.prepare(functionalConnection, sql);
      const functionalResult = functional.executePrepared(stmt);

      const objectiveResult = objectiveConnection.execute(sql);

      try {
        const functionalReader = functional.createResultReader(functionalResult);
        assertEquals(materializeResultRows(functionalReader), expectedRows);
        assertEquals(materializeResultObjects(functionalReader)[0].id, 1);
        assertEquals([...objectiveResult.rows()], expectedRows);
        assertEquals([...objectiveResult.objects()][0].id, 1);
      } finally {
        functional.destroy(functionalResult);
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
