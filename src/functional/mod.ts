/**
 * Functional API for DuckDB
 *
 * Pure functional style with explicit state passing.
 *
 * @example
 * ```typescript
 * import { load } from "jsr:@ggpwnkthx/libduckdb";
 * import { open, closeDatabase, create, closeConnection, execute, destroyResult, fetchAll } from "jsr:@ggpwnkthx/duckdb/functional";
 *
 * const lib = await load();
 * const db = open(lib);
 * const conn = create(lib, db);
 * const resultHandle = execute(lib, conn, "SELECT * FROM t");
 * const rows = fetchAll(lib, resultHandle);
 * destroyResult(lib, resultHandle);
 * closeConnection(lib, conn);
 * closeDatabase(lib, db);
 * ```
 */

export * from "./database.ts";
export * from "./connection.ts";
export * from "./query.ts";
export * from "./prepared.ts";
export * from "./value.ts";
export * from "./stream.ts";
