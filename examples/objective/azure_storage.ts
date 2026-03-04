/**
 * Azure Storage Example - Objective API
 *
 * This example demonstrates reading public data from Azure Blob Storage
 * using DuckDB's azure extension with the az:// protocol.
 *
 * The azure extension provides native access to Azure Blob Storage using the
 * az:// protocol. For public datasets (like Azure Open Datasets), you can
 * access them without credentials by enabling anonymous access.
 */

import { Database } from "@ggpwnkthx/duckdb/objective";

console.log("=== Azure Storage Example (Objective API) ===\n");

// Step 1: Create database and connection
console.log("Opening database...");
const db = new Database();
await db.open();
console.log("Database opened\n");

const conn = await db.connect();
console.log("Connection created\n");

// Step 2: Install and load the azure extension
// The azure extension provides native Azure Blob Storage support
console.log("--- Installing azure extension ---\n");

let result = await conn.query("INSTALL azure;");
await result.close();
console.log("azure extension installed");

result = await conn.query("LOAD azure;");
await result.close();
console.log("azure extension loaded\n");

// Step 3: Configure anonymous access for public Azure blobs
// Azure Open Datasets are publicly accessible without credentials
console.log("--- Configuring anonymous access for public data ---\n");

result = await conn.query(
  "SET azure_storage_connection_string = '';",
);
await result.close();
result = await conn.query(
  "SET azure_transport_option_type = 'curl';",
);
await result.close();

console.log("Anonymous access configured for public Azure blobs\n");

// Step 4: Query public data from Azure Blob Storage using az:// protocol
// Using Azure Open Datasets - NYC Yellow Taxi data
console.log("--- Querying public data from Azure Blob Storage ---\n");

// Azure Blob Storage URL using az:// protocol for NYC Yellow Taxi data
// Format: az://<storage-account>.blob.core.windows.net/<container>/<path>
const azureUrl =
  "az://azureopendatastorage.blob.core.windows.net/nyctlc/yellow/puYear=*/puMonth=*/*.parquet";

try {
  result = await conn.query(
    `SELECT passengerCount, tripDistance, totalAmount
     FROM read_parquet('${azureUrl}')
     WHERE passengerCount IS NOT NULL
     LIMIT 10`,
  );
  const rows = await result.fetchAll();
  await result.close();

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
await conn.close();
await db.close();

console.log("\n=== Example Complete ===");
console.log("All resources cleaned up");
