/**
 * DuckDB configuration schema with type-safe definitions.
 *
 * Defines all known DuckDB configuration options with their types, allowed values,
 * and defaults. This provides compile-time type safety while maintaining backward
 * compatibility for unknown options.
 */

import type {
  BigIntConfigOption,
  BooleanConfigOption,
  EnumConfigOption,
  IntegerConfigOption,
  StringArrayConfigOption,
  StringConfigOption,
} from "./types.ts";

/**
 * DuckDB configuration option definitions.
 *
 * This map contains all known DuckDB configuration options with their type
 * definitions. Each option has a type (boolean, enum, integer, bigint, string,
 * or string[]) and metadata about allowed values and defaults.
 *
 * Based on DuckDB's configuration system with 141+ settings.
 */
export const configSchema: Record<string, ConfigOptionDefinition> = {
  // === Database Access & Security ===
  access_mode: {
    type: "enum",
    values: ["AUTOMATIC", "READ_ONLY", "READ_WRITE"] as const,
    default: "AUTOMATIC",
  } as EnumConfigOption<"AUTOMATIC" | "READ_ONLY" | "READ_WRITE">,

  allow_community_extensions: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  allow_extensions_metadata_mismatch: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  allow_persistent_secrets: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  allow_unredacted_secrets: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  allow_unsigned_extensions: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  enable_external_access: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  enable_fsst_vectors: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Memory & Performance ===
  max_memory: {
    type: "bigint",
    default: "80%",
  } as BigIntConfigOption,

  memory_limit: {
    type: "bigint",
    default: "80%",
  } as BigIntConfigOption,

  threads: {
    type: "integer",
    min: 0,
    max: 256,
    default: 0, // 0 means "all available"
  } as IntegerConfigOption,

  max_threads: {
    type: "integer",
    min: 0,
    max: 256,
    default: 0,
  } as IntegerConfigOption,

  worker_threads: {
    type: "integer",
    min: 0,
    max: 256,
    default: 0,
  } as IntegerConfigOption,

  external_threads: {
    type: "integer",
    min: 0,
    max: 256,
    default: 0,
  } as IntegerConfigOption,

  allocator_background_threads: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  allocator_flush_threshold: {
    type: "bigint",
    default: "128MB",
  } as BigIntConfigOption,

  allocator_bulk_deallocation_flush_threshold: {
    type: "bigint",
    default: "1GB",
  } as BigIntConfigOption,

  // === Storage & I/O ===
  checkpoint_threshold: {
    type: "bigint",
    default: "16MB",
  } as BigIntConfigOption,

  checkpoint_wal_size: {
    type: "bigint",
    default: "16MB",
  } as BigIntConfigOption,

  default_block_size: {
    type: "integer",
    min: 0,
    max: 65536,
    default: 262144,
  } as IntegerConfigOption,

  use_direct_io: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  use_temporary_directory: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  temp_directory: {
    type: "string",
    default: "",
  } as StringConfigOption,

  temp_file_encryption: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  trim_free_blocks: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  storage_compatibility_version: {
    type: "string",
    default: "latest",
  } as StringConfigOption,

  // === File Paths ===
  allowed_directories: {
    type: "string[]",
    default: [],
  } as StringArrayConfigOption,

  allowed_paths: {
    type: "string[]",
    default: [],
  } as StringArrayConfigOption,

  extension_directory: {
    type: "string",
    default: "",
  } as StringConfigOption,

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
    default: ["~"],
  } as StringArrayConfigOption,

  // === Query Execution ===
  default_collation: {
    type: "string",
    default: "nocase",
  } as StringConfigOption,

  default_null_order: {
    type: "enum",
    // These are case-insensitive in DuckDB
    values: ["NULLS_FIRST", "NULLS_LAST", "nulls_first", "nulls_last"] as const,
    default: "nulls_first",
  } as EnumConfigOption<"NULLS_FIRST" | "NULLS_LAST" | "nulls_first" | "nulls_last">,

  default_order: {
    type: "enum",
    values: ["ASC", "DESC", "asc", "desc"] as const,
    default: "asc",
  } as EnumConfigOption<"ASC" | "DESC" | "asc" | "desc">,

  default_secret_directory: {
    type: "string",
    default: "",
  } as StringConfigOption,

  secret_directory: {
    type: "string",
    default: "",
  } as StringConfigOption,

  max_expression_depth: {
    type: "integer",
    min: 1,
    max: 10000,
    default: 1000,
  } as IntegerConfigOption,

  max_execution_time: {
    type: "integer",
    min: 0,
    // No practical max
    default: 0,
  } as IntegerConfigOption,

  // === Extensions ===
  load_extensions: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  autoinstall_extension_repository: {
    type: "string",
    default: "",
  } as StringConfigOption,

  autoinstall_known_extensions: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  autoload_known_extensions: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  custom_extension_repository: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Profiling & Debugging ===
  enable_profiling: {
    type: "enum",
    values: ["json", "query", "all"] as const,
    default: "json",
  } as EnumConfigOption<"json" | "query" | "all">,

  custom_profiling_settings: {
    type: "string",
    default: "",
  } as StringConfigOption,

  explain_output: {
    type: "enum",
    values: ["all", "optimized_only", "physical_only"] as const,
    default: "all",
  } as EnumConfigOption<"all" | "optimized_only" | "physical_only">,

  enable_progress_bar: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  enable_progress_bar_print: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  progress_bar_time: {
    type: "integer",
    min: 0,
    default: 2000,
  } as IntegerConfigOption,

  enable_logging: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  logging_level: {
    type: "enum",
    values: ["debug", "info", "warning", "error"] as const,
    default: "info",
  } as EnumConfigOption<"debug" | "info" | "warning" | "error">,

  logging_mode: {
    type: "enum",
    values: ["stdout", "file", "both"] as const,
    default: "stdout",
  } as EnumConfigOption<"stdout" | "file" | "both">,

  log_query_path: {
    type: "string",
    default: "",
  } as StringConfigOption,

  profile_output: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === HTTP & Network ===
  http_timeout: {
    type: "integer",
    min: 0,
    default: 30000,
  } as IntegerConfigOption,

  http_retries: {
    type: "integer",
    min: 0,
    default: 3,
  } as IntegerConfigOption,

  http_retry_wait_backoff: {
    type: "integer",
    min: 0,
    default: 1000,
  } as IntegerConfigOption,

  http_retry_max_wait_backoff: {
    type: "integer",
    min: 0,
    default: 60000,
  } as IntegerConfigOption,

  http_proxy: {
    type: "string",
    default: "",
  } as StringConfigOption,

  http_ssl_mode: {
    type: "enum",
    values: [
      "disable",
      "allow",
      "prefer",
      "require",
      "verify_ca",
      "verify_full",
    ] as const,
    default: "prefer",
  } as EnumConfigOption<
    "disable" | "allow" | "prefer" | "require" | "verify_ca" | "verify_full"
  >,

  // === S3 Settings ===
  s3_region: {
    type: "string",
    default: "us-east-1",
  } as StringConfigOption,

  s3_endpoint: {
    type: "string",
    default: "",
  } as StringConfigOption,

  s3_url_style: {
    type: "enum",
    values: ["vhost", "path"] as const,
    default: "vhost",
  } as EnumConfigOption<"vhost" | "path">,

  s3_use_ssl: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  s3_access_key_id: {
    type: "string",
    default: "",
  } as StringConfigOption,

  s3_secret_access_key: {
    type: "string",
    default: "",
  } as StringConfigOption,

  s3_session_token: {
    type: "string",
    default: "",
  } as StringConfigOption,

  s3_server_side_encryption: {
    type: "string",
    default: "",
  } as StringConfigOption,

  s3_kms_key_id: {
    type: "string",
    default: "",
  } as StringConfigOption,

  s3_kms_region: {
    type: "string",
    default: "",
  } as StringConfigOption,

  s3_token: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Parquet Settings ===
  binary_as_string: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  parquet_metadata_cache: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  disable_parquet_prefetching: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  parquet_read_buffer_size: {
    type: "integer",
    min: 0,
    default: 262144,
  } as IntegerConfigOption,

  parquet_writer_version: {
    type: "enum",
    values: ["1.0", "2.0"] as const,
    default: "1.0",
  } as EnumConfigOption<"1.0" | "2.0">,

  // === Arrow Settings ===
  arrow_large_buffer_size: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  arrow_lossless_conversion: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  arrow_output_list_view: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  arrow_output_version: {
    type: "enum",
    values: ["V4", "V5"] as const,
    default: "V4",
  } as EnumConfigOption<"V4" | "V5">,

  produce_arrow_string_view: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === File Systems ===
  disabled_filesystems: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Optimizers ===
  disabled_optimizers: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Force Options ===
  force_index_join: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  force_parallel: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  force_hash_build_side: {
    type: "enum",
    values: ["left", "right", "auto"] as const,
    default: "auto",
  } as EnumConfigOption<"left" | "right" | "auto">,

  // === Transaction Management ===
  transaction_version: {
    type: "enum",
    values: ["read_committed", "snapshot"] as const,
    default: "read_committed",
  } as EnumConfigOption<"read_committed" | "snapshot">,

  // === Time & Calendar ===
  calendar: {
    type: "string",
    default: "gregorian",
  } as StringConfigOption,

  time_zone: {
    type: "string",
    default: "UTC",
  } as StringConfigOption,

  // ===cast ===
  enable_caching: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Catalog ===
  schema: {
    type: "string",
    default: "main",
  } as StringConfigOption,

  // === Errors ===
  errors_as_json: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Cast Options ===
  cast_empty_to_null: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  enable_optimizer: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Vectorization ===
  vector_size: {
    type: "integer",
    min: 1,
    max: 65536,
    default: 1024,
  } as IntegerConfigOption,

  // === Verification ===
  verify_serialization: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Streaming ===
  streaming_buffer_size: {
    type: "integer",
    min: 0,
    default: 8388608,
  } as IntegerConfigOption,

  // === Iteration ===
  max_chunks_in_progress: {
    type: "integer",
    min: 0,
    default: 8,
  } as IntegerConfigOption,

  // === DuckDB API ===
  duckdb_api: {
    type: "string",
    default: "duckdb",
  } as StringConfigOption,

  // === Username/Password ===
  username: {
    type: "string",
    default: "duckdb",
  } as StringConfigOption,

  password: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Debug Options ===
  debug_checkpoint_abort: {
    type: "enum",
    values: ["none", "begin", "end"] as const,
    default: "none",
  } as EnumConfigOption<"none" | "begin" | "end">,

  debug_force_index_join: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  debug_force_external: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  debug_window_mode: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Window Functions ===
  window_mode: {
    type: "enum",
    values: ["separate", "combine", "cook", "reference"] as const,
    default: "separate",
  } as EnumConfigOption<"separate" | "combine" | "cook" | "reference">,

  // === Index Scan ===
  index_scan_max_count: {
    type: "integer",
    min: 0,
    default: 6,
  } as IntegerConfigOption,

  index_scan_percentage: {
    type: "integer",
    min: 0,
    max: 100,
    default: 20,
  } as IntegerConfigOption,

  // === Force Checkpoint ===
  force_checkpoint: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  checkpoint_on_shutdown: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Table Functions ===
  enable_object_cache: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Pigweed ===
  enable_optimizer_stats: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Metadata Cache ===
  metadata_cache_size: {
    type: "bigint",
    default: "1024MB",
  } as BigIntConfigOption,

  // === Complex Types ===
  enable_new_serializer: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Additional Common Settings ===
  perfect_ht_threshold: {
    type: "integer",
    min: 0,
    default: 12,
  } as IntegerConfigOption,

  pivot_threshold: {
    type: "integer",
    min: 0,
    default: 0,
  } as IntegerConfigOption,

  // === Distributed ===
  preserve_insertion_order: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Insert Order ===
  disable_record_errors: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Lock-Based ===
  lock_manager: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Flush/Checkpoint ===
  checkpoint_abort_after: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Wal ===
  wal_initially_full: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Verify ///
  verify_integrity: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,
} as const;

/**
 * Type representing any configuration option definition from the schema.
 */
export type ConfigOptionDefinition =
  | BooleanConfigOption
  | EnumConfigOption<string>
  | IntegerConfigOption
  | BigIntConfigOption
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
 */
export function getConfigDefinition(
  key: string,
): ConfigOptionDefinition | undefined {
  return configSchema[key as KnownConfigKey];
}
