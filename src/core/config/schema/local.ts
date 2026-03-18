/**
 * DuckDB local (session) configuration options.
 *
 * These options apply to individual connections/sessions and control
 * query execution behavior, output formatting, and session-specific
 * settings that can change during a session.
 *
 * See: https://duckdb.org/docs/sql/configuration.html#session-configuration
 */

import type {
  BigIntConfigOption,
  BooleanConfigOption,
  EnumConfigOption,
  StringArrayConfigOption,
  StringConfigOption,
} from "../types.ts";

/**
 * Local (session) configuration options that apply to individual connections.
 *
 * These settings control session-specific behavior including search paths,
 * profiling, progress output, error formatting, and other per-connection
 * configuration options.
 */
export const localConfigSchema = {
  // === Search Paths ===
  home_directory: {
    type: "string",
    default: "",
  } as StringConfigOption,

  file_search_path: {
    type: "string[]",
    default: [],
  } as StringArrayConfigOption,

  search_path: {
    type: "string[]",
    default: [],
  } as StringArrayConfigOption,

  schema: {
    type: "string",
    default: "main",
  } as StringConfigOption,

  // === Expression Depth ===
  max_expression_depth: {
    type: "bigint",
    min: 1n,
    max: 10000n,
    default: 1000n,
  } as BigIntConfigOption,

  // === Profiling ===
  enable_profiling: {
    type: "enum",
    values: ["json", "query_tree", "query_tree_optimizer"] as const,
    default: null,
  }  as EnumConfigOption<"json" | "query_tree" | "query_tree_optimizer">,

  custom_profiling_settings: {
    type: "string",
    default: "",
  } as StringConfigOption,

  profiling_output: {
    type: "string",
    default: "",
    aliases: ["profile_output"],
  } as StringConfigOption,

  profiling_mode: {
    type: "enum",
    values: ["STANDARD", "DETAILED"] as const,
    default: null,
  }  as EnumConfigOption<"STANDARD" | "DETAILED">,

  profiling_coverage: {
    type: "enum",
    values: ["SELECT", "ALL"] as const,
    default: "SELECT",
  } as EnumConfigOption<"SELECT" | "ALL">,

  // === Progress Bar ===
  enable_progress_bar: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  enable_progress_bar_print: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  progress_bar_time: {
    type: "bigint",
    min: 0n,
    default: 2000n,
  } as BigIntConfigOption,

  // === Explain Output ===
  explain_output: {
    type: "enum",
    values: ["ALL", "OPTIMIZED_ONLY", "PHYSICAL_ONLY"] as const,
    default: "PHYSICAL_ONLY",
  } as EnumConfigOption<"ALL" | "OPTIMIZED_ONLY" | "PHYSICAL_ONLY">,

  // === Error Handling ===
  errors_as_json: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Streaming ===
  streaming_buffer_size: {
    type: "string",
    default: "976.5 KiB",
  } as StringConfigOption,

  // === Lambda Syntax ===
  lambda_syntax: {
    type: "string",
    default: "DEFAULT",
  } as StringConfigOption,

  // === Query Logging ===
  log_query_path: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === HTTP Logging ===
  enable_http_logging: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  http_logging_output: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === DuckDB API ===
  duckdb_api: {
    type: "string",
    default: "cli",
  } as StringConfigOption,

  // === Authentication ===
  password: {
    type: "string",
    default: null,
  }  as StringConfigOption,

  user: {
    type: "string",
    default: null,
    aliases: ["username"],
  }  as StringConfigOption,
} as const;

// Re-export types for external use
export type {
  BigIntConfigOption,
  BooleanConfigOption,
  EnumConfigOption,
  StringArrayConfigOption,
  StringConfigOption,
} from "../types.ts";

/**
 * Type for any local config option definition.
 */
export type LocalConfigOptionDefinition =
  | BooleanConfigOption
  | EnumConfigOption<string>
  | BigIntConfigOption
  | StringConfigOption
  | StringArrayConfigOption;
