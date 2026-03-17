/**
 * Database config normalization.
 *
 * Handles user-friendly config options (like `accessMode`) and normalizes
 * them to DuckDB's expected naming convention (`access_mode`).
 */

import type { DatabaseConfig } from "../types.ts";

/** A normalized configuration option for DuckDB. */
export interface NormalizedOption {
  /** Option name as expected by DuckDB. */
  name: string;
  /** Normalized option value. */
  value: string;
}

/** Fully normalized database configuration. */
export interface NormalizedDatabaseConfig {
  /** Database file path or ":memory:" for in-memory. */
  path: string;
  /** Sorted array of normalized options. */
  options: readonly NormalizedOption[];
}

/**
 * Normalize a user-provided database config for FFI calls.
 *
 * Converts ergonomic field names like `accessMode` to DuckDB's expected
 * names (`access_mode`). Also normalizes values (e.g., "read_only" -> "READ_ONLY").
 *
 * @param config - Optional user-provided database configuration
 * @returns Normalized config ready for FFI calls
 *
 * @example
 * ```ts
 * const normalized = normalizeDatabaseConfig({ path: "mydb.db", accessMode: "read_only" });
 * // Result: { path: "mydb.db", options: [{ name: "access_mode", value: "READ_ONLY" }] }
 * ```
 */
export function normalizeDatabaseConfig(
  config?: DatabaseConfig,
): NormalizedDatabaseConfig {
  const trimmedPath = config?.path?.trim();
  const path = trimmedPath && trimmedPath.length > 0 ? trimmedPath : ":memory:";
  const options: NormalizedOption[] = [];

  if (!config) {
    return { path, options };
  }

  for (const [key, rawValue] of Object.entries(config)) {
    if (key === "path" || rawValue === undefined) {
      continue;
    }

    const trimmedValue = rawValue.trim();
    if (trimmedValue === "") {
      continue;
    }

    let name = key;
    let value = trimmedValue;

    if (key === "accessMode") {
      name = "access_mode";
      const normalized = trimmedValue.toLowerCase();
      if (normalized === "read_only") {
        value = "READ_ONLY";
      } else if (normalized === "read_write") {
        value = "READ_WRITE";
      } else {
        value = trimmedValue.toUpperCase();
      }
    }

    options.push({ name, value });
  }

  options.sort((left, right) => left.name.localeCompare(right.name));

  return { path, options };
}
