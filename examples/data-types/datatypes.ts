/**
 * Example: Advanced DuckDB Datatypes
 *
 * This example demonstrates all advanced datatypes supported by the library:
 * - Integer types (TINYINT, SMALLINT, INTEGER, BIGINT, HUGEINT, unsigned variants)
 * - Floating point (FLOAT, DOUBLE)
 * - Temporal types (DATE, TIME, TIMESTAMP, INTERVAL)
 * - Binary (stored as hex string due to BLOB reading limitations)
 * - Special types (BOOLEAN, VARCHAR)
 *
 * Shows both Functional and Objective APIs to demonstrate API parity.
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import type { ObjectRow } from "@ggpwnkthx/duckdb";

import { printSection, printSubsection } from "../shared/console.ts";

// =============================================================================
// SQL Statements
// =============================================================================

const CREATE_DATATYPES_TABLE = `
CREATE TABLE datatypes (
  id INTEGER,
  -- Integer types
  tiny_col TINYINT,
  small_col SMALLINT,
  int_col INTEGER,
  big_col BIGINT,
  huge_col HUGEINT,
  utiny_col UTINYINT,
  usmall_col USMALLINT,
  uint_col UINTEGER,
  ubig_col UBIGINT,
  uhuge_col UHUGEINT,
  -- Floating point
  float_col FLOAT,
  double_col DOUBLE,
  -- Temporal types
  date_col DATE,
  time_col TIME,
  ts_col TIMESTAMP,
  interval_col INTERVAL,
  -- Binary (stored as hex string due to BLOB reading limitations)
  blob_hex_col VARCHAR,
  -- Special types
  bool_col BOOLEAN,
  varchar_col VARCHAR
);
`;

const INSERT_SAMPLE_DATA =
  "INSERT INTO datatypes VALUES (1, 127, 32767, 2147483647, 9223372036854775807, '170141183460469231731687303715884105727', 255, 65535, 4294967295, '18446744073709551615', '340282366920938463463374607431768211455', 3.14159, 3.141592653589793, '2024-03-15', '14:30:45', '2024-03-15 14:30:45.123456', INTERVAL '2 years 3 months 15 days 12:30:45', 'DEADBEEF', true, 'Sample text with special chars: hello world!')";

const QUERY_ALL = "SELECT * FROM datatypes ORDER BY id";

// =============================================================================
// Helper Functions
// =============================================================================

function formatInterval(value: unknown): string {
  if (value && typeof value === "object" && "months" in value) {
    const interval = value as { months: number; days: number; micros: number };
    return `{ months: ${interval.months}, days: ${interval.days}, micros: ${interval.micros} }`;
  }
  return String(value);
}

function printDatatypes(title: string, rows: readonly ObjectRow[]): void {
  printSection(title);

  for (const row of rows) {
    printSubsection("Integer Types");
    console.table({
      TINYINT: { value: row.tiny_col, type: typeof row.tiny_col },
      SMALLINT: { value: row.small_col, type: typeof row.small_col },
      INTEGER: { value: row.int_col, type: typeof row.int_col },
      BIGINT: { value: row.big_col, type: typeof row.big_col },
      HUGEINT: { value: row.huge_col, type: typeof row.huge_col },
      UTINYINT: { value: row.utiny_col, type: typeof row.utiny_col },
      USMALLINT: { value: row.usmall_col, type: typeof row.usmall_col },
      UINTEGER: { value: row.uint_col, type: typeof row.uint_col },
      UBIGINT: { value: row.ubig_col, type: typeof row.ubig_col },
      UHUGEINT: { value: row.uhuge_col, type: typeof row.uhuge_col },
    });

    printSubsection("Floating Point Types");
    console.table({
      FLOAT: { value: row.float_col, type: typeof row.float_col },
      DOUBLE: { value: row.double_col, type: typeof row.double_col },
    });

    printSubsection("Temporal Types");
    console.table({
      DATE: { value: row.date_col, type: typeof row.date_col },
      TIME: { value: row.time_col, type: typeof row.time_col },
      TIMESTAMP: { value: row.ts_col, type: typeof row.ts_col },
      INTERVAL: { value: formatInterval(row.interval_col), type: "object" },
    });

    printSubsection("Binary & String Types");
    console.table({
      "blob_hex (VARCHAR)": { value: row.blob_hex_col, type: typeof row.blob_hex_col },
      VARCHAR: { value: row.varchar_col, type: typeof row.varchar_col },
    });

    printSubsection("Boolean Types");
    console.table({
      BOOLEAN: { value: row.bool_col, type: typeof row.bool_col },
    });
  }
}

function execFunctional(
  connection: Parameters<typeof functional.query>[0],
  sql: string,
): void {
  const result = functional.query(connection, sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql.substring(0, 50)}...`);
  }
}

function execObjective(connection: objective.Connection, sql: string): void {
  const result = connection.query(sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql.substring(0, 50)}...`);
  }
}

function queryFunctionalObjects(
  connection: Parameters<typeof functional.query>[0],
  sql: string,
): ObjectRow[] {
  const result = functional.queryObjects(connection, sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql.substring(0, 50)}...`);
  }
  return [...result];
}

function queryObjectiveObjects(
  connection: objective.Connection,
  sql: string,
): ObjectRow[] {
  const result = connection.execute(sql);
  const rows = [...result.objects()];
  result.close();
  return rows;
}

// =============================================================================
// Main Example
// =============================================================================

printSection("DuckDB Advanced Datatypes Example");

// =============================================================================
// Functional API
// =============================================================================

console.log("=== Functional API ===\n");

const functionalDb = await functional.open();
try {
  const functionalConn = await functional.create(functionalDb);

  try {
    // Create table and insert data
    execFunctional(functionalConn, CREATE_DATATYPES_TABLE);
    execFunctional(functionalConn, INSERT_SAMPLE_DATA);

    console.log("Table created and sample data inserted.");

    // Query and display all datatypes
    const rows = queryFunctionalObjects(functionalConn, QUERY_ALL);
    printDatatypes("Query Results (Functional API)", rows);
  } finally {
    functional.closeConnection(functionalConn);
  }
} finally {
  functional.closeDatabase(functionalDb);
}

// =============================================================================
// Objective API
// =============================================================================

console.log("\n\n=== Objective API ===\n");

const objectiveDb = new objective.Database();
try {
  const objectiveConn = await objectiveDb.connect();

  try {
    // Create table and insert data
    execObjective(objectiveConn, CREATE_DATATYPES_TABLE);
    execObjective(objectiveConn, INSERT_SAMPLE_DATA);

    console.log("Table created and sample data inserted.");

    // Query and display all datatypes
    const rows = queryObjectiveObjects(objectiveConn, QUERY_ALL);
    printDatatypes("Query Results (Objective API)", rows);
  } finally {
    objectiveConn.close();
  }
} finally {
  objectiveDb.close();
}
