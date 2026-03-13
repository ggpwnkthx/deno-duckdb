/**
 * Public OO API.
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
