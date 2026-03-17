/**
 * Example: Azure Blob Storage with the production-ready APIs.
 *
 * This version uses the actual NYC taxi parquet column names and aliases them
 * to stable snake_case names for display.
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import type { ConnectionHandle } from "@ggpwnkthx/duckdb";
import {
  AZURE_BLOB_URL,
  INSTALL_AZURE,
  LOAD_AZURE,
  SAMPLE_QUERY,
  SET_AZURE_CONNECTION_STRING,
  SET_AZURE_TRANSPORT_TYPE,
} from "./sql/azure.ts";

import { printTable } from "./shared/console.ts";

function execFunctional(connection: ConnectionHandle, sql: string): void {
  // Use cached query - returns null on success for DDL, but side effects happen
  const result = functional.query(connection, sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql}`);
  }
  // Consume the iterator to ensure DDL side effects are applied
  [...result];
}

console.log("=== Functional API ===\n");

const functionalDb = await functional.open();
try {
  const functionalConn = await functional.create(functionalDb);

  try {
    console.log("Installing Azure extension...");
    execFunctional(functionalConn, INSTALL_AZURE);

    console.log("Loading Azure extension...");
    execFunctional(functionalConn, LOAD_AZURE);

    console.log("Configuring Azure for anonymous access...");
    execFunctional(functionalConn, SET_AZURE_CONNECTION_STRING);
    execFunctional(functionalConn, SET_AZURE_TRANSPORT_TYPE);

    console.log(`Querying: ${AZURE_BLOB_URL}`);
    // Use queryObjects for object format - returns iterator, convert to array
    const objects = functional.queryObjects(functionalConn, SAMPLE_QUERY);

    if (objects === null) {
      console.log("Query failed");
    } else {
      const objectArray = [...objects];
      console.log(`Result: ${objectArray.length} rows\n`);
      printTable(objectArray, { title: "First 10 rows:", limit: 10 });
    }
  } finally {
    functional.closeConnection(functionalConn);
  }
} finally {
  functional.closeDatabase(functionalDb);
}

console.log("\n=== Objective API ===\n");

const objectiveDb = new objective.Database();
try {
  const objectiveConn = await objectiveDb.connect();

  try {
    console.log("Installing Azure extension...");
    // DDL returns null from cached query - just execute it
    objectiveConn.query(INSTALL_AZURE);

    console.log("Loading Azure extension...");
    objectiveConn.query(LOAD_AZURE);

    console.log("Configuring Azure for anonymous access...");
    objectiveConn.query(SET_AZURE_CONNECTION_STRING);
    objectiveConn.query(SET_AZURE_TRANSPORT_TYPE);

    console.log(`Querying: ${AZURE_BLOB_URL}`);
    // Use queryResult for QueryResult features
    const result = objectiveConn.execute(SAMPLE_QUERY);

    try {
      const rows = [...result.objects()];
      console.log(`Result: ${rows.length} rows\n`);
      printTable(rows, { title: "First 10 rows:", limit: 10 });
    } finally {
      result.close();
    }
  } finally {
    objectiveConn.close();
  }
} finally {
  objectiveDb.close();
}
