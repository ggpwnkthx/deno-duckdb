/**
 * Public functional API.
 *
 * This module provides a pure functional API for DuckDB operations where handles
 * are explicitly managed and passed through function calls. All resources (database
 * connections, prepared statements, result sets) must be manually closed to prevent
 * resource leaks.
 *
 * ## State Management
 *
 * The functional API requires explicit state handling. When working with databases:
 *
 * 1. Open a database to get a `DatabaseHandle`
 * 2. Connect to get a `ConnectionHandle`
 * 3. Execute queries to get `ResultHandle` or `LazyResult`
 * 4. Always destroy resources when done using the `destroy*` functions
 *
 * ## Example Usage
 *
 * ```ts
 * import { openDatabase, connectToDatabase, executeSqlResult, closeConnection, closeDatabase } from "@ggpwnkthx/duckdb/functional";
 *
 * // Open database
 * const db = await openDatabase(":memory:");
 *
 * // Create connection
 * const conn = await connectToDatabase(db);
 *
 * // Execute query with lazy iteration
 * const result = executeSqlResult(conn, "SELECT * FROM range(10) t(i)");
 * for (const row of result.rows()) {
 *   console.log(row);
 * }
 * result.close();
 *
 * // Clean up
 * closeConnection(conn);
 * closeDatabase(db);
 * ```
 *
 * ## Error Handling
 *
 * Most operations throw errors on failure. Validation errors (invalid parameters)
 * propagate immediately, while database errors are thrown from the operation.
 * Query methods return `null` on failure (except validation errors).
 */

import type { ConnectionHandle, ObjectRow, RowData } from "../types.ts";

// Import core functions with names we can use internally
import {
  // Prepared
  bindPreparedParameters,
  // Types
  type BindValue,
  closeConnection,
  // Database
  closeDatabase,
  // Connection
  connectToDatabase,
  destroyPreparedStatement,
  // Result
  destroyResult,
  executePreparedStatement,
  getResultColumnCount,
  getResultColumnInfos,
  getResultColumnName,
  getResultColumnType,
  getResultRowCount,
  isValidConnectionHandle,
  isValidDatabaseHandle,
  openDatabase,
  preparedColumnCount,
  prepareStatement,
  resetPreparedStatement,
} from "./native.ts";

import { executePreparedResult, executeSqlResult, LazyResult } from "./execution.ts";
import {
  createResultReader,
  getDouble,
  getInt32,
  getInt64,
  getString,
  getValue,
  isNull,
  iterateObjects,
  iterateRows,
  ResultReader,
} from "./value.ts";
import { ValidationError } from "../errors.ts";
import { setStrictValidation } from "../core/runtime.ts";

/**
 * Enable or disable strict index validation on FFI entry points.
 *
 * When enabled, index bounds are validated on public FFI entry points
 * (getResultColumnName, getResultColumnType, getResultColumnData,
 * getResultColumnValidity, isResultValueNull, readResultValueAsText).
 * This adds overhead but catches bugs during development.
 *
 * Defaults to false for performance.
 *
 * @param value - true to enable strict validation, false to disable
 *
 * @example
 * ```ts
 * import { setStrictValidation } from "@ggpwnkthx/duckdb/functional";
 *
 * // Enable validation during development
 * setStrictValidation(true);
 *
 * // Now invalid indexes will throw ValidationError
 * const result = executeSqlResult(conn, "SELECT 1 as a, 2 as b");
 * getResultColumnName(result, 999); // throws ValidationError
 *
 * // Disable for production
 * setStrictValidation(false);
 * ```
 */
export { setStrictValidation };

// Database

/**
 * Open a DuckDB database file or in-memory database.
 *
 * @param path - Optional database path (default: ":memory:" for in-memory database)
 * @param config - Optional database configuration including access mode
 * @returns A database handle for use in subsequent operations
 * @throws {DatabaseError} if the database cannot be opened
 *
 * @example
 * ```ts
 * // In-memory database
 * const db = await openDatabase();
 *
 * // File-based database
 * const db = await openDatabase("my.db");
 *
 * // With config
 * const db = await openDatabase("my.db", { accessMode: "read_only" });
 * ```
 */
export { openDatabase };

