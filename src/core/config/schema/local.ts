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
  // === Profiling ===
  custom_profiling_settings: {
    type: "string",
    default: '{"metrics": "all"}',
  } as StringConfigOption,

  enable_http_logging: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  enable_profiling: {
    type: "enum",
    values: ["json", "query_tree", "query_tree_optimizer"] as const,
    default: null,
  } as EnumConfigOption<"json" | "query_tree" | "query_tree_optimizer">,

  enable_progress_bar_print: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  enable_progress_bar: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  errors_as_json: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  explain_output: {
    type: "enum",
    values: ["all", "optimized_only", "physical_only"] as const,
    default: "physical_only",
  } as EnumConfigOption<"all" | "optimized_only" | "physical_only">,

  file_search_path: {
    type: "string[]",
    default: [],
  } as StringArrayConfigOption,

  home_directory: {
    type: "string",
    default: "",
  } as StringConfigOption,

  http_logging_output: {
    type: "string",
    default: "",
  } as StringConfigOption,

  lambda_syntax: {
    type: "string",
    default: "DEFAULT",
  } as StringConfigOption,

  log_query_path: {
    type: "string",
    default: null,
  } as StringConfigOption,

  max_expression_depth: {
    type: "bigint",
    min: 1n,
    max: 10000n,
    default: 1000n,
  } as BigIntConfigOption,

  profile_output: {
    type: "string",
    default: "",
  } as StringConfigOption,

  profiling_coverage: {
    type: "enum",
    values: ["SELECT", "ALL"] as const,
    default: "SELECT",
  } as EnumConfigOption<"SELECT" | "ALL">,

  profiling_mode: {
    type: "enum",
    values: ["STANDARD", "DETAILED"] as const,
    default: null,
  } as EnumConfigOption<"STANDARD" | "DETAILED">,

  progress_bar_time: {
    type: "bigint",
    min: 0n,
    default: 2000n,
  } as BigIntConfigOption,

  schema: {
    type: "string",
    default: "main",
  } as StringConfigOption,

  search_path: {
    type: "string[]",
    default: [],
  } as StringArrayConfigOption,

  streaming_buffer_size: {
    type: "string",
    default: "976.5 KiB",
  } as StringConfigOption,
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
