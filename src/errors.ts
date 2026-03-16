/**
 * Typed error hierarchy for DuckDB operations.
 *
 * This module provides a structured error hierarchy for different failure modes
 * when working with DuckDB databases. Each error type includes context information
 * for debugging and logging.
 */

/** Error code categories for DuckDB operations. */
export type DuckDBErrorCode =
  | "DATABASE_ERROR"
  | "QUERY_ERROR"
  | "INVALID_RESOURCE"
  | "VALIDATION_ERROR"
  | "LIBRARY_LOAD_FAILED";

/** Additional context information attached to errors. */
export type ErrorContext = Readonly<Record<string, unknown>>;

/** Initialization options for creating a DuckDB error. */
interface DuckDBErrorInit {
  /** The error code identifying the type of failure. */
  code: DuckDBErrorCode;
  /** Human-readable error message. */
  message: string;
  /** Optional additional context for debugging. */
  context?: ErrorContext;
  /** Optional underlying cause of the error. */
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
