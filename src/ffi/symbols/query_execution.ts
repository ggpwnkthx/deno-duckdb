//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/query_execution.ts
// Query Execution - FFI functions for executing SQL queries in DuckDB
//===--------------------------------------------------------------------===//

import { duckdb_connection, duckdb_logical_type, duckdb_result } from "../structs.ts";

export default {
  /**
   * Executes a SQL query on a specified connection, storing the result in `out_result`.
   *
   * @param connection - The DuckDB connection buffer (`duckdb_connection`).
   * @param query - UTF-8 buffer containing the SQL query string.
   * @param out_result - Pointer for receiving the query result (`duckdb_result*`).
   * @returns `duckdb_state` as an unsigned 32-bit integer, indicating the success or failure of the operation.
   */
  duckdb_query: {
    parameters: [duckdb_connection, "buffer", "pointer"],
    result: "i32",
  },

  /**
   * Releases memory associated with a query result buffer.
   *
   * @param result - Pointer to the result buffer (`duckdb_result*`) to be destroyed.
   * @returns Void.
   */
  duckdb_destroy_result: {
    parameters: ["pointer"],
    result: "void",
  },

  /**
   * Retrieves the name of a specified column in the query result.
   *
   * @param result - Pointer to the result buffer (`duckdb_result*`).
   * @param col - Index of the column (`idx_t`).
   * @returns Pointer to the column name (`const char*`), or `NULL` if index is out of range.
   */
  duckdb_column_name: {
    parameters: ["pointer", "u64"],
    result: "pointer",
  },

  /**
   * Gets the data type of a specified column in the query result.
   *
   * @param result - Pointer to the result buffer (`duckdb_result*`).
   * @param col - Column index (`idx_t`).
   * @returns `duckdb_type` as an unsigned 32-bit integer.
   */
  duckdb_column_type: {
    parameters: ["pointer", "u64"],
    result: "u32",
  },

  /**
   * Returns the SQL statement type executed, such as SELECT or INSERT.
   *
   * @param result - The result buffer (`duckdb_result`) from which to fetch the statement type.
   * @returns `duckdb_result_type` as an unsigned 32-bit integer.
   */
  duckdb_result_statement_type: {
    parameters: [duckdb_result],
    result: "u32",
  },

  /**
   * Gets the logical data type of a specified column in the result.
   *
   * @param result - Pointer to the result buffer (`duckdb_result*`).
   * @param col - Column index (`idx_t`).
   * @returns `duckdb_logical_type`: The column’s logical type buffer, or `NULL` if out of range.
   */
  duckdb_column_logical_type: {
    parameters: ["pointer", "u64"],
    result: duckdb_logical_type,
  },

  /**
   * Returns the number of columns in the result.
   *
   * @param result - Pointer to the result buffer (`duckdb_result*`).
   * @returns `uint64_t`: Column count.
   */
  duckdb_column_count: {
    parameters: ["pointer"],
    result: "u64",
  },

  /**
   * Gets the number of rows changed by a data-modifying query.
   *
   * @param result - Pointer to the result buffer (`duckdb_result*`).
   * @returns `uint64_t`: Number of rows changed, or 0 for non-modifying queries.
   */
  duckdb_rows_changed: {
    parameters: ["pointer"],
    result: "u64",
  },

  /**
   * Fetches the error message from the result buffer if an error occurred.
   *
   * @param result - Pointer to the result buffer (`duckdb_result*`).
   * @returns Buffer containing the error message (`const char*`), or `NULL` if no error.
   */
  duckdb_result_error: {
    parameters: ["pointer"],
    result: "buffer",
  },

  /**
   * Gets the error type from the result buffer if an error occurred.
   *
   * @param result - Pointer to the result buffer (`duckdb_result*`).
   * @returns `duckdb_error_type` as an unsigned 32-bit integer.
   */
  duckdb_result_error_type: {
    parameters: ["pointer"],
    result: "i32",
  },
} as const satisfies Deno.ForeignLibraryInterface;
