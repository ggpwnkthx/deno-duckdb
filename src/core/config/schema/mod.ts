/**
 * DuckDB configuration schema exports.
 *
 * This module re-exports all configuration options from both global and local
 * schemas, merging them into a single `configSchema` for backward compatibility.
 */

import type {
  BigIntConfigOption,
  BooleanConfigOption,
  DoubleConfigOption,
  EnumConfigOption,
  IntegerConfigOption,
  StringArrayConfigOption,
  StringConfigOption,
} from "../types.ts";

import { globalConfigSchema } from "./global.ts";
import { localConfigSchema } from "./local.ts";

// Re-export global schema and types
export { globalConfigSchema };
export type { GlobalConfigOptionDefinition } from "./global.ts";

// Re-export local schema and types
export { localConfigSchema };
export type { LocalConfigOptionDefinition } from "./local.ts";

/**
 * Merged configuration schema combining both global and local options.
 *
 * This provides backward compatibility by merging globalConfigSchema and
 * localConfigSchema into a single object with all known DuckDB configuration
 * options.
 */
export const configSchema = {
  ...globalConfigSchema,
  ...localConfigSchema,
} as const;

/**
 * Maps a schema definition to its TypeScript value type.
 */
type SchemaValueType<T> = T extends { type: "boolean" } ? boolean
  : T extends { type: "enum"; values: readonly (infer V)[] } ? V | null
  : T extends { type: "integer" } ? number
  : T extends { type: "bigint" } ? bigint
  : T extends { type: "double" } ? number
  : T extends { type: "string" } ? string | null
  : T extends { type: "string[]" } ? readonly string[]
  : never;

/**
 * Maps an alias back to its primary config key
 */
type ConfigKey = keyof typeof configSchema & string;

type AliasToPrimaryKey<A extends string> = {
  [K in ConfigKey]: (typeof configSchema)[K] extends
    { aliases: readonly (infer AArr)[] } ? AArr extends string ? A extends AArr ? K
      : never
    : never
    : never;
}[ConfigKey];

/**
 * Extract all aliases as a union of strings
 */
type AllAliases = (typeof configSchema)[keyof typeof configSchema] extends
  { aliases: readonly (infer A)[] } ? A
  : never;

/**
 * Type-safe database configuration derived from DuckDB config schema.
 *
 * Provides autocomplete for all known config options with proper TypeScript types.
 * Only known configuration keys are allowed - typos will cause type errors.
 *
 * For database-open-time config, use DatabaseOpenConfig.
 * For session/connection-time config, use SessionConfig.
 */
export type DatabaseConfig =
  & {
    [K in ConfigKey]?: SchemaValueType<(typeof configSchema)[K]>;
  }
  & {
    [K in AllAliases]?: SchemaValueType<(typeof configSchema)[AliasToPrimaryKey<K>]>;
  };

/**
 * Type-safe configuration for database-open-time options (global config).
 *
 * These options are set when calling `duckdb_open_ext()` and affect the entire
 * database instance. Examples: access_mode, threads, max_memory, etc.
 *
 * Use this type for Database.open() and openDatabase() calls.
 */
type GlobalConfigKey = keyof typeof globalConfigSchema & string;

type GlobalAliasToPrimaryKey<A extends string> = {
  [K in GlobalConfigKey]: (typeof globalConfigSchema)[K] extends
    { aliases: readonly (infer AArr)[] } ? AArr extends string ? A extends AArr ? K
      : never
    : never
    : never;
}[GlobalConfigKey];

type GlobalAllAliases =
  (typeof globalConfigSchema)[keyof typeof globalConfigSchema] extends
    { aliases: readonly (infer A)[] } ? A
    : never;

export type DatabaseOpenConfig =
  & {
    [K in GlobalConfigKey]?: SchemaValueType<(typeof globalConfigSchema)[K]>;
  }
  & {
    [K in GlobalAllAliases]?: SchemaValueType<
      (typeof globalConfigSchema)[GlobalAliasToPrimaryKey<K>]
    >;
  };

/**
 * Type-safe configuration for session/connection-time options (local config).
 *
 * These options are set per-connection after the database is opened.
 * Examples: search_path, schema, enable_progress_bar, etc.
 *
 * Use this type for Connection.setConfig() calls.
 */
type LocalConfigKey = keyof typeof localConfigSchema & string;

export type SessionConfig = {
  [K in LocalConfigKey]?: SchemaValueType<(typeof localConfigSchema)[K]>;
};

/**
 * Type guard to check if a string is a known global config key.
 */
export function isKnownGlobalConfigKey(
  key: string,
): key is GlobalConfigKey {
  return key in globalConfigSchema;
}

/**
 * Type guard to check if a string is a known local (session) config key.
 */
export function isKnownLocalConfigKey(key: string): key is LocalConfigKey {
  return key in localConfigSchema;
}

/**
 * Get the definition for a global config key.
 */
export function getGlobalConfigDefinition(
  key: string,
): (typeof globalConfigSchema)[keyof typeof globalConfigSchema] | undefined {
  return globalConfigSchema[key as GlobalConfigKey];
}

/**
 * Get the definition for a local (session) config key.
 */
export function getLocalConfigDefinition(
  key: string,
): (typeof localConfigSchema)[keyof typeof localConfigSchema] | undefined {
  return localConfigSchema[key as LocalConfigKey];
}

/**
 * Type representing any configuration option definition from the schema.
 */
export type ConfigOptionDefinition =
  | BooleanConfigOption
  | EnumConfigOption<string>
  | IntegerConfigOption
  | BigIntConfigOption
  | DoubleConfigOption
  | StringConfigOption
  | StringArrayConfigOption;

/**
 * Known configuration option names derived from the schema.
 */
export type KnownConfigKey = keyof typeof configSchema & string;

/**
 * Type guard to check if a string is a known config key.
 */
export function isKnownConfigKey(key: string): key is KnownConfigKey {
  return key in configSchema;
}

/**
 * Get the definition for a config key.
 *
 * Resolves both primary keys and aliases to their definitions.
 */
export function getConfigDefinition(
  key: string,
): ConfigOptionDefinition | undefined {
  // Check primary key first
  if (key in configSchema) {
    return configSchema[key as KnownConfigKey];
  }

  // Check if key is an alias for any primary key
  for (const [, definition] of Object.entries(configSchema)) {
    const def = definition as ConfigOptionDefinition;
    if (def.aliases?.includes(key)) {
      return def;
    }
  }

  return undefined;
}
