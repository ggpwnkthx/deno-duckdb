/**
 * Data Types Example - Objective API
 *
 * This example demonstrates working with various DuckDB data types.
 */

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("=== Data Types Example (Objective API) ===\n");

const db = new Database();
await db.open();
const conn = await db.connect();

// INTEGER
console.log("--- INTEGER ---");
const intStmt = await conn.prepare("SELECT 42 as num, -10 as neg, 0 as zero");
const intResult = await intStmt.execute();
const intRows = await intResult.fetchAll();
console.log("Values:", intRows[0]);
await intResult.close();
await intStmt.close();

// BIGINT
console.log("\n--- BIGINT ---");
const bigIntStmt = await conn.prepare(
  "SELECT 9007199254740991::BIGINT as big_val",
);
const bigIntResult = await bigIntStmt.execute();
const bigIntRows = await bigIntResult.fetchAll();
console.log("Value:", bigIntRows[0]);
await bigIntResult.close();
await bigIntStmt.close();

// DOUBLE / FLOAT
console.log("\n--- DOUBLE ---");
const doubleStmt = await conn.prepare(
  "SELECT 3.14159 as pi, 2.71828 as e, 1.23456789012345::DOUBLE as precise",
);
const doubleResult = await doubleStmt.execute();
const doubleRows = await doubleResult.fetchAll();
console.log("Values:", doubleRows[0]);
await doubleResult.close();
await doubleStmt.close();

// VARCHAR
console.log("\n--- VARCHAR ---");
const varcharStmt = await conn.prepare(
  "SELECT 'Hello, World!' as greeting",
);
const varcharResult = await varcharStmt.execute();
const varcharRows = await varcharResult.fetchAll();
console.log("Value:", varcharRows[0]);
await varcharResult.close();
await varcharStmt.close();

// BOOLEAN
console.log("\n--- BOOLEAN ---");
const boolStmt = await conn.prepare(
  "SELECT true as yes, false as no, 1 = 1 as is_one",
);
const boolResult = await boolStmt.execute();
const boolRows = await boolResult.fetchAll();
console.log("Values:", boolRows[0]);
await boolResult.close();
await boolStmt.close();

// DATE
console.log("\n--- DATE ---");
const dateStmt = await conn.prepare(
  "SELECT '2024-01-15'::DATE as some_date, CURRENT_DATE as today",
);
const dateResult = await dateStmt.execute();
const dateRows = await dateResult.fetchAll();
console.log("Values:", dateRows[0]);
await dateResult.close();
await dateStmt.close();

// TIMESTAMP
console.log("\n--- TIMESTAMP ---");
const timestampStmt = await conn.prepare(
  "SELECT '2024-01-15 10:30:00'::TIMESTAMP as ts, CURRENT_TIMESTAMP as now",
);
const timestampResult = await timestampStmt.execute();
const timestampRows = await timestampResult.fetchAll();
console.log("Values:", timestampRows[0]);
await timestampResult.close();
await timestampStmt.close();

// NULL handling
console.log("\n--- NULL ---");
const nullStmt = await conn.prepare(
  "SELECT NULL as null_val, 42 as non_null",
);
const nullResult = await nullStmt.execute();
const nullRows = await nullResult.fetchAll();
console.log("Values:", nullRows[0]);
await nullResult.close();
await nullStmt.close();

// Parameter binding with different types
console.log("\n--- Parameter binding with types ---");
const paramStmt = await conn.prepare(
  "SELECT $1::INTEGER + $2::DOUBLE as result",
);
await paramStmt.bind([10, 5.5]);
const paramResult = await paramStmt.execute();
const paramRows = await paramResult.fetchAll();
console.log("10 + 5.5 =", paramRows[0][0]);
await paramResult.close();
await paramStmt.close();

// Clean up
await conn.close();
await db.close();

console.log("\n=== Example Complete ===");
