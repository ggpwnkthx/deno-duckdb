/**
 * Type-safe DuckDB FFI binding library for Deno.
 *
 * This is the main entry point for the `@ggpwnkthx/duckdb` package. It exports:
 *
 * - {@link types} - Shared types (DatabaseHandle, ConnectionHandle, etc.)
 * - {@link errors} - Error hierarchy (DuckDBError, QueryError, etc.)
 * - {@link functional} - Functional API with explicit state management
 * - {@link objective} - Object-oriented API with automatic resource cleanup
 *
 * Choose the functional API for explicit control or the objective API for convenience.
 *
 * @see {@link https://github.com/ggpwnkthx/deno-duckdb} for documentation
 */

export * from "./types.ts";
export * from "./errors.ts";

export * as functional from "./functional/mod.ts";
export * as objective from "./objective/mod.ts";