/**
 * Close a database handle and release associated resources.
 *
 * @param handle - A valid database handle
 *
 * @example
 * ```ts
 * const db = await openDatabase();
 * // ... use database
 * closeDatabase(db);
 * ```
 */
export { closeDatabase };

/**
 * Check if a database handle is valid (points to an open database).
 *
 * @param handle - A database handle to check
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * const db = await openDatabase();
 * console.log(isValidDatabaseHandle(db)); // true
 * closeDatabase(db);
 * console.log(isValidDatabaseHandle(db)); // false
 * ```
 */
export { isValidDatabaseHandle };

// Connection

/**
 * Create a connection to an open database.
 *
 * @param databaseHandle - An open database handle
 * @returns A connection handle for executing queries
 * @throws {DatabaseError} if connection fails
 *
 * @example
 * ```ts
 * const db = await openDatabase();
 * const conn = await connectToDatabase(db);
 * ```
 */
export { connectToDatabase };

/**
 * Close a connection handle and release associated resources.
 *
 * @param handle - A valid connection handle
 *
 * @example
 * ```ts
 * const conn = await connectToDatabase(db);
 * // ... use connection
 * closeConnection(conn);
 * ```
 */
export { closeConnection };

/**
 * Check if a connection handle is valid (points to an open connection).
 *
 * @param handle - A connection handle to check
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * const conn = await connectToDatabase(db);
 * console.log(isValidConnectionHandle(conn)); // true
 * closeConnection(conn);
 * console.log(isValidConnectionHandle(conn)); // false
 * ```
 */
export { isValidConnectionHandle };

// Prepared

/**
 * Prepare a SQL statement for execution with bound parameters.
 *
 * @param connectionHandle - An open connection handle
 * @param sql - SQL statement with parameter placeholders (e.g., $1, $2)
 * @returns A prepared statement handle
 * @throws {DatabaseError} if the statement cannot be prepared
 *
 * @example
 * ```ts
 * const stmt = prepareStatement(conn, "SELECT * FROM table WHERE id = $1");
 * ```
 */
export { prepareStatement };

/**
 * Bind parameters to a prepared statement.
 *
 * @param handle - A prepared statement handle
 * @param params - Array of values to bind
 * @throws {DatabaseError} if binding fails
 * @throws {ValidationError} if parameter type is unsupported
 *
 * @example
 * ```ts
 * const stmt = prepareStatement(conn, "SELECT * FROM table WHERE id = $1");
 * bindPreparedParameters(stmt, [42]);
 * ```
 */
export { bindPreparedParameters };

/**
 * Execute a prepared statement and return a result handle.
 *
 * @param handle - A prepared statement handle
 * @returns A result handle
 * @throws {DatabaseError} if execution fails
 *
 * @example
 * ```ts
 * const stmt = prepareStatement(conn, "SELECT * FROM table WHERE id = $1");
 * bindPreparedParameters(stmt, [42]);
 * const result = executePreparedStatement(stmt);
 * ```
 */
export { executePreparedStatement };

/**
 * Get the number of columns in a prepared statement's result set.
 *
 * @param handle - A prepared statement handle
 * @returns Number of columns
 *
 * @example
 * ```ts
 * const stmt = prepareStatement(conn, "SELECT a, b, c FROM table");
 * console.log(preparedColumnCount(stmt)); // 3n
 * ```
 */
export { preparedColumnCount };

/**
 * Reset a prepared statement, clearing all bound parameters.
 *
 * @param handle - A prepared statement handle
 *
 * @example
 * ```ts
 * const stmt = prepareStatement(conn, "SELECT * FROM table WHERE id = $1");
 * bindPreparedParameters(stmt, [1]);
 * // Use statement...
 * resetPreparedStatement(stmt);
 * bindPreparedParameters(stmt, [2]);
 * ```
 */
export { resetPreparedStatement };

/**
 * Destroy a prepared statement and free associated resources.
 *
 * @param handle - A prepared statement handle
 *
 * @example
 * ```ts
 * const stmt = prepareStatement(conn, "SELECT * FROM table");
 * // Use statement...
 * destroyPreparedStatement(stmt);
 * ```
 */
export { destroyPreparedStatement };
/** Value types that can be bound to prepared statement parameters. */
export type { BindValue };

