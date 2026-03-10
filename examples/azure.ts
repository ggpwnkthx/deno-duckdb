/**
 * Example: Azure Blob Storage
 *
 * This example demonstrates accessing data from Azure Blob Storage
 * using DuckDB's Azure extension.
 *
 * The example queries NYC Yellow Taxi data from a public Azure blob
 * using anonymous access (no credentials required).
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

import { Database } from "@ggpwnkthx/duckdb/objective";

// Azure blob URL for NYC Yellow Taxi data (public access)
const AZURE_BLOB_URL =
  "az://azureopendatastorage.blob.core.windows.net/nyctlc/yellow/puYear=*/puMonth=1/*.parquet";

console.log("=== Functional API ===\n");

// Functional API: Pure functions with explicit state management
console.log("Opening database...");
const db = await open();
console.log("Database opened");

const conn = await create(db);
console.log("Connection created");

// Install and load the Azure extension
console.log("Installing Azure extension...");
execute(conn, "INSTALL azure");
console.log("Azure extension installed");

console.log("Loading Azure extension...");
execute(conn, "LOAD azure");
console.log("Azure extension loaded");

// Configure for anonymous access to public blobs
console.log("Configuring Azure for anonymous access...");
execute(
  conn,
  "SET azure_storage_connection_string = ''",
);
execute(conn, "SET azure_transport_option_type = 'curl'");
console.log("Azure configured for anonymous access");

// Query NYC Yellow Taxi data from Azure
console.log(`Querying: ${AZURE_BLOB_URL}`);
const resultHandle = execute(
  conn,
  `SELECT * FROM read_parquet('${AZURE_BLOB_URL}') LIMIT 10`,
);
console.log("Query executed");

const rows = fetchAll(resultHandle);
console.log(`Result: ${rows.length} rows`);

console.log("\nFirst 10 rows (sample columns):");
for (const row of rows) {
  // Parquet columns: vendor_id, pickup_datetime, dropoff_datetime, etc.
  console.log(
    `  ${row[0]} | ${row[1]} -> ${row[2]} | passenger_count: ${row[3]}`,
  );
}

// Clean up - must manually destroy handles
destroyResult(resultHandle);
closeConnection(conn);
closeDatabase(db);

console.log("All resources cleaned up\n");

console.log("=== Objective API ===\n");

// Objective API: Classes with automatic resource management
console.log("Opening database...");
const db2 = new Database();
await db2.open();
console.log("Database opened");

const conn2 = await db2.connect();
console.log("Connection created");

// Install and load the Azure extension
console.log("Installing Azure extension...");
conn2.query("INSTALL azure");
console.log("Azure extension installed");

console.log("Loading Azure extension...");
conn2.query("LOAD azure");
console.log("Azure extension loaded");

// Configure for anonymous access to public blobs
console.log("Configuring Azure for anonymous access...");
conn2.query("SET azure_storage_connection_string = ''");
conn2.query("SET azure_transport_option_type = 'curl'");
console.log("Azure configured for anonymous access");

// Query NYC Yellow Taxi data from Azure
console.log(`Querying: ${AZURE_BLOB_URL}`);
const result2 = conn2.query(
  `SELECT * FROM read_parquet('${AZURE_BLOB_URL}') LIMIT 10`,
);
console.log("Query executed");

const rows2 = result2.fetchAll();
console.log(`Result: ${rows2.length} rows`);

console.log("\nFirst 10 rows (sample columns):");
for (const row of rows2) {
  console.log(
    `  ${row[0]} | ${row[1]} -> ${row[2]} | passenger_count: ${row[3]}`,
  );
}

// Clean up - manually close in reverse order
result2.close();
conn2.close();
db2.close();

console.log("All resources cleaned up\n");

console.log("=== Done! ===");
