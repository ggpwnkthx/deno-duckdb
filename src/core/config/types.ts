/**
 * Configuration option type definitions.
 *
 * Defines the types used in the DuckDB configuration schema.
 */

/** Boolean configuration option with default value. */
export interface BooleanConfigOption {
  type: "boolean";
  default: boolean;
}

/** String configuration option with specific allowed values (enum-like). */
export interface EnumConfigOption<T extends string> {
  type: "enum";
  values: readonly T[];
  default: T;
}

/** Integer configuration option with optional min/max bounds. */
export interface IntegerConfigOption {
  type: "integer";
  min?: number;
  max?: number;
  default: number;
}

/** Big integer configuration option (for large values like memory). */
export interface BigIntConfigOption {
  type: "bigint";
  default: string;
}

/** String configuration option (any string value). */
export interface StringConfigOption {
  type: "string";
  default: string;
}

/** String array configuration option. */
export interface StringArrayConfigOption {
  type: "string[]";
  default: readonly string[];
}
