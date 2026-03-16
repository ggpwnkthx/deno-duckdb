/**
 * Public functional API.
 */

import type { ConnectionHandle, ObjectRow, RowData } from "../types.ts";

// Import core functions with names we can use internally
import {
  // Prepared
  bindPreparedParameters,
  closeConnection,
  // Database
  closeDatabase,
  // Connection
  connectToDatabase,
  destroyPreparedStatement,
  destroyPreparedStatementSync,
  // Result
  destroyResult,
  destroyResultSync,
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
  resetPreparedStatementSync,
} from "../core/native.ts";

// Import from handles
import {
  getPointerValue,
  getPointerValue as getPointerValueConnection,
  validateConnectionHandle,
  validateDatabaseHandle,
} from "../core/handles.ts";

import type { BindValue } from "../core/native.ts";
import {
  executePreparedResult,
  executeSqlResult,
  LazyResult,
} from "../core/execution.ts";
import {
  clearResultCache,
  getResultCacheSize,
  invalidateCachedQuery,
} from "../core/result_cache.ts";
import {
  createResultReader,
  fetchAll,
  fetchObjects,
  getDouble,
  getInt32,
  getInt64,
  getString,
  getValue,
  getValueByType,
  isNull,
  iterateObjects,
  iterateRows,
  ResultReader,
} from "./value.ts";
import {
  DatabaseError,
  DuckDBError,
  InvalidResourceError,
  QueryError,
  ValidationError,
} from "../errors.ts";

// ============================================
// Re-export everything
// ============================================

// Database
export { closeDatabase, isValidDatabaseHandle, openDatabase };
export { getPointerValue, validateDatabaseHandle };

// Connection
export { closeConnection, connectToDatabase, isValidConnectionHandle };
export { getPointerValueConnection, validateConnectionHandle };

// Prepared
export {
  bindPreparedParameters,
  destroyPreparedStatement,
  destroyPreparedStatementSync,
  executePreparedStatement,
  preparedColumnCount,
  prepareStatement,
  resetPreparedStatement,
  resetPreparedStatementSync,
};
export type { BindValue };

// Result
export {
  destroyResult,
  destroyResultSync,
  getResultColumnCount,
  getResultColumnInfos,
  getResultColumnName,
  getResultColumnType,
  getResultRowCount,
};

// Execution
export { executePreparedResult, executeSqlResult, LazyResult };

// Cache
export { clearResultCache, getResultCacheSize, invalidateCachedQuery };

// Value
export {
  createResultReader,
  fetchAll,
  fetchObjects,
  getDouble,
  getInt32,
  getInt64,
  getString,
  getValue,
  getValueByType,
  isNull,
  iterateObjects,
  iterateRows,
  ResultReader,
};

// Errors
export {
  DatabaseError,
  DuckDBError,
  InvalidResourceError,
  QueryError,
  ValidationError,
};

// ============================================
// Aliases for user-friendly API names
// ============================================

// Database aliases
export const open = openDatabase;
export const isValidDatabase = isValidDatabaseHandle;

// Connection aliases
export const create = connectToDatabase;
export const isValidConnection = isValidConnectionHandle;

// Prepared statement aliases
export const bind = bindPreparedParameters;
export const prepare = prepareStatement;
export const executePrepared = executePreparedStatement;
export const resetPrepared = resetPreparedStatement;
export const resetPreparedSync = resetPreparedStatementSync;
export const destroyPrepared = destroyPreparedStatement;
export const destroyPreparedSync = destroyPreparedStatementSync;

// Result aliases - use native functions which handle ResultHandle
export const rowCount = getResultRowCount;
export const columnCount = getResultColumnCount;

/**
 * Execute a query and return an iterable of rows.
 * Returns null if the query fails (except for validation errors which propagate).
 * Use .toArray() on the result to get an array of rows.
 */
export function query(
  connectionHandle: ConnectionHandle,
  sql: string,
): IterableIterator<RowData> | null {
  try {
    const result = executeSqlResult(connectionHandle, sql);
    return result ? result.rows() : null;
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
 * Execute a query and return an iterable of object rows.
 * Returns null if the query fails (except for validation errors which propagate).
 * Use .toObjectArray() on the result to get an array of objects.
 */
export function queryObjects(
  connectionHandle: ConnectionHandle,
  sql: string,
): IterableIterator<ObjectRow> | null {
  try {
    const result = executeSqlResult(connectionHandle, sql);
    return result ? result.objects() : null;
  } catch (e) {
    // Re-throw validation errors - they indicate bad input
    if (e instanceof ValidationError) {
      throw e;
    }
    // Return null for other errors (like query execution failures)
    return null;
  }
}

export const executeObjects = queryObjects;
