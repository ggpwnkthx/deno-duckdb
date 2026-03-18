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
export const localConfigSchema: Record<string, LocalConfigOptionDefinition> = {
  // === Profiling ===
  custom_profiling_settings: {
    type: "string",
    default: '{"metrics": "all"}',
  } satisfies StringConfigOption,

  enable_http_logging: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  enable_profiling: {
    type: "enum",
    values: ["json", "query_tree", "query_tree_optimizer"] as const,
    default: null,
  } satisfies EnumConfigOption<"json" | "query_tree" | "query_tree_optimizer">,

  enable_progress_bar_print: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  enable_progress_bar: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  errors_as_json: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  explain_output: {
    type: "enum",
    values: ["all", "optimized_only", "physical_only"] as const,
    default: "physical_only",
  } satisfies EnumConfigOption<"all" | "optimized_only" | "physical_only">,

  file_search_path: {
    type: "string[]",
    default: [],
  } satisfies StringArrayConfigOption,

  home_directory: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  http_logging_output: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  lambda_syntax: {
    type: "string",
    default: "DEFAULT",
  } satisfies StringConfigOption,

  log_query_path: {
    type: "string",
    default: null,
  } satisfies StringConfigOption,

  max_expression_depth: {
    type: "bigint",
    min: 1n,
    max: 10000n,
    default: 1000n,
  } satisfies BigIntConfigOption,

  profile_output: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  profiling_coverage: {
    type: "enum",
    values: ["SELECT", "ALL"] as const,
    default: "SELECT",
  } satisfies EnumConfigOption<"SELECT" | "ALL">,

  profiling_mode: {
    type: "enum",
    values: ["STANDARD", "DETAILED"] as const,
    default: null,
  } satisfies EnumConfigOption<"STANDARD" | "DETAILED">,

  progress_bar_time: {
    type: "bigint",
    min: 0n,
    default: 2000n,
  } satisfies BigIntConfigOption,

  schema: {
    type: "string",
    default: "main",
  } satisfies StringConfigOption,

  search_path: {
    type: "string[]",
    default: [],
  } satisfies StringArrayConfigOption,

  streaming_buffer_size: {
    type: "string",
    default: "976.5 KiB",
  } satisfies StringConfigOption,
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
