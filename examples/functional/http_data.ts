/**
 * HTTP Data Example - Functional API
 *
 * This example demonstrates reading public CSV data directly from HTTP
 * using DuckDB's httpfs extension.
 *
 * The httpfs extension allows DuckDB to read files directly from HTTP/HTTPS
 * URLs without downloading them first.
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

console.log("=== HTTP Data Example (Functional API) ===\n");

// Step 1: Open database and create connection
console.log("Opening database...");
const db = await open();
console.log("Database opened\n");

const conn = await create(db);
console.log("Connection created\n");

// Step 2: Install and load the httpfs extension
console.log("--- Installing httpfs extension ---\n");

let result = execute(conn, "INSTALL httpfs;");
destroyResult(result);
console.log("httpfs extension installed");

result = execute(conn, "LOAD httpfs;");
destroyResult(result);
console.log("httpfs extension loaded\n");

// Step 3: Query public CSV data via HTTP
// Using a sample CSV with city population data
console.log("--- Querying public CSV via HTTP ---\n");

const csvUrl =
  "https://raw.githubusercontent.com/datasets/country-codes/main/data/country-codes.csv";

result = execute(
  conn,
  `SELECT * FROM read_csv_auto('${csvUrl}') LIMIT 10`,
);
const rows = await fetchAll(result);
destroyResult(result);

console.log(`Retrieved ${rows.length} rows from HTTP CSV\n`);
console.log("Sample data (first 10 countries:");
for (const row of rows) {
  console.log(`  ${row[0]}: ${row[1]} (${row[2]})`);
}

// Step 4: Query JSON data via HTTP using read_json_auto
console.log("\n--- Querying JSON via HTTP ---\n");

const jsonUrl =
  "https://raw.githubusercontent.com/vega/vega-datasets/next/data/cars.json";

result = execute(
  conn,
  `SELECT Origin, COUNT(*) as count FROM read_json_auto('${jsonUrl}') GROUP BY Origin ORDER BY count DESC`,
);
const jsonRows = await fetchAll(result);
destroyResult(result);

console.log("Cars by origin (from JSON via HTTP):");
for (const row of jsonRows) {
  console.log(`  ${row[0]}: ${row[1]} cars`);
}

// Clean up
closeConnection(conn);
closeDatabase(db);

console.log("\n=== Example Complete ===");
console.log("All resources cleaned up");
