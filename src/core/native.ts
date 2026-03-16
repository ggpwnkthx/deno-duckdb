/**
 * Shared FFI operations used by both public APIs.
 */

import type { DUCKDB_TYPE } from "@ggpwnkthx/libduckdb/enums";
import type {
  ColumnInfo,
  ConnectionHandle,
  DatabaseConfig,
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
  toPointerValue,
  validateConnectionHandle,
  validateDatabaseHandle,
  validatePreparedStatementHandle,
  validateResultHandle,
} from "./handles.ts";
import { getLibrary, getLibraryFast } from "./library.ts";
import { stringToCStringPointer } from "./strings.ts";
import {
  assertFiniteNumber,
  assertIntegerIndex,
  assertNonEmptyString,
  assertSafeInteger,
} from "./validate.ts";
import { normalizeDatabaseConfig } from "./config.ts";

const encoder = new TextEncoder();

function readCString(pointer: Deno.PointerValue<unknown>): string | null {
  const view = createPointerView(pointer);
  return view?.getCString() ?? null;
}

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

function resultErrorMessage(handle: ResultHandle, fallback: string): string {
  const library = getLibraryFast();
  return readCString(library.symbols.duckdb_result_error(handle)) ?? fallback;
}

function preparedErrorMessage(
  handle: PreparedStatementHandle,
  fallback: string,
): string {
  const library = getLibraryFast();
  const statementPointer = requireOpaqueHandle(
    handle,
    "PreparedStatementHandle",
  );
  return readCString(library.symbols.duckdb_prepare_error(statementPointer)) ??
    fallback;
}

export type BindValue = boolean | number | bigint | string | Uint8Array | null;

export async function openDatabase(
  config?: DatabaseConfig,
): Promise<DatabaseHandle> {
  const library = await getLibrary();
  const handle = createDatabaseHandle();
  const normalized = normalizeDatabaseConfig(config);
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
        : readOwnedCString(toPointerValue(errorPointerValue)) ??
          "Failed to open database";

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

export function closeDatabase(handle: DatabaseHandle): void {
  validateDatabaseHandle(handle);
  const library = getLibraryFast();
  if (isValidHandle(handle)) {
    library.symbols.duckdb_close(handle);
  }
}

export function isValidDatabaseHandle(handle: DatabaseHandle): boolean {
  validateDatabaseHandle(handle);
  return isValidHandle(handle);
}

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

export function closeConnection(handle: ConnectionHandle): void {
  validateConnectionHandle(handle);
  const library = getLibraryFast();

  if (isValidHandle(handle)) {
    library.symbols.duckdb_disconnect(handle);
  }
}

export function isValidConnectionHandle(handle: ConnectionHandle): boolean {
  validateConnectionHandle(handle);
  return isValidHandle(handle);
}

/**
 * Execute a SQL query and return the native result handle.
 * Higher layers wrap this in lazy result objects.
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

export function destroyResult(handle: ResultHandle): void {
  validateResultHandle(handle);
  const library = getLibraryFast();
  library.symbols.duckdb_destroy_result(handle);
}

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

export function preparedColumnCount(
  handle: PreparedStatementHandle,
): bigint {
  validatePreparedStatementHandle(handle);
  const library = getLibraryFast();

  return library.symbols.duckdb_prepared_statement_column_count(
    requireOpaqueHandle(handle, "PreparedStatementHandle"),
  );
}

export function resetPreparedStatement(handle: PreparedStatementHandle): void {
  validatePreparedStatementHandle(handle);
  const library = getLibraryFast();
  library.symbols.duckdb_clear_bindings(
    requireOpaqueHandle(handle, "PreparedStatementHandle"),
  );
}

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

export function destroyPreparedStatement(
  handle: PreparedStatementHandle,
): void {
  validatePreparedStatementHandle(handle);
  const library = getLibraryFast();

  if (isValidHandle(handle)) {
    library.symbols.duckdb_destroy_prepare(handle);
  }
}

export function getResultRowCount(handle: ResultHandle): bigint {
  validateResultHandle(handle);
  return getLibraryFast().symbols.duckdb_row_count(handle);
}

export function getResultColumnCount(handle: ResultHandle): bigint {
  validateResultHandle(handle);
  return getLibraryFast().symbols.duckdb_column_count(handle);
}

export function getResultColumnName(
  handle: ResultHandle,
  columnIndex: number,
): string {
  validateResultHandle(handle);
  const pointer = getLibraryFast().symbols.duckdb_column_name(
    handle,
    BigInt(columnIndex),
  );

  return readCString(pointer) ?? "";
}

export function getResultColumnType(
  handle: ResultHandle,
  columnIndex: number,
): DUCKDB_TYPE {
  validateResultHandle(handle);
  return getLibraryFast().symbols.duckdb_column_type(
    handle,
    BigInt(columnIndex),
  ) as DUCKDB_TYPE;
}

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

export function getResultColumnData(
  handle: ResultHandle,
  columnIndex: number,
): Deno.UnsafePointerView | null {
  validateResultHandle(handle);
  return createPointerView(
    getLibraryFast().symbols.duckdb_column_data(handle, BigInt(columnIndex)),
  );
}

/**
 * Gets the validity mask (null bitmap) for a column.
 * Returns null if the column has no null values (DuckDB optimization).
 * The validity mask uses: 1 = valid (not null), 0 = null.
 */
export function getResultColumnValidity(
  handle: ResultHandle,
  columnIndex: number,
): Deno.UnsafePointerView | null {
  validateResultHandle(handle);

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

export function isResultValueNull(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): boolean {
  validateResultHandle(handle);

  return Boolean(
    getLibraryFast().symbols.duckdb_value_is_null(
      handle,
      BigInt(columnIndex),
      BigInt(rowIndex),
    ),
  );
}

export function readResultValueAsText(
  handle: ResultHandle,
  rowIndex: number,
  columnIndex: number,
): string | null {
  validateResultHandle(handle);
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
