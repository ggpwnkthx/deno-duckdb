/**
 * Azure Storage Example - Functional API
 *
 * This example demonstrates reading public data from Azure Blob Storage
 * using DuckDB's azure extension with the az:// protocol.
 *
 * The azure extension provides native access to Azure Blob Storage using the
 * az:// protocol. For public datasets (like Azure Open Datasets), you can
 * access them without credentials by enabling anonymous access.
 */

import {
  closeConnection,
  closeDatabase,
  create,
  destroyResult,
  execute,
  fetchAll,
  open,
} from "@ggpwnkthx/duckdb/functional";

console.log("=== Azure Storage Example (Functional API) ===\n");

// Step 1: Open database and create connection
console.log("Opening database...");
const db = await open();
console.log("Database opened\n");

const conn = await create(db);
console.log("Connection created\n");

// Step 2: Install and load the azure extension
// The azure extension provides native Azure Blob Storage support
console.log("--- Installing azure extension ---\n");

let result = await execute(conn, "INSTALL azure;");
await destroyResult(result);
console.log("azure extension installed");

result = await execute(conn, "LOAD azure;");
await destroyResult(result);
console.log("azure extension loaded\n");

// Step 3: Configure anonymous access for public Azure blobs
// Azure Open Datasets are publicly accessible without credentials
console.log("--- Configuring anonymous access for public data ---\n");

result = await execute(
  conn,
  "SET azure_storage_connection_string = '';",
);
await destroyResult(result);
result = await execute(
  conn,
  "SET azure_transport_option_type = 'curl';",
);
await destroyResult(result);
console.log("Anonymous access configured for public Azure blobs\n");

// Step 4: Query public data from Azure Blob Storage using az:// protocol
// Using Azure Open Datasets - NYC Yellow Taxi data
console.log("--- Querying public data from Azure Blob Storage ---\n");

// Azure Blob Storage URL using az:// protocol for NYC Yellow Taxi data
// Format: az://<storage-account>.blob.core.windows.net/<container>/<path>
const azureUrl =
  "az://azureopendatastorage.blob.core.windows.net/nyctlc/yellow/puYear=*/puMonth=1/*.parquet";

try {
  result = await execute(
    conn,
    `SELECT passengerCount, tripDistance, totalAmount
     FROM read_parquet('${azureUrl}')
     WHERE passengerCount IS NOT NULL
     LIMIT 10`,
  );
  const rows = await fetchAll(result);
  await destroyResult(result);

  console.log(`Retrieved ${rows.length} rows from Azure Blob Storage`);
  console.log("Sample data (NYC Yellow Taxi):");
  console.log("  Passenger Count | Trip Distance | Total Amount");
  console.log("  ----------------|--------------|-------------");
  for (const row of rows) {
    const tripDist = row[1] != null ? Number(row[1]).toFixed(2) : "N/A";
    const totalAmt = row[2] != null ? Number(row[2]).toFixed(2) : "N/A";
    console.log(
      `  ${String(row[0]).padStart(15)} | ${
        String(tripDist).padStart(13)
      } | $${totalAmt}`,
    );
  }
} catch (error) {
  console.error(error);
  console.log(
    "Note: Azure Blob Storage query failed (the specific file may not exist)",
  );
  console.log(
    "This example demonstrates the correct az:// protocol syntax:",
  );
  console.log(`  ${azureUrl}`);
  console.log("\nFor public Azure Open Datasets, use the az:// protocol:");
  console.log(
    "  az://azureopendatastorage.blob.core.windows.net/nyctlc/yellow/...",
  );
}

// Clean up
await closeConnection(conn);
await closeDatabase(db);

console.log("\n=== Example Complete ===");
console.log("All resources cleaned up");
