/**
 * Example: Configuration Types Overview
 *
 * This example shows the different types of configuration options
 * available in DuckDB and their usage.
 */

import type { DatabaseConfig } from "@ggpwnkthx/duckdb";

import { printSection } from "../shared/console.ts";

printSection("Configuration Types Overview");

// Type-only example - just showing types, no database needed
const _exampleConfigs: DatabaseConfig[] = [
  // Boolean options
  { enable_logging: false },
  { disable_database_invalidation: false },

  // Integer options
  { perfect_ht_threshold: 12 },

  // Bigint options
  { threads: 4n },
  { max_memory: "1GB" },
  { http_retries: 3n },

  // Double options
  { index_scan_percentage: 0.001 },
  { http_retry_backoff: 4 },

  // String options
  { temp_directory: "/tmp/duckdb" },
  { checkpoint_threshold: "256.0 MiB" },
  { timezone: "UTC" },

  // Enum options
  { access_mode: "READ_ONLY" },
  { default_order: "DESC" },
  { logging_level: "INFO" },

  // String array options
  { allowed_directories: ["/tmp", "/var/data"] },
  { search_path: ["main", "schema1"] },
];

console.log("\n=== Boolean Options ===");
console.log("  enable_logging: false");
console.log("  disable_database_invalidation: false");
console.log("  Pattern: enable_*, disable_*");

console.log("\n=== Integer Options ===");
console.log("  perfect_ht_threshold: 12 (min: 0, max: 2147483647)");
console.log("  max_expression_depth: 1000 (min: 1, max: 10000)");

console.log("\n=== Bigint Options ===");
console.log("  threads: 4n (min: 0n, max: 256n)");
console.log("  max_memory: '1GB' (string format for memory)");
console.log("  http_retries: 3n (min: 0n)");

console.log("\n=== Double Options ===");
console.log("  index_scan_percentage: 0.001 (min: 0, max: 100)");
console.log("  http_retry_backoff: 4 (default: 4)");

console.log("\n=== String Options ===");
console.log("  temp_directory: '/tmp/duckdb'");
console.log("  checkpoint_threshold: '256.0 MiB'");
console.log("  timezone: 'UTC'");

console.log("\n=== Enum Options ===");
console.log("  access_mode: 'READ_ONLY' (AUTOMATIC, READ_ONLY, READ_WRITE)");
console.log("  default_order: 'DESC' (ASCENDING, DESCENDING)");
console.log("  logging_level: 'INFO' (DEBUG, INFO, WARNING, ERROR)");
console.log("  Note: Enum values are case-insensitive");

console.log("\n=== String Array Options ===");
console.log("  allowed_directories: ['/tmp', '/var/data']");
console.log("  search_path: ['main', 'schema1']");

console.log("\n=== Config Aliases ===");
console.log("  Some options have aliases for convenience:");
console.log("  - accessMode → access_mode");
console.log("  - worker_threads → threads");
console.log("  - memory_limit → max_memory");
console.log("  - null_order → default_null_order");
console.log("  - wal_autocheckpoint → checkpoint_threshold");
