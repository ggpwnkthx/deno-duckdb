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
import type { ConfigOptionDefinition } from "./mod.ts";

/**
 * Global configuration options that apply to the entire DuckDB database.
 *
 * These settings control database-level behavior including memory, threads,
 * storage, extensions, file systems, HTTP/S3 connectivity, and more.
 * Options are ordered to match DuckDB's official documentation.
 */
export const globalConfigSchema: { [key: string]: ConfigOptionDefinition } = {
  // === Locale & Time ===
  Calendar: {
    type: "string",
    default: "gregorian",
  } satisfies StringConfigOption,

  TimeZone: {
    type: "string",
    default: "UTC",
  } satisfies StringConfigOption,

  // === Database Access & Security ===
  access_mode: {
    type: "enum",
    values: ["AUTOMATIC", "READ_ONLY", "READ_WRITE"] as const,
    default: "AUTOMATIC",
  } satisfies EnumConfigOption<"AUTOMATIC" | "READ_ONLY" | "READ_WRITE">,

  // === Allocator ===
  allocator_background_threads: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  allocator_bulk_deallocation_flush_threshold: {
    type: "string",
    default: "512.0 MiB",
  } satisfies StringConfigOption,

  allocator_flush_threshold: {
    type: "string",
    default: "128.0 MiB",
  } satisfies StringConfigOption,

  // === Extensions ===
  allow_community_extensions: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  allow_extensions_metadata_mismatch: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  allow_persistent_secrets: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  allow_unredacted_secrets: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  allow_unsigned_extensions: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === File System & Paths ===
  allowed_directories: {
    type: "string[]",
    default: [],
  } satisfies StringArrayConfigOption,

  allowed_paths: {
    type: "string[]",
    default: [],
  } satisfies StringArrayConfigOption,

  // === Arrow ===
  arrow_large_buffer_size: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  arrow_lossless_conversion: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  arrow_output_list_view: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  arrow_output_version: {
    type: "enum",
    values: ["1.0", "2.0"] as const,
    default: "1.0",
  } satisfies EnumConfigOption<"1.0" | "2.0">,

  // === Join Thresholds ===
  asof_loop_join_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 64n,
  } satisfies BigIntConfigOption,

  // === HTTP Cache ===
  auto_fallback_to_full_download: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === Extensions ===
  autoinstall_extension_repository: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  autoinstall_known_extensions: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  autoload_known_extensions: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === Parquet ===
  binary_as_string: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === HTTP Options ===
  ca_cert_file: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  // === Catalog ===
  catalog_error_max_schemas: {
    type: "bigint",
    min: 1n,
    max: 9223372036854775807n,
    default: 100n,
  } satisfies BigIntConfigOption,

  // === Storage & Checkpoint ===
  checkpoint_threshold: {
    type: "string",
    default: "16.0 MiB",
    aliases: ["wal_autocheckpoint"],
  } satisfies StringConfigOption,

  // === Extensions ===
  custom_extension_repository: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  // === HTTP Options ===
  custom_user_agent: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  // === Storage ===
  default_block_size: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 262144n,
  } satisfies BigIntConfigOption,

  // === Defaults ===
  default_collation: {
    type: "string",
    default: null,
  } satisfies StringConfigOption,

  default_null_order: {
    type: "enum",
    values: ["NULLS_FIRST", "NULLS_LAST"] as const,
    default: "NULLS_LAST",
    aliases: ["null_order"],
  } satisfies EnumConfigOption<"NULLS_FIRST" | "NULLS_LAST">,

  default_order: {
    type: "enum",
    values: ["ASCENDING", "DESCENDING"] as const,
    default: "ASCENDING",
  } satisfies EnumConfigOption<"ASCENDING" | "DESCENDING">,

  // === Secrets ===
  default_secret_storage: {
    type: "string",
    default: "local_file",
  } satisfies StringConfigOption,

  // === Configuration Locking ===
  disable_database_invalidation: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Parquet ===
  disable_parquet_prefetching: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Type & Casts ===
  disable_timestamptz_casts: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Compression ===
  disabled_compression_methods: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  // === File System ===
  disabled_filesystems: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  // === Logging ===
  disabled_log_types: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  // === DuckDB API ===
  duckdb_api: {
    type: "string",
    default: "cli",
  } satisfies StringConfigOption,

  // === Optimizer Settings ===
  dynamic_or_filter_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 50n,
  } satisfies BigIntConfigOption,

  // === HTTP Options ===
  enable_curl_server_cert_verification: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === Database Access & Security ===
  enable_external_access: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === HTTP Cache ===
  enable_external_file_cache: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === Database Access & Security ===
  enable_fsst_vectors: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Geo Parquet ===
  enable_geoparquet_conversion: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === HTTP Cache ===
  enable_http_metadata_cache: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Logging ===
  enable_logging: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Dependencies ===
  enable_macro_dependencies: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Index Options ===
  enable_object_cache: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === HTTP Options ===
  enable_server_cert_verification: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Dependencies ===
  enable_view_dependencies: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Logging ===
  enabled_log_types: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  // === Experimental Features ===
  experimental_metadata_reuse: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Extensions ===
  extension_directory: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  // === Memory & Threads ===
  external_threads: {
    type: "bigint",
    min: 0n,
    max: 256n,
    default: 1n,
  } satisfies BigIntConfigOption,

  // === HTTP Cache ===
  force_download: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === HTTP Options ===
  http_keep_alive: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  http_proxy_password: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  http_proxy_username: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  http_proxy: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  http_retries: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 3n,
  } satisfies BigIntConfigOption,

  http_retry_backoff: {
    type: "double",
    default: 4,
  } satisfies DoubleConfigOption,

  http_retry_wait_ms: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 100n,
  } satisfies BigIntConfigOption,

  http_timeout: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 30n,
  } satisfies BigIntConfigOption,

  httpfs_client_implementation: {
    type: "string",
    default: "default",
  } satisfies StringConfigOption,

  // === Numeric Behavior ===
  ieee_floating_point_ops: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === Transaction Mode ===
  immediate_transaction_mode: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Index Options ===
  index_scan_max_count: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 2048n,
  } satisfies BigIntConfigOption,

  index_scan_percentage: {
    type: "double",
    min: 0,
    max: 100,
    default: 0.001,
  } satisfies DoubleConfigOption,

  // === Numeric Behavior ===
  integer_division: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Optimizer Settings ===
  late_materialization_max_rows: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 50n,
  } satisfies BigIntConfigOption,

  // === Configuration Locking ===
  lock_configuration: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Logging ===
  logging_level: {
    type: "enum",
    values: ["DEBUG", "INFO", "WARNING", "ERROR"] as const,
    default: "INFO",
  } satisfies EnumConfigOption<"DEBUG" | "INFO" | "WARNING" | "ERROR">,

  logging_mode: {
    type: "enum",
    values: ["stdout", "file", "both", "LEVEL_ONLY"] as const,
    default: "LEVEL_ONLY",
  } satisfies EnumConfigOption<"stdout" | "file" | "both" | "LEVEL_ONLY">,

  logging_storage: {
    type: "string",
    default: "memory",
  } satisfies StringConfigOption,

  // === Memory & Threads ===
  max_memory: {
    type: "string",
    default: "80%",
    aliases: ["memory_limit"],
  } satisfies StringConfigOption,

  // === Storage ===
  max_temp_directory_size: {
    type: "string",
    default: "90%",
  } satisfies StringConfigOption,

  // === Vacuum & Maintenance ===
  max_vacuum_tasks: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 100n,
  } satisfies BigIntConfigOption,

  // === Join Thresholds ===
  merge_join_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 1000n,
  } satisfies BigIntConfigOption,

  nested_loop_join_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 5n,
  } satisfies BigIntConfigOption,

  // === Casting ===
  old_implicit_casting: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Sorting ===
  order_by_non_integer_literal: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Optimizer Settings ===
  ordered_aggregate_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 262144n,
  } satisfies BigIntConfigOption,

  // === Parquet ===
  parquet_metadata_cache: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Write Settings ===
  partitioned_write_flush_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 524288n,
  } satisfies BigIntConfigOption,

  partitioned_write_max_open_files: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 100n,
  } satisfies BigIntConfigOption,

  // === Authentication (local option in docs but used globally) ===
  password: {
    type: "string",
    default: null,
  } satisfies StringConfigOption,

  // === Index Options ===
  perfect_ht_threshold: {
    type: "integer",
    min: 0,
    max: 2147483647,
    default: 12,
  } satisfies IntegerConfigOption,

  // === Threads ===
  pin_threads: {
    type: "string",
    default: "auto",
  } satisfies StringConfigOption,

  // === Pivot Settings ===
  pivot_filter_threshold: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 20n,
  } satisfies BigIntConfigOption,

  pivot_limit: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 100000n,
  } satisfies BigIntConfigOption,

  // === Join Thresholds ===
  prefer_range_joins: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Parquet ===
  prefetch_all_parquet_files: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Identifiers ===
  preserve_identifier_case: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === Index Options ===
  preserve_insertion_order: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === Arrow ===
  produce_arrow_string_view: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === S3 Options ===
  s3_access_key_id: {
    type: "string",
    default: null,
  } satisfies StringConfigOption,

  s3_endpoint: {
    type: "string",
    default: null,
  } satisfies StringConfigOption,

  s3_kms_key_id: {
    type: "string",
    default: null,
  } satisfies StringConfigOption,

  s3_region: {
    type: "string",
    default: null,
  } satisfies StringConfigOption,

  s3_requester_pays: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  s3_secret_access_key: {
    type: "string",
    default: null,
  } satisfies StringConfigOption,

  s3_session_token: {
    type: "string",
    default: null,
  } satisfies StringConfigOption,

  s3_uploader_max_filesize: {
    type: "string",
    default: "800GB",
  } satisfies StringConfigOption,

  s3_uploader_max_parts_per_file: {
    type: "bigint",
    min: 1n,
    max: 9223372036854775807n,
    default: 10000n,
  } satisfies BigIntConfigOption,

  s3_uploader_thread_limit: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 50n,
  } satisfies BigIntConfigOption,

  s3_url_compatibility_mode: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  s3_url_style: {
    type: "enum",
    values: ["vhost", "path"] as const,
    default: "vhost",
  } satisfies EnumConfigOption<"vhost" | "path">,

  s3_use_ssl: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === Query Behavior ===
  scalar_subquery_error_on_multiple_rows: {
    type: "boolean",
    default: true,
  } satisfies BooleanConfigOption,

  // === Scheduler ===
  scheduler_process_partial: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Secrets ===
  secret_directory: {
    type: "string",
    default: "~/.duckdb/stored_secrets",
  } satisfies StringConfigOption,

  // === Storage ===
  storage_compatibility_version: {
    type: "string",
    default: "v0.10.2",
  } satisfies StringConfigOption,

  // === Storage ===
  temp_directory: {
    type: "string",
    default: "",
  } satisfies StringConfigOption,

  temp_file_encryption: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Memory & Threads ===
  threads: {
    type: "bigint",
    min: 0n,
    max: 256n,
    default: 0n,
    aliases: ["worker_threads"],
  } satisfies BigIntConfigOption,

  max_threads: {
    type: "bigint",
    min: 0n,
    max: 256n,
    default: 0n,
  } satisfies BigIntConfigOption,

  // === ETag Checks ===
  unsafe_disable_etag_checks: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Authentication (local option in docs but used globally) ===
  user: {
    type: "string",
    default: null,
    aliases: ["username"],
  } satisfies StringConfigOption,

  // === Variant ===
  variant_legacy_encoding: {
    type: "boolean",
    default: false,
  } satisfies BooleanConfigOption,

  // === Compression ===
  zstd_min_string_length: {
    type: "bigint",
    min: 0n,
    max: 9223372036854775807n,
    default: 4096n,
  } satisfies BigIntConfigOption,
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
