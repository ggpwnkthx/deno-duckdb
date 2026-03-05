/**
 * DuckDB Type-Safe APIs
 *
 * This module provides two APIs for working with DuckDB:
 * - Functional API: Pure functional style with explicit state passing
 * - Object-Oriented API: Classes encapsulating handles
 *
 * @example
 * ```typescript
 * import { load } from "jsr:@ggpwnkthx/libduckdb";
 * import { Database } from "jsr:@ggpwnkthx/duckdb/objective";
 *
 * const lib = await load();
 * const db = new Database(lib);
 * ```
 */

// Re-export types and errors
export * from "./types.ts";
export * from "./errors.ts";
export * from "./helpers.ts";

// Re-export functional API
export * as functional from "./functional/mod.ts";

// Re-export objective API
export * as objective from "./objective/mod.ts";
