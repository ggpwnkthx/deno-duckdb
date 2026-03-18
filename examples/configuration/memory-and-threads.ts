/**
 * Example: Memory and Threading Configuration
 *
 * This example demonstrates configuring DuckDB's memory usage and
 * parallel query execution settings.
 */

import * as objective from "@ggpwnkthx/duckdb/objective";
import type { DatabaseConfig } from "@ggpwnkthx/duckdb";

import { printSection } from "../shared/console.ts";

printSection("Memory and Threading Configuration");

const config: DatabaseConfig = {
  // Limit memory usage to 1GB (default is "80%")
  max_memory: "1GB",
  // Use 4 threads for parallel query execution (default: 0 = auto)
  threads: 4n,
  // Set checkpoint threshold to 256MB (default: "16.0 MiB")
  checkpoint_threshold: "256.0 MiB",
};

const db = new objective.Database(undefined, config);
try {
  const conn = await db.connect();
  try {
    // Create and populate a large dataset to see threading benefits
    conn.query("CREATE TABLE numbers AS SELECT i FROM range(1000000) t(i)");
    const result = conn.execute(
      "SELECT COUNT(*) as count, AVG(i) as avg FROM numbers",
    );
    const rows = [...result.objects()];
    result.close();

    const count = rows[0]!.count;
    const avg = rows[0]!.avg;
    console.log(
      `  Table has ${
        typeof count === "bigint" ? (count as bigint).toLocaleString() : count
      } rows`,
    );
    console.log(`  Average value: ${avg}`);
  } finally {
    conn.close();
  }
} finally {
  db.close();
}
