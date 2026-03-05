/**
 * Object-Oriented API for DuckDB
 *
 * Classes for working with DuckDB in an object-oriented style.
 * The library loads automatically on first use.
 *
 * @example
 * ```typescript
 * import { Database } from "jsr:@ggpwnkthx/duckdb/objective";
 *
 * const db = new Database();
 * await db.open();
 * const conn = await db.connect();
 * const result = await conn.query("SELECT * FROM t");
 * const rows = await result.fetchAll();
 * result.close();
 * conn.close();
 * db.close();
 * ```
 *
 * @example
 * ```typescript
 * // Using Symbol.dispose for automatic cleanup
 * import { Database } from "jsr:@ggpwnkthx/duckdb/objective";
 *
 * using db = new Database();
 * await db.open();
 * using conn = await db.connect();
 * const result = await conn.query("SELECT * FROM t");
 * const rows = await result.fetchAll();
 * // Auto-cleanup at end of scope
 * ```
 */

export { Database } from "./database.ts";
export { Connection } from "./connection.ts";
export { QueryResult } from "./query.ts";
export { PreparedStatement } from "./prepared.ts";
export type { Disposable } from "./disposable.ts";
export type { RowStream } from "./connection.ts";

// Re-export error classes for convenience
export {
  DatabaseError,
  DuckDBError,
  InvalidResourceError,
  QueryError,
} from "../errors.ts";
