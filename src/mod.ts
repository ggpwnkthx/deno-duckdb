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