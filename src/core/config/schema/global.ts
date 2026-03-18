/**
 * DuckDB global configuration options.
 *
 * These options apply to the entire database instance and are set at the
 * database level. They affect overall database behavior, performance,
 * storage, and system-wide settings.
 *
 * Based on DuckDB documentation: https://duckdb.org/docs/stable/configuration/overview
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

/**
 * Global configuration options that apply to the entire DuckDB database.
 *
 * These settings control database-level behavior including memory, threads,
 * storage, extensions, file systems, HTTP/S3 connectivity, and more.
 * Options are ordered to match DuckDB's official documentation.
 */
export const globalConfigSchema = {
  // === Locale & Time ===
  Calendar: {
    type: "string",
    default: "gregorian",
  } as StringConfigOption,

  TimeZone: {
    type: "string",
    default: "UTC",
  } as StringConfigOption,

  // === Database Access & Security ===
  access_mode: {
    type: "enum",
    values: ["AUTOMATIC", "READ_ONLY", "READ_WRITE"] as const,
    default: "AUTOMATIC",
  } as EnumConfigOption<"AUTOMATIC" | "READ_ONLY" | "READ_WRITE">,

  // === Allocator ===
  allocator_background_threads: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  allocator_bulk_deallocation_flush_threshold: {
    type: "string",
    default: "512.0 MiB",
  } as StringConfigOption,

  allocator_flush_threshold: {
    type: "string",
    default: "128.0 MiB",
  } as StringConfigOption,

  // === Extensions ===
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

  // === File System & Paths ===
  allowed_directories: {
    type: "string[]",
    default: [],
  } as StringArrayConfigOption,

  allowed_paths: {
    type: "string[]",
    default: [],
  } as StringArrayConfigOption,

  // === Arrow ===
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
    values: ["1.0", "2.0"] as const,
    default: "1.0",
  } as EnumConfigOption<"1.0" | "2.0">,

  // === Join Thresholds ===
  asof_loop_join_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 64n,
  } as BigIntConfigOption,

  // === HTTP Cache ===
  auto_fallback_to_full_download: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Extensions ===
  autoinstall_extension_repository: {
    type: "string",
    default: "",
  } as StringConfigOption,

  autoinstall_known_extensions: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  autoload_known_extensions: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Parquet ===
  binary_as_string: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === HTTP Options ===
  ca_cert_file: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Catalog ===
  catalog_error_max_schemas: {
    type: "bigint",
    min: 1n,
    max: 9223372036854775807n,
    default: 100n,
  } as BigIntConfigOption,

  // === Storage & Checkpoint ===
  checkpoint_threshold: {
    type: "string",
    default: "16.0 MiB",
    aliases: ["wal_autocheckpoint"],
  } as StringConfigOption,

  // === Extensions ===
  custom_extension_repository: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === HTTP Options ===
  custom_user_agent: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Storage ===
  default_block_size: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 262144n,
  } as BigIntConfigOption,

  // === Defaults ===
  default_collation: {
    type: "string",
  } as StringConfigOption,

  default_null_order: {
    type: "enum",
    values: ["NULLS_FIRST", "NULLS_LAST"] as const,
    default: "NULLS_LAST",
    aliases: ["null_order"],
  } as EnumConfigOption<"NULLS_FIRST" | "NULLS_LAST">,

  default_order: {
    type: "enum",
    values: ["ASCENDING", "DESCENDING"] as const,
    default: "ASCENDING",
  } as EnumConfigOption<"ASCENDING" | "DESCENDING">,

  // === Secrets ===
  default_secret_storage: {
    type: "string",
    default: "local_file",
  } as StringConfigOption,

  // === Configuration Locking ===
  disable_database_invalidation: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Parquet ===
  disable_parquet_prefetching: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Type & Casts ===
  disable_timestamptz_casts: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Compression ===
  disabled_compression_methods: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === File System ===
  disabled_filesystems: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Logging ===
  disabled_log_types: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === DuckDB API ===
  duckdb_api: {
    type: "string",
    default: "cli",
  } as StringConfigOption,

  // === Optimizer Settings ===
  dynamic_or_filter_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 50n,
  } as BigIntConfigOption,

  // === HTTP Options ===
  enable_curl_server_cert_verification: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Database Access & Security ===
  enable_external_access: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === HTTP Cache ===
  enable_external_file_cache: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Database Access & Security ===
  enable_fsst_vectors: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Geo Parquet ===
  enable_geoparquet_conversion: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === HTTP Cache ===
  enable_http_metadata_cache: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Logging ===
  enable_logging: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Dependencies ===
  enable_macro_dependencies: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Index Options ===
  enable_object_cache: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === HTTP Options ===
  enable_server_cert_verification: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Dependencies ===
  enable_view_dependencies: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Logging ===
  enabled_log_types: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Experimental Features ===
  experimental_metadata_reuse: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Extensions ===
  extension_directory: {
    type: "string",
    default: "",
  } as StringConfigOption,

  // === Memory & Threads ===
  external_threads: {
    type: "bigint",
    min: 0n,
    max: 256n,
    default: 1n,
  } as BigIntConfigOption,

  // === HTTP Cache ===
  force_download: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === HTTP Options ===
  http_keep_alive: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  http_proxy_password: {
    type: "string",
    default: "",
  } as StringConfigOption,

  http_proxy_username: {
    type: "string",
    default: "",
  } as StringConfigOption,

  http_proxy: {
    type: "string",
    default: "",
  } as StringConfigOption,

  http_retries: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 3n,
  } as BigIntConfigOption,

  http_retry_backoff: {
    type: "double",
    default: 4,
  } as DoubleConfigOption,

  http_retry_wait_ms: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 100n,
  } as BigIntConfigOption,

  http_timeout: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 30n,
  } as BigIntConfigOption,

  httpfs_client_implementation: {
    type: "string",
    default: "default",
  } as StringConfigOption,

  // === Numeric Behavior ===
  ieee_floating_point_ops: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Transaction Mode ===
  immediate_transaction_mode: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Index Options ===
  index_scan_max_count: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 2048n,
  } as BigIntConfigOption,

  index_scan_percentage: {
    type: "double",
    min: 0,
    max: 100,
    default: 0.001,
  } as DoubleConfigOption,

  // === Numeric Behavior ===
  integer_division: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Optimizer Settings ===
  late_materialization_max_rows: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 50n,
  } as BigIntConfigOption,

  // === Configuration Locking ===
  lock_configuration: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Logging ===
  logging_level: {
    type: "enum",
    values: ["DEBUG", "INFO", "WARNING", "ERROR"] as const,
    default: "INFO",
  } as EnumConfigOption<"DEBUG" | "INFO" | "WARNING" | "ERROR">,

  logging_mode: {
    type: "enum",
    values: ["stdout", "file", "both", "LEVEL_ONLY"] as const,
    default: "LEVEL_ONLY",
  } as EnumConfigOption<"stdout" | "file" | "both" | "LEVEL_ONLY">,

  logging_storage: {
    type: "string",
    default: "memory",
  } as StringConfigOption,

  // === Memory & Threads ===
  max_memory: {
    type: "string",
    default: "80%",
    aliases: ["memory_limit"],
  } as StringConfigOption,

  // === Storage ===
  max_temp_directory_size: {
    type: "string",
    default: "90%",
  } as StringConfigOption,

  // === Vacuum & Maintenance ===
  max_vacuum_tasks: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 100n,
  } as BigIntConfigOption,

  // === Join Thresholds ===
  merge_join_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 1000n,
  } as BigIntConfigOption,

  nested_loop_join_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 5n,
  } as BigIntConfigOption,

  // === Casting ===
  old_implicit_casting: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Sorting ===
  order_by_non_integer_literal: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Optimizer Settings ===
  ordered_aggregate_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 262144n,
  } as BigIntConfigOption,

  // === Parquet ===
  parquet_metadata_cache: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Write Settings ===
  partitioned_write_flush_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 524288n,
  } as BigIntConfigOption,

  partitioned_write_max_open_files: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 100n,
  } as BigIntConfigOption,

  // === Authentication (local option in docs but used globally) ===
  password: {
    type: "string",
    default: null,
  } as StringConfigOption,

  // === Index Options ===
  perfect_ht_threshold: {
    type: "integer",
    min: 0,
    max: 2147483647,
    default: 12,
  } as IntegerConfigOption,

  // === Threads ===
  pin_threads: {
    type: "string",
    default: "auto",
  } as StringConfigOption,

  // === Pivot Settings ===
  pivot_filter_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 20n,
  } as BigIntConfigOption,

  pivot_limit: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 100000n,
  } as BigIntConfigOption,

  // === Join Thresholds ===
  prefer_range_joins: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Parquet ===
  prefetch_all_parquet_files: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Identifiers ===
  preserve_identifier_case: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Index Options ===
  preserve_insertion_order: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Arrow ===
  produce_arrow_string_view: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === S3 Options ===
  s3_access_key_id: {
    type: "string",
    default: null,
  } as StringConfigOption,

  s3_endpoint: {
    type: "string",
    default: null,
  } as StringConfigOption,

  s3_kms_key_id: {
    type: "string",
    default: null,
  } as StringConfigOption,

  s3_region: {
    type: "string",
    default: null,
  } as StringConfigOption,

  s3_requester_pays: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  s3_secret_access_key: {
    type: "string",
    default: null,
  } as StringConfigOption,

  s3_session_token: {
    type: "string",
    default: null,
  } as StringConfigOption,

  s3_uploader_max_filesize: {
    type: "string",
    default: "800GB",
  } as StringConfigOption,

  s3_uploader_max_parts_per_file: {
    type: "bigint",
    min: 1n,
    max: 9223372036854775807n,
    default: 10000n,
  } as BigIntConfigOption,

  s3_uploader_thread_limit: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 50n,
  } as BigIntConfigOption,

  s3_url_compatibility_mode: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  s3_url_style: {
    type: "enum",
    values: ["vhost", "path"] as const,
    default: "vhost",
  } as EnumConfigOption<"vhost" | "path">,

  s3_use_ssl: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Query Behavior ===
  scalar_subquery_error_on_multiple_rows: {
    type: "boolean",
    default: true,
  } as BooleanConfigOption,

  // === Scheduler ===
  scheduler_process_partial: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Secrets ===
  secret_directory: {
    type: "string",
    default: "~/.duckdb/stored_secrets",
  } as StringConfigOption,

  // === Storage ===
  storage_compatibility_version: {
    type: "string",
    default: "v0.10.2",
  } as StringConfigOption,

  // === Storage ===
  temp_directory: {
    type: "string",
    default: "",
  } as StringConfigOption,

  temp_file_encryption: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Memory & Threads ===
  threads: {
    type: "bigint",
    min: 0n,
    max: 256n,
    default: 0n,
    aliases: ["worker_threads"],
  } as BigIntConfigOption,

  max_threads: {
    type: "bigint",
    min: 0n,
    max: 256n,
    default: 0n,
  } as BigIntConfigOption,

  // === ETag Checks ===
  unsafe_disable_etag_checks: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Authentication (local option in docs but used globally) ===
  user: {
    type: "string",
    default: null,
    aliases: ["username"],
  } as StringConfigOption,

  // === Variant ===
  variant_legacy_encoding: {
    type: "boolean",
    default: false,
  } as BooleanConfigOption,

  // === Compression ===
  zstd_min_string_length: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 4096n,
  } as BigIntConfigOption,
} as const;

// Re-export types for external use
export type {
  BigIntConfigOption,
  BooleanConfigOption,
  DoubleConfigOption,
  EnumConfigOption,
  IntegerConfigOption,
  StringArrayConfigOption,
  StringConfigOption,
} from "../types.ts";

/**
 * Type for any global config option definition.
 */
export type GlobalConfigOptionDefinition =
  | BooleanConfigOption
  | EnumConfigOption<string>
  | IntegerConfigOption
  | BigIntConfigOption
  | DoubleConfigOption
  | StringConfigOption
  | StringArrayConfigOption;
