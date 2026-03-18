/**
 * Configuration option type definitions.
 *
 * Defines the types used in the DuckDB configuration schema.
 */

/** Base configuration option with common properties */
export interface ConfigOption {
  type: string;
  aliases?: readonly string[];
}

/** Boolean configuration option with default value. */
export interface BooleanConfigOption extends ConfigOption {
  type: "boolean";
  default: boolean;
}

/** String configuration option with specific allowed values (enum-like). */
export interface EnumConfigOption<T extends string> extends ConfigOption {
  type: "enum";
  values: readonly T[];
  default: T | null;
}

/** Integer configuration option with optional min/max bounds. */
export interface IntegerConfigOption extends ConfigOption {
  type: "integer";
  min?: number;
  max?: number;
  default: number;
}

/** Big integer configuration option (for large values like memory). */
export interface BigIntConfigOption extends ConfigOption {
  type: "bigint";
  min?: bigint;
  max?: bigint;
  default: bigint;
}

/** Double (floating point) configuration option. */
export interface DoubleConfigOption extends ConfigOption {
  type: "double";
  min?: number;
  max?: number;
  default: number;
}

/** String configuration option (any string value). */
export interface StringConfigOption extends ConfigOption {
  type: "string";
  default: string | null;
}

/** String array configuration option. */
export interface StringArrayConfigOption extends ConfigOption {
  type: "string[]";
  default: readonly string[];
}
