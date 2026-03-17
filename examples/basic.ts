/**
 * Example: Basic usage with the production-ready functional and objective APIs.
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";

import { printTable } from "./shared/console.ts";

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
      printTable([...rows], { title: "Results:" });
    }
  } finally {
    functional.closeConnection(functionalConn);
  }
} finally {
  functional.closeDatabase(functionalDb);
}

console.log("=== Objective API ===\n");

const objectiveDb = new objective.Database();
try {
  const objectiveConn = await objectiveDb.connect();

  try {
    // Use queryResult for QueryResult features
    const result = objectiveConn.execute(
      "SELECT i, i * 2 AS doubled FROM range(5) t(i)",
    );
    const rows = [...result.objects()];
    result.close();
    printTable(rows, { title: "Results:" });
  } finally {
    objectiveConn.close();
  }
} finally {
  objectiveDb.close();
}
