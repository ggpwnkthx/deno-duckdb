/**
 * Type-safe DuckDB FFI binding library for Deno.
 *
 * ## Version Compatibility
 *
 * **This library is pinned to specific DuckDB and Deno versions.** It uses direct memory
 * access for high-performance result decoding and makes assumptions about DuckDB's internal
 * ABI/layout that are only guaranteed for:
 *
 * - DuckDB: **1.5.0** (via `@ggpwnkthx/libduckdb@1.0.15`)
 * - Deno: **1.43+** (requires FFI support)
 *
 * Do NOT upgrade DuckDB or Deno without thorough testing. Even minor version upgrades may
 * break result decoding due to changes in memory layout assumptions.
 *
 * ---
 *
 * This is the main entry point for the `@ggpwnkthx/duckdb` package. It exports:
 *
 * - {@link types} - Shared types (DatabaseHandle, ConnectionHandle, etc.)
 * - {@link errors} - Error hierarchy (DuckDBError, QueryError, etc.)
 *
 * Choose the functional API for explicit control or the objective API for convenience.
 *
 * @see {@link https://github.com/ggpwnkthx/deno-duckdb} for documentation
 */

export * from "./types.ts";
export * from "./errors.ts";

// Re-export config schema and utilities for advanced usage
export {
  configSchema,
  globalConfigSchema,
  isKnownConfigKey,
  type KnownConfigKey,
  localConfigSchema,
} from "./core/config/schema/mod.ts";
export {
  getConfigDefault,
  getConfigEnumValues,
  getConfigOptionType,
  isValidConfigKey,
  validateConfigValue,
  validateDatabaseConfig,
} from "./core/config/validate.ts";
export { type DatabaseConfig } from "./core/config/schema/mod.ts";
export { type ConfigOption } from "./core/config/mod.ts";