// Result

/**
 * Destroy a result handle and free associated memory.
 *
 * @param handle - A valid result handle
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 1");
 * // ... use result
 * destroyResult(result);
 * ```
 */
export { destroyResult };

/**
 * Get the number of rows in a result.
 *
 * @param handle - A valid result handle
 * @returns Number of rows
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT * FROM table");
 * console.log(getResultRowCount(result));
 * ```
 */
export { getResultRowCount };

/**
 * Get the number of columns in a result.
 *
 * @param handle - A valid result handle
 * @returns Number of columns
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT a, b, c FROM table");
 * console.log(getResultColumnCount(result)); // 3n
 * ```
 */
export { getResultColumnCount };

/**
 * Get metadata about all columns in a result.
 *
 * @param handle - A valid result handle
 * @returns Array of column information
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT id, name FROM users");
 * const columns = getResultColumnInfos(result);
 * console.log(columns[0].name); // "id"
 * ```
 */
export { getResultColumnInfos };

/**
 * Get the name of a column by index.
 *
 * @param handle - A valid result handle
 * @param columnIndex - Column index (0-based)
 * @returns Column name
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT id, name FROM users");
 * console.log(getResultColumnName(result, 0)); // "id"
 * console.log(getResultColumnName(result, 1)); // "name"
 * ```
 */
export { getResultColumnName };

/**
 * Get the type of a column by index.
 *
 * @param handle - A valid result handle
 * @param columnIndex - Column index (0-based)
 * @returns Column type enum value
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT id FROM users");
 * console.log(getResultColumnType(result, 0)); // DUCKDB_TYPE.DUCKDB_TYPE_BIGINT
 * ```
 */
export { getResultColumnType };

// Execution

/**
 * Execute a SQL query and return a lazy result for iteration.
 *
 * @param connectionHandle - An open connection handle
 * @param sql - SQL query string
 * @returns A LazyResult for lazy iteration over rows
 * @throws {QueryError} if the query fails
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT * FROM users");
 * for (const row of result.rows()) {
 *   console.log(row);
 * }
 * result.close();
 * ```
 */
export { executeSqlResult };

/**
 * Execute a prepared statement and return a lazy result.
 *
 * @param statementHandle - A prepared statement handle
 * @returns A LazyResult for lazy iteration over rows
 * @throws {DatabaseError} if execution fails
 */
export { executePreparedResult };

/**
 * A lazy result that defers decoding until iteration.
 *
 * Provides methods for lazy iteration over query results, decoding rows on-demand
 * from an in-memory result buffer. Note that DuckDB materializes the full result
 * in memory when the query executes; this class only lazy-decodes individual rows
 * rather than materializing all row data upfront.
 */
export { LazyResult };

// Value

/**
 * Create a result reader from a result handle for value extraction.
 *
 * @param handle - A valid result handle
 * @returns A ResultReader instance
 *
 * @example
 * ```ts
 * const reader = createResultReader(resultHandle);
 * const value = reader.getValue(0, 0);
 * ```
 */
export { createResultReader };

/**
 * A class for reading values from a result set.
 *
 * Provides methods to access individual values, rows, and iterate
 * over the result set.
 */
export { ResultReader };

/**
 * Check if a value at a given position is null.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns true if the value is null
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT NULL, 'hello'");
 * console.log(isNull(result, 0, 0)); // true
 * console.log(isNull(result, 0, 1)); // false
 * ```
 */
export { isNull };

/**
 * Get a value at a given position (any type).
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns The value at the position
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 42, 'test'");
 * const value = getValue(result, 0, 0);
 * console.log(value); // 42
 * ```
 */
export { getValue };

/**
 * Get an integer value at a given position.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns Integer value or null if not an integer
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 42");
 * const value = getInt32(result, 0, 0);
 * console.log(value); // 42
 * ```
 */
export { getInt32 };

/**
 * Get a bigint value at a given position.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns BigInt value or null if not a bigint
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 1234567890123");
 * const value = getInt64(result, 0, 0);
 * console.log(value); // 1234567890123n
 * ```
 */
export { getInt64 };

