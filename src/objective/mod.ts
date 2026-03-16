/**
 * Public OO API.
 *
 * This module provides an object-oriented API for DuckDB operations where classes
 * encapsulate database handles and provide methods for common operations. Classes
 * implement `Symbol.dispose` for automatic resource cleanup using TypeScript's
 * explicit resource management feature.
 *
 * ## Disposable Pattern
 *
 * All resource classes support the `Symbol.dispose` pattern for automatic cleanup:
 *
 * ```ts
 * import { Database } from "@ggpwnkthx/duckdb";
 *
 * // Using dispose() method
 * const db = await Database.open();
 * try {
 *   const conn = await db.connect();
 *   // ... use connection
 * } finally {
 *   db.close();
 * }
 *
 * // Using Symbol.dispose (Deno 2.0+)
 * using db = await Database.open();
 * const conn = await db.connect();
 * // db automatically closed at end of scope
 * ```
 *
 * ## Example Usage
 *
 * ```ts
 * import { Database } from "@ggpwnkthx/duckdb";
 *
 * using db = await Database.open({ path: ":memory:" });
 * using conn = await db.connect();
 *
 * const result = conn.execute("SELECT * FROM range(10) t(i)");
 * for (const row of result.rows()) {
 *   console.log(row);
 * }
 * // Resources automatically cleaned up
 * ```
 */

export { Database } from "./database.ts";
export { Connection } from "./connection.ts";
export { PreparedStatement } from "./prepared.ts";
export { QueryResult } from "./query.ts";

export {
  DatabaseError,
  DuckDBError,
  InvalidResourceError,
  QueryError,
  ValidationError,
} from "../errors.ts";
