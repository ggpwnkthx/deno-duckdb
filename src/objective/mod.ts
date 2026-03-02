/**
 * Object-Oriented API for DuckDB
 *
 * Classes for working with DuckDB in an object-oriented style.
 *
 * @example
 * ```typescript
 * import { load } from "jsr:@ggpwnkthx/libduckdb";
 * import { Database } from "jsr:@ggpwnkthx/duckdb/objective";
 *
 * const lib = await load();
 * const db = new Database(lib);
 * const conn = db.connect();
 * const result = conn.query("SELECT * FROM t");
 * const rows = result.fetchAll();
 * result.close();
 * conn.close();
 * db.close();
 * ```
 *
 * @example
 * ```typescript
 * // Using Symbol.dispose for automatic cleanup
 * import { load } from "jsr:@ggpwnkthx/libduckdb";
 * import { Database } from "jsr:@ggpwnkthx/duckdb/objective";
 *
 * const lib = await load();
 * using db = new Database(lib);
 * using conn = db.connect();
 * const result = conn.query("SELECT * FROM t");
 * const rows = result.fetchAll();
 * // Auto-cleanup at end of scope
 * ```
 */

export { Database } from "./database.ts";
export { Connection } from "./connection.ts";
export { QueryResult } from "./query.ts";
export { PreparedStatement } from "./prepared.ts";
export type { Disposable } from "./disposable.ts";
