/**
 * Data Types Example - Functional API
 *
 * This example demonstrates working with various DuckDB data types.
 */

import {
  bind,
  closeConnection,
  closeDatabase,
  create,
  destroyPrepared,
  destroyResult,
  executePrepared,
  fetchAll,
  open,
  prepare,
} from "@ggpwnkthx/duckdb/functional";

console.log("=== Data Types Example (Functional API) ===\n");

const db = await open();
const conn = await create(db);

// INTEGER
console.log("--- INTEGER ---");
const intStmt = prepare(conn, "SELECT 42 as num, -10 as neg, 0 as zero");
const intResult = executePrepared(intStmt);
const intRows = fetchAll(intResult);
console.log("Values:", intRows[0]);
destroyResult(intResult);
destroyPrepared(intStmt);

// BIGINT
console.log("\n--- BIGINT ---");
const bigIntStmt = prepare(
  conn,
  "SELECT 9007199254740991::BIGINT as big_val",
);
const bigIntResult = executePrepared(bigIntStmt);
const bigIntRows = fetchAll(bigIntResult);
console.log("Value:", bigIntRows[0]);
destroyResult(bigIntResult);
destroyPrepared(bigIntStmt);

// DOUBLE / FLOAT
console.log("\n--- DOUBLE ---");
const doubleStmt = prepare(
  conn,
  "SELECT 3.14159 as pi, 2.71828 as e, 1.23456789012345::DOUBLE as precise",
);
const doubleResult = executePrepared(doubleStmt);
const doubleRows = fetchAll(doubleResult);
console.log("Values:", doubleRows[0]);
destroyResult(doubleResult);
destroyPrepared(doubleStmt);

// VARCHAR
console.log("\n--- VARCHAR ---");
const varcharStmt = prepare(
  conn,
  "SELECT 'Hello, World!' as greeting",
);
const varcharResult = executePrepared(varcharStmt);
const varcharRows = fetchAll(varcharResult);
console.log("Value:", varcharRows[0]);
destroyResult(varcharResult);
destroyPrepared(varcharStmt);

// BOOLEAN
console.log("\n--- BOOLEAN ---");
const boolStmt = prepare(
  conn,
  "SELECT true as yes, false as no, 1 = 1 as is_one",
);
const boolResult = executePrepared(boolStmt);
const boolRows = fetchAll(boolResult);
console.log("Values:", boolRows[0]);
destroyResult(boolResult);
destroyPrepared(boolStmt);

// DATE
console.log("\n--- DATE ---");
const dateStmt = prepare(
  conn,
  "SELECT '2024-01-15'::DATE as some_date, CURRENT_DATE as today",
);
const dateResult = executePrepared(dateStmt);
const dateRows = fetchAll(dateResult);
console.log("Values:", dateRows[0]);
destroyResult(dateResult);
destroyPrepared(dateStmt);

// TIMESTAMP
console.log("\n--- TIMESTAMP ---");
const timestampStmt = prepare(
  conn,
  "SELECT '2024-01-15 10:30:00'::TIMESTAMP as ts, CURRENT_TIMESTAMP as now",
);
const timestampResult = executePrepared(timestampStmt);
const timestampRows = fetchAll(timestampResult);
console.log("Values:", timestampRows[0]);
destroyResult(timestampResult);
destroyPrepared(timestampStmt);

// NULL handling
console.log("\n--- NULL ---");
const nullStmt = prepare(
  conn,
  "SELECT NULL as null_val, 42 as non_null",
);
const nullResult = executePrepared(nullStmt);
const nullRows = fetchAll(nullResult);
console.log("Values:", nullRows[0]);
destroyResult(nullResult);
destroyPrepared(nullStmt);

// Parameter binding with different types
console.log("\n--- Parameter binding with types ---");
const paramStmt = prepare(
  conn,
  "SELECT $1::INTEGER + $2::DOUBLE as result",
);
bind(paramStmt, [10, 5.5]);
const paramResult = executePrepared(paramStmt);
const paramRows = fetchAll(paramResult);
console.log("10 + 5.5 =", paramRows[0][0]);
destroyResult(paramResult);
destroyPrepared(paramStmt);

// Clean up
closeConnection(conn);
closeDatabase(db);

console.log("\n=== Example Complete ===");
