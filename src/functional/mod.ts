/**
 * Public functional API.
 */

export * from "./database.ts";
export * from "./connection.ts";
export * from "./prepared.ts";
export * from "./query.ts";
export * from "./value.ts";

export {
  DatabaseError,
  DuckDBError,
  InvalidResourceError,
  QueryError,
  ValidationError,
} from "../errors.ts";
