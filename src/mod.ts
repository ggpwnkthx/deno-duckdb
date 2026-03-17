/**
 * Type-safe DuckDB FFI binding library for Deno.
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
  isKnownConfigKey,
  type KnownConfigKey,
} from "./core/config/schema.ts";
export {
  getConfigDefault,
  getConfigEnumValues,
  getConfigOptionType,
  isValidConfigKey,
  validateConfigValue,
  validateDatabaseConfig,
} from "./core/config/validate.ts";
export { type DatabaseConfig } from "./types.ts";
export { type NormalizedDatabaseConfig, type NormalizedOption } from "./core/config/mod.ts";
