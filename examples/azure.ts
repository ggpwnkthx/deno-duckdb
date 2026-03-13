/**
 * Example: Azure Blob Storage with the production-ready APIs.
 *
 * This version uses the actual NYC taxi parquet column names and aliases them
 * to stable snake_case names for display.
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import { Database } from "@ggpwnkthx/duckdb/objective";
import type { ConnectionHandle, ObjectRow } from "@ggpwnkthx/duckdb";

const AZURE_BLOB_URL =
  "az://azureopendatastorage.blob.core.windows.net/nyctlc/yellow/puYear=*/puMonth=1/*.parquet";

const SAMPLE_QUERY = `
SELECT
  vendorID AS vendor_id,
  tpepPickupDateTime AS pickup_datetime,
  tpepDropoffDateTime AS dropoff_datetime,
  passengerCount AS passenger_count,
  tripDistance AS trip_distance,
  puLocationId AS pickup_location_id
FROM read_parquet('${AZURE_BLOB_URL}')
LIMIT 10
`;

function execFunctional(connection: ConnectionHandle, sql: string): void {
  const result = functional.query(connection, sql);
  functional.destroyResult(result);
}

function printRows(rows: readonly ObjectRow[]): void {
  if (rows.length === 0) {
    console.log("No rows returned");
    return;
  }

  console.log("First 10 rows:");
  for (const row of rows) {
    console.log(
      `  vendor=${row.vendor_id} | ${row.pickup_datetime} -> ${row.dropoff_datetime} | passengers=${row.passenger_count} | distance=${row.trip_distance} | pickup_location=${row.pickup_location_id}`,
    );
  }
}

console.log("=== Functional API ===\n");

const functionalDb = await functional.open();
try {
  const functionalConn = await functional.create(functionalDb);

  try {
    console.log("Installing Azure extension...");
    execFunctional(functionalConn, "INSTALL azure");

    console.log("Loading Azure extension...");
    execFunctional(functionalConn, "LOAD azure");

    console.log("Configuring Azure for anonymous access...");
    execFunctional(functionalConn, "SET azure_storage_connection_string = ''");
    execFunctional(functionalConn, "SET azure_transport_option_type = 'curl'");

    console.log(`Querying: ${AZURE_BLOB_URL}`);
    const result = functional.query(functionalConn, SAMPLE_QUERY);

    try {
      const rows = functional.fetchObjects(result);
      console.log(`Result: ${rows.length} rows\n`);
      printRows(rows);
    } finally {
      functional.destroyResult(result);
    }
  } finally {
    functional.closeConnection(functionalConn);
  }
} finally {
  functional.closeDatabase(functionalDb);
}

console.log("\n=== Objective API ===\n");

const objectiveDb = new Database();
try {
  const objectiveConn = await objectiveDb.connect();

  try {
    console.log("Installing Azure extension...");
    let result = objectiveConn.query("INSTALL azure");
    result.close();

    console.log("Loading Azure extension...");
    result = objectiveConn.query("LOAD azure");
    result.close();

    console.log("Configuring Azure for anonymous access...");
    result = objectiveConn.query("SET azure_storage_connection_string = ''");
    result.close();

    result = objectiveConn.query("SET azure_transport_option_type = 'curl'");
    result.close();

    console.log(`Querying: ${AZURE_BLOB_URL}`);
    result = objectiveConn.query(SAMPLE_QUERY);

    try {
      const rows = result.toArrayOfObjects();
      console.log(`Result: ${rows.length} rows\n`);
      printRows(rows);
    } finally {
      result.close();
    }
  } finally {
    objectiveConn.close();
  }
} finally {
  objectiveDb.close();
}

console.log("\n=== Done! ===");
