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
  : T extends { type: "enum"; values: readonly (infer V)[] } ? V
  : T extends { type: "integer" } ? number
  : T extends { type: "bigint" } ? bigint
  : T extends { type: "double" } ? number
  : T extends { type: "string" } ? string
  : T extends { type: "string[]" } ? readonly string[]
  : never;

/**
 * Type-safe database configuration derived from DuckDB config schema.
 *
 * Provides autocomplete for all known config options with proper TypeScript types.
 */
export type DatabaseConfig =
  & {
    [K in keyof typeof configSchema as K extends string ? K : never]?: SchemaValueType<
      (typeof configSchema)[K]
    >;
  }
  & {
    /** Allow unknown keys for extensibility */
    readonly [key: string]: unknown;
  };

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
export type KnownConfigKey = keyof typeof configSchema;

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
    if (definition.aliases?.includes(key)) {
      return definition;
    }
  }

  return undefined;
}
