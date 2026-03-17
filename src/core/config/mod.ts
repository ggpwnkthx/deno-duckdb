/**
 * Database config normalization.
 *
 * Handles user-friendly config options (like `accessMode`) and normalizes
 * them to DuckDB's expected naming convention (`access_mode`).
 * Uses the config schema for validation and type information.
 */

import type { DatabaseConfig } from "../../types.ts";
import {
  configSchema,
  isKnownConfigKey,
  type KnownConfigKey,
} from "./schema.ts";

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
 * Normalize a single config value based on its schema definition.
 */
function normalizeValue(key: KnownConfigKey, value: string): string {
  const definition = configSchema[key];
  const type = definition.type;

  if (type === "enum") {
    // Normalize enum values to uppercase for DuckDB
    const lower = value.toLowerCase();
    const matchingValue = definition.values.find((v) => v.toLowerCase() === lower);
    return matchingValue ? matchingValue.toUpperCase() : value.toUpperCase();
  }

  if (type === "boolean") {
    // Normalize boolean strings
    return value.toLowerCase() === "true" ? "true" : "false";
  }

  // For other types (integer, bigint, string, string[]), pass through as-is
  return value;
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

    const trimmedValue = String(rawValue).trim();
    if (trimmedValue === "") {
      continue;
    }

    let name = key;
    let value = trimmedValue;

    // Handle accessMode alias
    if (key === "accessMode") {
      name = "access_mode";
      const normalized = trimmedValue.toLowerCase();
      if (normalized === "read_only") {
        value = "READ_ONLY";
      } else if (normalized === "read_write") {
        value = "READ_WRITE";
      } else if (normalized === "automatic") {
        value = "AUTOMATIC";
      } else {
        value = trimmedValue.toUpperCase();
      }
      options.push({ name, value });
      continue;
    }

    // Use schema for known config keys
    if (isKnownConfigKey(key)) {
      value = normalizeValue(key, trimmedValue);
    }

    options.push({ name, value });
  }

  options.sort((left, right) => left.name.localeCompare(right.name));

  return { path, options };
}
