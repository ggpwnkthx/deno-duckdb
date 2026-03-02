/**
 * Functional API for DuckDB
 *
 * Pure functional style with explicit state passing.
 *
 * @example
 * ```typescript
 * import { load } from "jsr:@ggpwnkthx/libduckdb";
 * import { open, close, create, close as closeConn, execute, destroy, fetchAll } from "jsr:@ggpwnkthx/duckdb/functional";
 *
 * const lib = await load();
 * const { handle: db } = open(lib);
 * const { handle: conn } = create(lib, db);
 * const result = execute(lib, conn, "SELECT * FROM t");
 * const rows = fetchAll(lib, result.handle);
 * destroy(lib, result.handle);
 * closeConn(lib, conn);
 * close(lib, db);
 * ```
 */

export * from "./database.ts";
export * from "./connection.ts";
export * from "./query.ts";
export * from "./prepared.ts";
export * from "./value.ts";
