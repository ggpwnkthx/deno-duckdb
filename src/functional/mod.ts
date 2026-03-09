/**
 * Functional API for DuckDB
 *
 * Pure functional style with explicit state passing.
 * The library loads automatically on first use.
 *
 * @example
 * ```typescript
 * import { open, closeDatabase, create, closeConnection, execute, destroyResult, fetchAll } from "jsr:@ggpwnkthx/duckdb/functional";
 *
 * const db = await open();
 * const conn = await create(db);
 * const resultHandle = execute(conn, "SELECT * FROM t");
 * const rows = fetchAll(resultHandle);
 * destroyResult(resultHandle);
 * closeConnection(conn);
 * closeDatabase(db);
 * ```
 */

export * from "./database.ts";
export * from "./connection.ts";
export * from "./query.ts";
export * from "./prepared.ts";
export * from "./value.ts";
export * from "./stream.ts";
// Note: types.ts is internal - contains helpers for value decoding
export { DatabaseError } from "../errors.ts";

// Re-export types for public API
export type { BindValue } from "./prepared.ts";
export type { RowStream } from "./stream.ts";
