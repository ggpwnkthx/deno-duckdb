/**
 * Example: Functional API with Configuration
 *
 * This example demonstrates using the functional API with
 * database configuration options.
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import type { DatabaseConfig } from "@ggpwnkthx/duckdb";

import { printSection } from "../shared/console.ts";

printSection("Functional API with Configuration");

const config: DatabaseConfig = {
  access_mode: "READ_WRITE",
  threads: 2n,
};

const db = await functional.open(undefined, config);
try {
  const conn = await functional.connectToDatabase(db);
  try {
    functional.query(
      conn,
      "CREATE TABLE IF NOT EXISTS config_test (x INTEGER)",
    );
    functional.query(conn, "INSERT INTO config_test VALUES (10), (20), (30)");
    const result = functional.queryObjects(
      conn,
      "SELECT SUM(x) AS total FROM config_test",
    );
    if (result !== null) {
      const rows = [...result];
      console.log(`  Sum of 10 + 20 + 30 = ${rows[0]!.total}`);
    }
  } finally {
    functional.closeConnection(conn);
  }
} finally {
  functional.closeDatabase(db);
}
