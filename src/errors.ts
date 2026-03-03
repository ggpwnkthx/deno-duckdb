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

  constructor(query: string, message: string) {
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

/** Extract error message from DuckDB error pointer */
export function getErrorMessage(
  errorPtr: Deno.PointerValue<unknown> | null,
): string | null {
  if (!errorPtr) return null;
  // duckdb_result_error returns a pointer that needs to be read as C string
  const ptr = errorPtr as unknown as Deno.PointerObject<unknown>;
  const view = new Deno.UnsafePointerView(ptr);
  return view.getCString();
}
