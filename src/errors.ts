/**
 * Typed error hierarchy for DuckDB operations.
 */

export type DuckDBErrorCode =
  | "DATABASE_ERROR"
  | "QUERY_ERROR"
  | "INVALID_RESOURCE"
  | "VALIDATION_ERROR"
  | "LIBRARY_LOAD_FAILED";

export type ErrorContext = Readonly<Record<string, unknown>>;

interface DuckDBErrorInit {
  code: DuckDBErrorCode;
  message: string;
  context?: ErrorContext;
  cause?: unknown;
}

/** Base error for all wrapper failures. */
export class DuckDBError extends Error {
  readonly code: DuckDBErrorCode;
  readonly context?: ErrorContext;

  constructor(init: DuckDBErrorInit) {
    super(
      init.message,
      init.cause instanceof Error ? { cause: init.cause } : undefined,
    );
    this.name = new.target.name;
    this.code = init.code;
    this.context = init.context;

    if (!(init.cause instanceof Error) && init.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = init.cause;
    }
  }
}

/** Database / connection / prepared-statement lifecycle failure. */
export class DatabaseError extends DuckDBError {
  constructor(message: string, context?: ErrorContext, cause?: unknown) {
    super({
      code: "DATABASE_ERROR",
      message,
      context,
      cause,
    });
  }
}

/** Query text or execution failure. */
export class QueryError extends DuckDBError {
  readonly query: string;

  constructor(message: string, query: string, context?: ErrorContext) {
    super({
      code: "QUERY_ERROR",
      message,
      context: {
        ...context,
        query,
      },
    });
    this.query = query;
  }
}

/** Attempted access to a closed / invalid resource. */
export class InvalidResourceError extends DuckDBError {
  constructor(message: string, context?: ErrorContext) {
    super({
      code: "INVALID_RESOURCE",
      message,
      context,
    });
  }
}

/** Invalid input provided to the wrapper. */
export class ValidationError extends DuckDBError {
  constructor(message: string, context?: ErrorContext) {
    super({
      code: "VALIDATION_ERROR",
      message,
      context,
    });
  }
}
