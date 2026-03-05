/**
 * Error classes for DuckDB operations
 */

/** Base error for all DuckDB errors */
export class DuckDBError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuckDBError";
  }
}

/** Error during database operation */
export class DatabaseError extends DuckDBError {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

/** Error during query execution */
export class QueryError extends DuckDBError {
  /** The query that caused the error */
  public readonly query: string;

  constructor(message: string, query: string) {
    super(message);
    this.name = "QueryError";
    this.query = query;
  }
}

/** Error when accessing invalid resources */
export class InvalidResourceError extends DuckDBError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidResourceError";
  }
}
