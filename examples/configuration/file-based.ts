/**
 * Example: File-Based Database with Configuration
 *
 * This example demonstrates creating a persistent file-based
 * DuckDB database with custom configuration.
 */

import * as objective from "@ggpwnkthx/duckdb/objective";
import type { DatabaseConfig } from "@ggpwnkthx/duckdb";

import { printSection } from "../shared/console.ts";

printSection("File-Based Database with Configuration");

const filePath = "/tmp/duckdb_config_example.db";
const config: DatabaseConfig = {
  access_mode: "READ_WRITE",
  threads: 2n,
};

const db = new objective.Database(filePath, config);
try {
  const conn = await db.connect();
  try {
    // Create persistent table
    conn.query("CREATE TABLE IF NOT EXISTS persistent (x INTEGER, y VARCHAR)");
    conn.query(
      "INSERT INTO persistent VALUES (1, 'one'), (2, 'two'), (3, 'three')",
    );
    const result = conn.execute("SELECT * FROM persistent ORDER BY x");
    const rows = [...result.objects()];
    result.close();

    for (const row of rows) {
      console.log(`  x=${row.x}, y=${row.y}`);
    }
  } finally {
    conn.close();
  }
} finally {
  db.close();
}
