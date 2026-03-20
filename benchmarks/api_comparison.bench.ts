/**
 * Benchmark Objective API vs Functional API.
 *
 * Compares the two APIs for equivalent operations to identify
 * any overhead in the Objective wrapper.
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";

const ROW_COUNT = 100_000;
const QUERY =
  `SELECT i, i AS a, 'text_' || i AS b FROM generate_series(1, ${ROW_COUNT}) t(i)`;
const PREP_QUERY =
  `SELECT i, i AS a, 'text_' || i AS b FROM generate_series(1, ?) t(i)`;

const dbFunc = await functional.open();
const connFunc = await functional.connectToDatabase(dbFunc);

const dbObj = new objective.Database();
const connObj = await dbObj.connect();

const stmtFunc = functional.prepare(connFunc, PREP_QUERY);
const stmtObj = connObj.prepare(PREP_QUERY);

Deno.bench("API Comparison: Standard Query (Functional)", () => {
  const result = functional.executeSqlResult(connFunc, QUERY);
  const rows = result.toArray({ skipByteSizeCheck: true });
  result.close();
  if (rows.length !== ROW_COUNT) throw new Error("Wrong count");
});

Deno.bench("API Comparison: Standard Query (Objective)", () => {
  const result = connObj.execute(QUERY);
  const rows = result.toArray({ skipByteSizeCheck: true });
  result.close();
  if (rows.length !== ROW_COUNT) throw new Error("Wrong count");
});

Deno.bench("API Comparison: Prepared Statement reuse (Functional)", () => {
  functional.bind(stmtFunc, [ROW_COUNT]);
  const result = functional.executePreparedResult(stmtFunc);
  const rows = result.toArray({ skipByteSizeCheck: true });
  result.close();
  if (rows.length !== ROW_COUNT) throw new Error("Wrong count");
});

Deno.bench("API Comparison: Prepared Statement reuse (Objective)", () => {
  stmtObj.bind([ROW_COUNT]);
  const result = stmtObj.execute();
  const rows = result.toArray({ skipByteSizeCheck: true });
  result.close();
  if (rows.length !== ROW_COUNT) throw new Error("Wrong count");
});

Deno.bench("API Comparison: Object rows (Functional)", () => {
  const result = functional.executeSqlResult(connFunc, QUERY);
  const rows = result.toObjectArray({ skipByteSizeCheck: true });
  result.close();
  if (rows.length !== ROW_COUNT) throw new Error("Wrong count");
});

Deno.bench("API Comparison: Object rows (Objective)", () => {
  const result = connObj.execute(QUERY);
  const rows = result.toObjectArray({ skipByteSizeCheck: true });
  result.close();
  if (rows.length !== ROW_COUNT) throw new Error("Wrong count");
});

addEventListener("unload", () => {
  try {
    stmtObj.close();
  } catch { /* ignore */ }
  try {
    connObj.close();
  } catch { /* ignore */ }
  try {
    dbObj.close();
  } catch { /* ignore */ }
  try {
    functional.destroyPrepared(stmtFunc);
  } catch { /* ignore */ }
  try {
    functional.closeConnection(connFunc);
  } catch { /* ignore */ }
  try {
    functional.closeDatabase(dbFunc);
  } catch { /* ignore */ }
});
