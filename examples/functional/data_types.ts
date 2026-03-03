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
const intStmt = await prepare(conn, "SELECT 42 as num, -10 as neg, 0 as zero");
const intResult = await executePrepared(intStmt);
const intRows = await fetchAll(intResult);
console.log("Values:", intRows[0]);
await destroyResult(intResult);
await destroyPrepared(intStmt);

// BIGINT
console.log("\n--- BIGINT ---");
const bigIntStmt = await prepare(
  conn,
  "SELECT 9007199254740991::BIGINT as big_val",
);
const bigIntResult = await executePrepared(bigIntStmt);
const bigIntRows = await fetchAll(bigIntResult);
console.log("Value:", bigIntRows[0]);
await destroyResult(bigIntResult);
await destroyPrepared(bigIntStmt);

// DOUBLE / FLOAT
console.log("\n--- DOUBLE ---");
const doubleStmt = await prepare(
  conn,
  "SELECT 3.14159 as pi, 2.71828 as e, 1.23456789012345::DOUBLE as precise",
);
const doubleResult = await executePrepared(doubleStmt);
const doubleRows = await fetchAll(doubleResult);
console.log("Values:", doubleRows[0]);
await destroyResult(doubleResult);
await destroyPrepared(doubleStmt);

// VARCHAR
console.log("\n--- VARCHAR ---");
const varcharStmt = await prepare(
  conn,
  "SELECT 'Hello, World!' as greeting",
);
const varcharResult = await executePrepared(varcharStmt);
const varcharRows = await fetchAll(varcharResult);
console.log("Value:", varcharRows[0]);
await destroyResult(varcharResult);
await destroyPrepared(varcharStmt);

// BOOLEAN
console.log("\n--- BOOLEAN ---");
const boolStmt = await prepare(
  conn,
  "SELECT true as yes, false as no, 1 = 1 as is_one",
);
const boolResult = await executePrepared(boolStmt);
const boolRows = await fetchAll(boolResult);
console.log("Values:", boolRows[0]);
await destroyResult(boolResult);
await destroyPrepared(boolStmt);

// DATE
console.log("\n--- DATE ---");
const dateStmt = await prepare(
  conn,
  "SELECT '2024-01-15'::DATE as some_date, CURRENT_DATE as today",
);
const dateResult = await executePrepared(dateStmt);
const dateRows = await fetchAll(dateResult);
console.log("Values:", dateRows[0]);
await destroyResult(dateResult);
await destroyPrepared(dateStmt);

// TIMESTAMP
console.log("\n--- TIMESTAMP ---");
const timestampStmt = await prepare(
  conn,
  "SELECT '2024-01-15 10:30:00'::TIMESTAMP as ts, CURRENT_TIMESTAMP as now",
);
const timestampResult = await executePrepared(timestampStmt);
const timestampRows = await fetchAll(timestampResult);
console.log("Values:", timestampRows[0]);
await destroyResult(timestampResult);
await destroyPrepared(timestampStmt);

// NULL handling
console.log("\n--- NULL ---");
const nullStmt = await prepare(
  conn,
  "SELECT NULL as null_val, 42 as non_null",
);
const nullResult = await executePrepared(nullStmt);
const nullRows = await fetchAll(nullResult);
console.log("Values:", nullRows[0]);
await destroyResult(nullResult);
await destroyPrepared(nullStmt);

// Parameter binding with different types
console.log("\n--- Parameter binding with types ---");
const paramStmt = await prepare(
  conn,
  "SELECT $1::INTEGER + $2::DOUBLE as result",
);
await bind(paramStmt, [10, 5.5]);
const paramResult = await executePrepared(paramStmt);
const paramRows = await fetchAll(paramResult);
console.log("10 + 5.5 =", paramRows[0][0]);
await destroyResult(paramResult);
await destroyPrepared(paramStmt);

// Clean up
await closeConnection(conn);
await closeDatabase(db);

console.log("\n=== Example Complete ===");