/**
 * Get a double value at a given position.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns Double value or null if not a number
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 3.14159");
 * const value = getDouble(result, 0, 0);
 * console.log(value); // 3.14159
 * ```
 */
export { getDouble };

/**
 * Get a string value at a given position.
 *
 * @param result - A LazyResult or ResultReader
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns String value or null if not a string
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT 'hello'");
 * const value = getString(result, 0, 0);
 * console.log(value); // "hello"
 * ```
 */
export { getString };

/**
 * Iterate over rows as arrays.
 *
 * @param result - A LazyResult or ResultReader
 * @yields Row data arrays
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT * FROM users");
 * for (const row of iterateRows(result)) {
 *   console.log(row);
 * }
 * ```
 */
export { iterateRows };

/**
 * Iterate over rows as objects.
 *
 * @param result - A LazyResult or ResultReader
 * @yields Row data objects with column names as keys
 *
 * @example
 * ```ts
 * const result = executeSqlResult(conn, "SELECT id, name FROM users");
 * for (const obj of iterateObjects(result)) {
 *   console.log(obj.name);
 * }
 * ```
 */
export { iterateObjects };

// ============================================
// Aliases for user-friendly API names
// ============================================

// Database aliases
/** Alias for {@link openDatabase}. */
export const open = openDatabase;
/** Alias for {@link isValidDatabaseHandle}. */
export const isValidDatabase = isValidDatabaseHandle;

// Connection aliases
/** Alias for {@link connectToDatabase}. */
export const create = connectToDatabase;
/** Alias for {@link isValidConnectionHandle}. */
export const isValidConnection = isValidConnectionHandle;

// Prepared statement aliases
/** Alias for {@link bindPreparedParameters}. */
export const bind = bindPreparedParameters;
/** Alias for {@link prepareStatement}. */
export const prepare = prepareStatement;
/** Alias for {@link executePreparedStatement}. */
export const executePrepared = executePreparedStatement;
/** Alias for {@link resetPreparedStatement}. */
export const resetPrepared = resetPreparedStatement;
/** Alias for {@link destroyPreparedStatement}. */
export const destroyPrepared = destroyPreparedStatement;

// Result aliases - use native functions which handle ResultHandle
/** Alias for {@link getResultRowCount}. */
export const rowCount = getResultRowCount;
/** Alias for {@link getResultColumnCount}. */
export const columnCount = getResultColumnCount;

/**
 * Execute a query and return an array of rows.
 *
 * @param connectionHandle - An open connection handle
 * @param sql - SQL query string
 * @returns An array of rows, or null if the query fails
 * @throws {ValidationError} if the SQL is empty
 *
 * @example
 * ```ts
 * const rows = query(conn, "SELECT * FROM users");
 * if (rows) {
 *   for (const row of rows) {
 *     console.log(row);
 *   }
 * }
 * ```
 */
export function query(
  connectionHandle: ConnectionHandle,
  sql: string,
): RowData[] | null {
  try {
    const result = executeSqlResult(connectionHandle, sql);
    if (!result) return null;
    try {
      return [...result.rows()];
    } finally {
      result.close();
    }
  } catch (e) {
    // Re-throw validation errors - they indicate bad input
    if (e instanceof ValidationError) {
      throw e;
    }
    // Return null for other errors (like query execution failures)
    return null;
  }
}

/**
 * Execute a query and return an array of object rows.
 *
 * @param connectionHandle - An open connection handle
 * @param sql - SQL query string
 * @returns An array of object rows, or null if the query fails
 * @throws {ValidationError} if the SQL is empty
 *
 * @example
 * ```ts
 * const rows = queryObjects(conn, "SELECT id, name FROM users");
 * if (rows) {
 *   for (const obj of rows) {
 *     console.log(obj.name);
 *   }
 * }
 * ```
 */
export function queryObjects(
  connectionHandle: ConnectionHandle,
  sql: string,
): ObjectRow[] | null {
  try {
    const result = executeSqlResult(connectionHandle, sql);
    if (!result) return null;
    try {
      return [...result.objects()];
    } finally {
      result.close();
    }
  } catch (e) {
    // Re-throw validation errors - they indicate bad input
    if (e instanceof ValidationError) {
      throw e;
    }
    // Return null for other errors (like query execution failures)
    return null;
  }
}
