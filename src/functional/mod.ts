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
 * const resultHandle = await execute(conn, "SELECT * FROM t");
 * const rows = await fetchAll(resultHandle);
 * await destroyResult(resultHandle);
 * await closeConnection(conn);
 * await closeDatabase(db);
 * ```
 */

export * from "./database.ts";
export * from "./connection.ts";
export * from "./query.ts";
export * from "./prepared.ts";
export * from "./value.ts";
export * from "./stream.ts";
export * from "./types.ts";
