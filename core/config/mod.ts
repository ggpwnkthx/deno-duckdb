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
 * Serialize a typed config value to its string form for the DuckDB C API.
 *
 * `null` and `undefined` are preserved (callers should typically skip these).
 * Booleans become `"true"`/`"false"`, bigints/numbers their decimal string,
 * arrays are comma-joined, and everything else is coerced via `String()`.
 *
 * @example
 * ```ts
 * serializeConfigValue(true);            // "true"
 * serializeConfigValue(4n);              // "4"
 * serializeConfigValue(["a", "b"]);      // "a,b"
 * serializeConfigValue(null);            // null
 * ```
 */
export function serializeConfigValue(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).join(",");
  }
  return String(value);
}

/**
 * Escape a string for use as a single-quoted SQL literal.
 *
 * Doules embedded single quotes (`'` → `''`) and wraps the value in single quotes.
 *
 * @example
 * ```ts
 * escapeSqlStringLiteral("hello");          // "'hello'"
 * escapeSqlStringLiteral("o'reilly");       // "'o''reilly'"
 * ```
 */
export function escapeSqlStringLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

/**
 * Resolve a config key (which may be an alias) to its primary key.
 *
 * Returns the input unchanged when it is already a primary key or unknown.
 */
export function resolveConfigAlias(name: string): string {
  if (isKnownGlobalConfigKey(name)) {
    return name;
  }
  const configDef = getGlobalConfigDefinition(name);
  if (!configDef) {
    return name;
  }
  for (const [primaryKey, def] of Object.entries(globalConfigSchema)) {
    const d = def as { aliases?: readonly string[] };
    if (d.aliases?.includes(name)) {
      return primaryKey;
    }
  }
  return name;
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
    const serialized = serializeConfigValue(rawValue);
    if (serialized === null) {
      continue;
    }

    const name = resolveConfigAlias(key);
    let value = serialized;

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
