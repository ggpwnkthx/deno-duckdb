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
const intStmt = conn.prepare("SELECT 42 as num, -10 as neg, 0 as zero");
const intResult = intStmt.execute();
const intRows = intResult.fetchAll();
console.log("Values:", intRows[0]);
intResult.close();
intStmt.close();

// BIGINT
console.log("\n--- BIGINT ---");
const bigIntStmt = conn.prepare(
  "SELECT 9007199254740991::BIGINT as big_val",
);
const bigIntResult = bigIntStmt.execute();
const bigIntRows = bigIntResult.fetchAll();
console.log("Value:", bigIntRows[0]);
bigIntResult.close();
bigIntStmt.close();

// DOUBLE / FLOAT
console.log("\n--- DOUBLE ---");
const doubleStmt = conn.prepare(
  "SELECT 3.14159 as pi, 2.71828 as e, 1.23456789012345::DOUBLE as precise",
);
const doubleResult = doubleStmt.execute();
const doubleRows = doubleResult.fetchAll();
console.log("Values:", doubleRows[0]);
doubleResult.close();
doubleStmt.close();

// VARCHAR
console.log("\n--- VARCHAR ---");
const varcharStmt = conn.prepare(
  "SELECT 'Hello, World!' as greeting",
);
const varcharResult = varcharStmt.execute();
const varcharRows = varcharResult.fetchAll();
console.log("Value:", varcharRows[0]);
varcharResult.close();
varcharStmt.close();

// BOOLEAN
console.log("\n--- BOOLEAN ---");
const boolStmt = conn.prepare(
  "SELECT true as yes, false as no, 1 = 1 as is_one",
);
const boolResult = boolStmt.execute();
const boolRows = boolResult.fetchAll();
console.log("Values:", boolRows[0]);
boolResult.close();
boolStmt.close();

// DATE
console.log("\n--- DATE ---");
const dateStmt = conn.prepare(
  "SELECT '2024-01-15'::DATE as some_date, CURRENT_DATE as today",
);
const dateResult = dateStmt.execute();
const dateRows = dateResult.fetchAll();
console.log("Values:", dateRows[0]);
dateResult.close();
dateStmt.close();

// TIMESTAMP
console.log("\n--- TIMESTAMP ---");
const timestampStmt = conn.prepare(
  "SELECT '2024-01-15 10:30:00'::TIMESTAMP as ts, CURRENT_TIMESTAMP as now",
);
const timestampResult = timestampStmt.execute();
const timestampRows = timestampResult.fetchAll();
console.log("Values:", timestampRows[0]);
timestampResult.close();
timestampStmt.close();

// NULL handling
console.log("\n--- NULL ---");
const nullStmt = conn.prepare(
  "SELECT NULL as null_val, 42 as non_null",
);
const nullResult = nullStmt.execute();
const nullRows = nullResult.fetchAll();
console.log("Values:", nullRows[0]);
nullResult.close();
nullStmt.close();

// Parameter binding with different types
console.log("\n--- Parameter binding with types ---");
const paramStmt = conn.prepare(
  "SELECT $1::INTEGER + $2::DOUBLE as result",
);
paramStmt.bind([10, 5.5]);
const paramResult = paramStmt.execute();
const paramRows = paramResult.fetchAll();
console.log("10 + 5.5 =", paramRows[0][0]);
paramResult.close();
paramStmt.close();

// Clean up
conn.close();
db.close();

console.log("\n=== Example Complete ===");
