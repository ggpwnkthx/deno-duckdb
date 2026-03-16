/**
 * Example: Basic usage with the production-ready functional and objective APIs.
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import { Database } from "@ggpwnkthx/duckdb/objective";
import type { ObjectRow } from "@ggpwnkthx/duckdb";

function printRows(title: string, rows: readonly ObjectRow[]): void {
  console.log(title);
  for (const row of rows) {
    console.log(`  ${row.i} * 2 = ${row.doubled}`);
  }
  console.log();
}

console.log("=== Functional API ===\n");

const functionalDb = await functional.open();
try {
  const functionalConn = await functional.create(functionalDb);

  try {
    // Use queryObjects for object format - returns iterator, use spread to get array
    const rows = functional.queryObjects(
      functionalConn,
      "SELECT i, i * 2 AS doubled FROM range(5) t(i)",
    );

    if (rows !== null) {
      printRows("Results:", [...rows]);
    }
  } finally {
    functional.closeConnection(functionalConn);
  }
} finally {
  functional.closeDatabase(functionalDb);
}

console.log("=== Objective API ===\n");

const objectiveDb = new Database();
try {
  const objectiveConn = await objectiveDb.connect();

  try {
    // Use queryResult for QueryResult features
    const result = objectiveConn.queryResult(
      "SELECT i, i * 2 AS doubled FROM range(5) t(i)",
    );
    const rows = [...result.toArrayOfObjects()];
    result.close();
    printRows("Results:", rows);
  } finally {
    objectiveConn.close();
  }
} finally {
  objectiveDb.close();
}

console.log("All done!");
