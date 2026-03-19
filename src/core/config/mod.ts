/**
 * Database config utilities.
 *
 * Provides functions to convert type-safe database config to FFI format.
 */

import type { DatabaseOpenConfig } from "./schema/mod.ts";
import { getConfigDefinition } from "./schema/mod.ts";
import {
  getGlobalConfigDefinition,
  globalConfigSchema,
  isKnownGlobalConfigKey,
} from "./schema/mod.ts";
import {
  validateDatabaseConfig as _validateDatabaseConfig,
  validateDatabaseOpenConfig as _validateDatabaseOpenConfig,
  validateSessionConfig as _validateSessionConfig,
} from "./validate.ts";

export type { DatabaseOpenConfig };
export { getConfigDefinition };
export { _validateDatabaseConfig as validateDatabaseConfig };
export { _validateDatabaseOpenConfig as validateDatabaseOpenConfig };
export { _validateSessionConfig as validateSessionConfig };

/** A configuration option for DuckDB FFI. */
export interface ConfigOption {
  /** Option name as expected by DuckDB. */
  name: string;
  /** Option value as string. */
  value: string;
}

/**
 * Convert a type-safe database config to FFI format.
 *
 * Since the config is now type-safe, this function handles:
 * - Converting values to strings for FFI
 * - Sorting options by name
 *
 * @param path - Optional database path (default: ":memory:")
 * @param config - Optional type-safe database configuration
 * @returns Path and array of config options for FFI
 *
 * @example
 * ```ts
 * const { path, options } = configToFFI("mydb.db", { access_mode: "READ_ONLY" });
 * // Result: { path: "mydb.db", options: [{ name: "access_mode", value: "READ_ONLY" }] }
 * ```
 */
export function configToFFI(
  path?: string,
  config?: DatabaseOpenConfig,
): { path: string; options: readonly ConfigOption[] } {
  // Handle path - default to :memory:
  let dbPath = ":memory:";
  if (path !== undefined && typeof path === "string") {
    const trimmed = path.trim();
    if (trimmed.length > 0) {
      dbPath = trimmed;
    }
  }

  const options: ConfigOption[] = [];

  if (!config) {
    return { path: dbPath, options };
  }

  for (const [key, rawValue] of Object.entries(config)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    let name = key;
    let value: string;

    // Convert value to string based on type
    if (typeof rawValue === "boolean") {
      value = rawValue ? "true" : "false";
    } else if (typeof rawValue === "bigint") {
      value = rawValue.toString();
    } else if (typeof rawValue === "number") {
      value = rawValue.toString();
    } else if (Array.isArray(rawValue)) {
      value = rawValue.join(",");
    } else {
      value = String(rawValue);
    }

    // Resolve alias keys to primary keys using getGlobalConfigDefinition
    if (!isKnownGlobalConfigKey(key)) {
      const configDef = getGlobalConfigDefinition(key);
      if (configDef) {
        // Find the primary key that has this alias
        for (const [primaryKey, def] of Object.entries(globalConfigSchema)) {
          const d = def as { aliases?: readonly string[] };
          if (d.aliases?.includes(key)) {
            name = primaryKey;
            break;
          }
        }
      }
    }

    // Normalize known config values
    if (isKnownGlobalConfigKey(name)) {
      const definition = globalConfigSchema[name];
      if (definition.type === "enum") {
        const lower = value.toLowerCase();
        const match = definition.values.find((v: string) => v.toLowerCase() === lower);
        value = match ?? value.toUpperCase();
      }
    }

    options.push({ name, value });
  }

  options.sort((left, right) => left.name.localeCompare(right.name));

  return { path: dbPath, options };
}
