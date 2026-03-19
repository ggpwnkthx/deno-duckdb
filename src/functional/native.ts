/**
 * Low-level FFI operations for DuckDB.
 *
 * Provides direct FFI bindings to DuckDB's C API. This module handles:
 * - Database/connection/prepared statement lifecycle
 * - Query execution and result handling
 * - Parameter binding for prepared statements
 * - Value extraction from result sets
 *
 * Used internally by both the functional and objective public APIs.
 */

import type { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type {
  ColumnInfo,
  ConnectionHandle,
  DatabaseHandle,
  PreparedStatementHandle,
  ResultHandle,
} from "../types.ts";
import { DatabaseError, QueryError, ValidationError } from "../errors.ts";
import {
  createConnectionHandle,
  createDatabaseHandle,
  createPointerView,
  createPreparedStatementHandle,
  createResultHandle,
  getPointerValue,
  isValidHandle,
  requireOpaqueHandle,
  toDenoPointerValue,
  validateConnectionHandle,
  validateDatabaseHandle,
  validatePreparedStatementHandle,
  validateResultHandle,
} from "../core/handles.ts";
import { getLibrary, getLibraryFast } from "../core/library.ts";
import { stringToCStringPointer } from "../core/strings.ts";
import {
  assertFiniteNumber,
  assertIntegerIndex,
  assertNonEmptyString,
  assertSafeInteger,
} from "../core/validate.ts";
import { configToFFI, validateDatabaseOpenConfig } from "../core/config/mod.ts";
import type { DatabaseOpenConfig } from "../core/config/schema/mod.ts";

const encoder = new TextEncoder();

/**
 * Read a null-terminated C string from a pointer.
 *
 * @internal
 * @param pointer - Pointer to C string
 * @returns JavaScript string, or null if pointer is null
 */
function readCString(pointer: Deno.PointerValue<unknown>): string | null {
  const view = createPointerView(pointer);
  return view?.getCString() ?? null;
}

/**
 * Read and free a C string allocated by DuckDB.
 *
 * @internal
 * @param pointer - Pointer to owned C string
 * @returns JavaScript string, or null if pointer is null
 */
function readOwnedCString(pointer: Deno.PointerValue<unknown>): string | null {
  if (!pointer) {
    return null;
  }

  const library = getLibraryFast();
  const message = readCString(pointer);

  try {
    library.symbols.duckdb_free(pointer);
  } catch {
    // Ignore secondary cleanup failure for a best-effort error read.
  }

  return message;
}

/**
 * Extract error message from a result handle.
 *
 * @internal
 * @param handle - Result handle to check
 * @param fallback - Message if no error is available
 * @returns Error message string
 */
function resultErrorMessage(handle: ResultHandle, fallback: string): string {
  const library = getLibraryFast();
  return readCString(library.symbols.duckdb_result_error(handle)) ?? fallback;
}

/**
 * Extract error message from a prepared statement handle.
 *
 * @internal
 * @param handle - Prepared statement handle to check
 * @param fallback - Message if no error is available
 * @returns Error message string
 */
function preparedErrorMessage(
  handle: PreparedStatementHandle,
  fallback: string,
): string {
  const library = getLibraryFast();
  const statementPointer = requireOpaqueHandle(
    handle,
    "PreparedStatementHandle",
  );
  return readCString(library.symbols.duckdb_prepare_error(statementPointer))
    ?? fallback;
}

/**
 * Value types that can be bound to prepared statement parameters.
 *
 * Supports boolean, number, bigint, string, binary (Uint8Array),
 * and null values for parameter binding.
 */
export type BindValue = boolean | number | bigint | string | Uint8Array | null;

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
 * const db = await openDatabase("my.db", { access_mode: "READ_ONLY" });
 * ```
 */
export async function openDatabase(
  path?: string,
  config?: DatabaseOpenConfig,
): Promise<DatabaseHandle> {
  // Validate config before normalization
  if (config) {
    validateDatabaseOpenConfig(config);
  }

  const library = await getLibrary();
  const handle = createDatabaseHandle();
  const normalized = configToFFI(path, config);
  const pathPointer = stringToCStringPointer(normalized.path);

  if (normalized.options.length === 0) {
    const state = library.symbols.duckdb_open(pathPointer, handle);
    if (state !== 0) {
      throw new DatabaseError("Failed to open database", {
        path: normalized.path,
      });
    }

    return handle;
  }

  const configHandle = createDatabaseHandle();
  const createState = library.symbols.duckdb_create_config(configHandle);
  if (createState !== 0) {
    throw new DatabaseError("Failed to create DuckDB config");
  }

  try {
    const configPointerValue = getPointerValue(configHandle);
    if (configPointerValue === 0n) {
      throw new DatabaseError("DuckDB returned a null config pointer");
    }

    const configPointer = configPointerValue;

    for (const option of normalized.options) {
      const namePointer = stringToCStringPointer(option.name);
      const valuePointer = stringToCStringPointer(option.value);
      const state = library.symbols.duckdb_set_config(
        configPointer,
        namePointer,
        valuePointer,
      );

      if (state !== 0) {
        throw new DatabaseError(
          `Failed to set config option: ${option.name}`,
          { name: option.name, value: option.value },
        );
      }
    }

    const errorHandle = createDatabaseHandle();
    const openState = library.symbols.duckdb_open_ext(
      pathPointer,
      handle,
      configPointer,
      errorHandle,
    );

    if (openState !== 0) {
      const errorPointerValue = getPointerValue(errorHandle);
      const errorMessage = errorPointerValue === 0n
        ? "Failed to open database"
        : readOwnedCString(toDenoPointerValue(errorPointerValue))
          ?? "Failed to open database";

      throw new DatabaseError(errorMessage, {
        path: normalized.path,
        optionCount: normalized.options.length,
      });
    }

    return handle;
  } finally {
    library.symbols.duckdb_destroy_config(configHandle);
  }
}

/**
 * Close a database handle and release associated resources.
 *
 * @param handle - A valid database handle
 */
export function closeDatabase(handle: DatabaseHandle): void {
  validateDatabaseHandle(handle);
  const library = getLibraryFast();
  if (isValidHandle(handle)) {
    library.symbols.duckdb_close(handle);
  }
}

/**
 * Check if a database handle is valid (points to an open database).
 *
 * @param handle - A database handle to check
 * @returns true if valid, false otherwise
 */
export function isValidDatabaseHandle(handle: DatabaseHandle): boolean {
  validateDatabaseHandle(handle);
  return isValidHandle(handle);
}

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
export async function connectToDatabase(
  databaseHandle: DatabaseHandle,
): Promise<ConnectionHandle> {
  validateDatabaseHandle(databaseHandle);
  const library = await getLibrary();
  const handle = createConnectionHandle();

  const state = library.symbols.duckdb_connect(
    requireOpaqueHandle(databaseHandle, "DatabaseHandle"),
    handle,
  );

  if (state !== 0) {
    throw new DatabaseError("Failed to connect to database");
  }

  return handle;
}

/**
 * Close a connection handle and release associated resources.
 *
 * @param handle - A valid connection handle
 */
export function closeConnection(handle: ConnectionHandle): void {
  validateConnectionHandle(handle);
  const library = getLibraryFast();

  if (isValidHandle(handle)) {
    library.symbols.duckdb_disconnect(handle);
  }
}

/**
 * Check if a connection handle is valid (points to an open connection).
 *
 * @param handle - A connection handle to check
 * @returns true if valid, false otherwise
 */
export function isValidConnectionHandle(handle: ConnectionHandle): boolean {
  validateConnectionHandle(handle);
  return isValidHandle(handle);
}

/**
 * Execute a SQL query and return a result handle.
 *
 * @param connectionHandle - An open connection handle
 * @param sql - SQL query string
 * @returns A result handle for reading query results
 * @throws {QueryError} if the query fails
 */
export function executeQuery(
  connectionHandle: ConnectionHandle,
  sql: string,
): ResultHandle {
  validateConnectionHandle(connectionHandle);
  const normalizedSql = assertNonEmptyString(sql, "SQL query");

  const library = getLibraryFast();
  const handle = createResultHandle();
  const sqlPointer = stringToCStringPointer(normalizedSql);

  const state = library.symbols.duckdb_query(
    requireOpaqueHandle(connectionHandle, "ConnectionHandle"),
    sqlPointer,
    handle,
  );

  if (state !== 0) {
    const message = resultErrorMessage(handle, "Query failed");
    library.symbols.duckdb_destroy_result(handle);
    throw new QueryError(message, normalizedSql);
  }

  return handle;
}

/**
 * Destroy a result handle and free associated memory.
 *
 * @param handle - A valid result handle
 */
export function destroyResult(handle: ResultHandle): void {
  validateResultHandle(handle);
  const library = getLibraryFast();
  library.symbols.duckdb_destroy_result(handle);
}

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
export function prepareStatement(
  connectionHandle: ConnectionHandle,
  sql: string,
): PreparedStatementHandle {
  validateConnectionHandle(connectionHandle);
  const normalizedSql = assertNonEmptyString(sql, "SQL statement");

  const library = getLibraryFast();
  const handle = createPreparedStatementHandle();
  const sqlPointer = stringToCStringPointer(normalizedSql);

  const state = library.symbols.duckdb_prepare(
    requireOpaqueHandle(connectionHandle, "ConnectionHandle"),
    sqlPointer,
    handle,
  );

  if (state !== 0) {
    const message = preparedErrorMessage(handle, "Failed to prepare statement");
    library.symbols.duckdb_destroy_prepare(handle);
    throw new DatabaseError(message, { sql: normalizedSql });
  }

  return handle;
}

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
export function executePreparedStatement(
  handle: PreparedStatementHandle,
): ResultHandle {
  validatePreparedStatementHandle(handle);

  const library = getLibraryFast();
  const result = createResultHandle();

  const state = library.symbols.duckdb_execute_prepared(
    requireOpaqueHandle(handle, "PreparedStatementHandle"),
    result,
  );

  if (state !== 0) {
    const message = resultErrorMessage(result, "Failed to execute statement");
    library.symbols.duckdb_destroy_result(result);
    throw new DatabaseError(message);
  }

  return result;
}

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
export function preparedColumnCount(
  handle: PreparedStatementHandle,
): bigint {
  validatePreparedStatementHandle(handle);
  const library = getLibraryFast();

  return library.symbols.duckdb_prepared_statement_column_count(
    requireOpaqueHandle(handle, "PreparedStatementHandle"),
  );
}

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
export function resetPreparedStatement(handle: PreparedStatementHandle): void {
  validatePreparedStatementHandle(handle);
  const library = getLibraryFast();
  library.symbols.duckdb_clear_bindings(
    requireOpaqueHandle(handle, "PreparedStatementHandle"),
  );
}

/**
 * Throw a binding error with contextual information.
 *
 * @internal
 * @param index - Parameter index that failed
 * @param value - Value that failed to bind
 * @param cause - Optional underlying error
 * @throws {DatabaseError} always
 */
function bindFailure(
  index: number,
  value: BindValue,
  cause?: unknown,
): never {
  throw new DatabaseError(
    `Failed to bind parameter at index ${index + 1}`,
    {
      index,
      valueType: value === null ? "null" : typeof value,
      byteLength: value instanceof Uint8Array ? value.byteLength : undefined,
    },
    cause,
  );
}

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
export function bindPreparedParameters(
  handle: PreparedStatementHandle,
  params: readonly BindValue[],
): void {
  validatePreparedStatementHandle(handle);
  resetPreparedStatement(handle);

  const library = getLibraryFast();
  const statementPointer = requireOpaqueHandle(
    handle,
    "PreparedStatementHandle",
  );

  for (let index = 0; index < params.length; index += 1) {
    const parameterIndex = BigInt(index + 1);
    const value = params[index];

    let state = 0;
    if (value === null) {
      state = library.symbols.duckdb_bind_null(
        statementPointer,
        parameterIndex,
      );
    } else if (typeof value === "boolean") {
      state = library.symbols.duckdb_bind_boolean(
        statementPointer,
        parameterIndex,
        value ? 1 : 0,
      );
    } else if (typeof value === "number") {
      assertFiniteNumber(value, `Parameter ${index + 1}`);

      if (Number.isInteger(value)) {
        assertSafeInteger(value, `Parameter ${index + 1}`);

        if (value >= -2147483648 && value <= 2147483647) {
          state = library.symbols.duckdb_bind_int32(
            statementPointer,
            parameterIndex,
            value,
          );
        } else {
          state = library.symbols.duckdb_bind_int64(
            statementPointer,
            parameterIndex,
            BigInt(value),
          );
        }
      } else {
        state = library.symbols.duckdb_bind_double(
          statementPointer,
          parameterIndex,
          value,
        );
      }
    } else if (typeof value === "bigint") {
      state = library.symbols.duckdb_bind_int64(
        statementPointer,
        parameterIndex,
        value,
      );
    } else if (typeof value === "string") {
      state = library.symbols.duckdb_bind_varchar_length(
        statementPointer,
        parameterIndex,
        stringToCStringPointer(value),
        BigInt(encoder.encode(value).byteLength),
      );
    } else if (value instanceof Uint8Array) {
      const ownedBytes = new Uint8Array(value);
      const pointer = Deno.UnsafePointer.of(ownedBytes);
      if (!pointer) {
        bindFailure(index, value);
      }

      state = library.symbols.duckdb_bind_blob(
        statementPointer,
        parameterIndex,
        pointer,
        BigInt(ownedBytes.byteLength),
      );
    } else {
      throw new ValidationError("Unsupported parameter type", {
        index,
        type: typeof value,
      });
    }

    if (state !== 0) {
      bindFailure(index, value);
    }
  }
}

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
export function destroyPreparedStatement(
  handle: PreparedStatementHandle,
): void {
  validatePreparedStatementHandle(handle);
  const library = getLibraryFast();

  if (isValidHandle(handle)) {
    library.symbols.duckdb_destroy_prepare(handle);
  }
}

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
export function getResultRowCount(handle: ResultHandle): bigint {
  validateResultHandle(handle);
  return getLibraryFast().symbols.duckdb_row_count(handle);
}

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
export function getResultColumnCount(handle: ResultHandle): bigint {
  validateResultHandle(handle);
  return getLibraryFast().symbols.duckdb_column_count(handle);
}

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
export function getResultColumnName(
  handle: ResultHandle,
  columnIndex: number,
): string {
  const columnCount = Number(getResultColumnCount(handle));
  assertIntegerIndex(columnIndex, "Column index", columnCount);

  const pointer = getLibraryFast().symbols.duckdb_column_name(
    handle,
    BigInt(columnIndex),
  );

  return readCString(pointer) ?? "";
}

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
export function getResultColumnType(
  handle: ResultHandle,
  columnIndex: number,
): DUCKDB_TYPE {
  const columnCount = Number(getResultColumnCount(handle));
  assertIntegerIndex(columnIndex, "Column index", columnCount);

  return getLibraryFast().symbols.duckdb_column_type(
    handle,
    BigInt(columnIndex),
  ) as DUCKDB_TYPE;
}

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
export function getResultColumnInfos(handle: ResultHandle): ColumnInfo[] {
  const count = Number(getResultColumnCount(handle));
  const columns: ColumnInfo[] = [];

  for (let index = 0; index < count; index += 1) {
    columns.push({
      name: getResultColumnName(handle, index),
      type: getResultColumnType(handle, index),
    });
  }

  return columns;
}

/**
 * Get the data pointer for a column.
 *
 * @param handle - A valid result handle
 * @param columnIndex - Column index (0-based)
 * @returns Pointer to column data, or null if unavailable
 */
export function getResultColumnData(
  handle: ResultHandle,
  columnIndex: number,
): Deno.UnsafePointerView | null {
  const columnCount = Number(getResultColumnCount(handle));
  assertIntegerIndex(columnIndex, "Column index", columnCount);

  return createPointerView(
    getLibraryFast().symbols.duckdb_column_data(handle, BigInt(columnIndex)),
  );
}

/**
 * Get the validity mask (null bitmap) for a column.
 *
 * Returns null if the column has no null values (DuckDB optimization).
 * The validity mask uses: 1 = valid (not null), 0 = null.
 *
 * @param handle - A valid result handle
 * @param columnIndex - Column index (0-based)
 * @returns Pointer to validity mask, or null if all values are non-null
 */
export function getResultColumnValidity(
  handle: ResultHandle,
  columnIndex: number,
): Deno.UnsafePointerView | null {
  const columnCount = Number(getResultColumnCount(handle));
  assertIntegerIndex(columnIndex, "Column index", columnCount);

  const library = getLibraryFast();
  const validityFn =
    (library.symbols as Record<string, unknown>)["duckdb_column_validity"] as
      | ((handle: ResultHandle, col: bigint) => Deno.PointerValue<unknown>)
      | undefined;

  if (!validityFn) {
    return null;
  }

  const pointer = validityFn(handle, BigInt(columnIndex));
  return createPointerView(pointer);
}

/**
 * Check if a value in a result is null.
 *
 * @param handle - A valid result handle
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns true if the value is null
 */
export function isResultValueNull(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): boolean {
  const rowCount = Number(getResultRowCount(handle));
  const columnCount = Number(getResultColumnCount(handle));
  assertIntegerIndex(rowIndex, "Row index", rowCount);
  assertIntegerIndex(columnIndex, "Column index", columnCount);

  return Boolean(
    getLibraryFast().symbols.duckdb_value_is_null(
      handle,
      BigInt(columnIndex),
      BigInt(rowIndex),
    ),
  );
}

/**
 * Read a value as text using DuckDB's legacy conversion.
 *
 * @param handle - A valid result handle
 * @param rowIndex - Row index (0-based)
 * @param columnIndex - Column index (0-based)
 * @returns String value, or null if the value is null
 */
export function readResultValueAsText(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): string | null {
  const rowCount = Number(getResultRowCount(handle));
  const columnCount = Number(getResultColumnCount(handle));
  assertIntegerIndex(rowIndex, "Row index", rowCount);
  assertIntegerIndex(columnIndex, "Column index", columnCount);

  if (isResultValueNull(handle, rowIndex, columnIndex)) {
    return null;
  }

  const pointer = getLibraryFast().symbols.duckdb_value_varchar(
    handle,
    BigInt(columnIndex),
    BigInt(rowIndex),
  );

  return readOwnedCString(pointer);
}
