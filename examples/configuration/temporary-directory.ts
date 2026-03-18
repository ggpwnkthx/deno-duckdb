/**
 * Example: Custom Temporary Directory
 *
 * This example demonstrates configuring a custom temporary directory
 * for DuckDB's spill-to-disk operations.
 */

import * as objective from "@ggpwnkthx/duckdb/objective";
import type { DatabaseConfig } from "@ggpwnkthx/duckdb";

import { printSection } from "../shared/console.ts";

printSection("Custom Temporary Directory");

const config: DatabaseConfig = {
  // Set custom temporary directory for large operations
  temp_directory: "/tmp/duckdb_temp",
};

const db = new objective.Database(undefined, config);
try {
  const conn = await db.connect();
  try {
    // Large operations may spill to the temp directory
    conn.query(
      "CREATE TABLE large AS SELECT i, i * 2 AS doubled FROM range(100000) t(i)",
    );
    const result = conn.execute("SELECT COUNT(*) as count FROM large");
    const rows = [...result.objects()];
    result.close();

    const count = rows[0]!.count;
    console.log(
      `  Large table created with ${
        typeof count === "bigint" ? (count as bigint).toLocaleString() : count
      } rows`,
    );
  } finally {
    conn.close();
  }
} finally {
  db.close();
}
