//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/query_execution.ts
// Query Execution - FFI functions for executing SQL queries in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Executes a SQL query on a given connection and stores the result in the `out_result` buffer.
   * 
   * If the query fails, `DuckDBError` is returned, and the error message can be retrieved via `duckdb_result_error`.
   * Always call `duckdb_destroy_result` on the result object after query execution, even on failure, to free memory.
   * 
   * @param connection Pointer to the database connection (`duckdb_connection`).
   * @param query Pointer to the SQL query string (`const char*`).
   * @param out_result Buffer to receive the result object (`duckdb_result*`).
   * @return `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_query: {
    parameters: ["u64", "pointer", "pointer"] as const,  // duckdb_connection, const char*, duckdb_result*
    result: "i32" as const,                                  // duckdb_state (int32_t)
  },

  /**
   * Destroys the result object and deallocates all memory associated with it.
   * 
   * This should always be called after a query is executed, even if it fails, to ensure proper memory cleanup.
   * 
   * @param result Pointer to the result object to be destroyed (`duckdb_result*`).
   * @return void
   */
  duckdb_destroy_result: {
    parameters: ["pointer"] as const,                        // duckdb_result*
    result: "void" as const,                                 // void
  },

  /**
   * Retrieves the name of a specific column in the result based on its index.
   * 
   * The column names do not need to be freed as they will be automatically released when the result is destroyed.
   * Returns `NULL` if the column index is out of range.
   * 
   * @param result Buffer containing the result object (`duckdb_result*`).
   * @param col The column index (`idx_t`).
   * @return Pointer to the column name (`const char*`), or `NULL` if the column index is out of range.
   */
  duckdb_column_name: {
    parameters: ["pointer", "u64"] as const,                 // duckdb_result*, idx_t
    result: "pointer" as const,                              // const char*
  },

  /**
   * Retrieves the data type of a specific column in the result based on its index.
   * 
   * Returns `DUCKDB_TYPE_INVALID` if the column index is out of range.
   * 
   * @param result Pointer to the result object (`duckdb_result*`).
   * @param col The column index (`idx_t`).
   * @return The data type of the column (`duckdb_type` as `int32_t`).
   */
  duckdb_column_type: {
    parameters: ["pointer", "u64"] as const,                 // duckdb_result*, idx_t
    result: "i32" as const,                                  // duckdb_type (int32_t)
  },

  /**
   * Retrieves the type of statement that was executed (e.g., SELECT, INSERT, etc.).
   * 
   * Returns `DUCKDB_STATEMENT_TYPE_INVALID` if the statement type cannot be determined.
   * 
   * @param result Address to the result object (`duckdb_result*`).
   * @return The statement type (`duckdb_statement_type` as `int32_t`).
   */
  duckdb_result_statement_type: {
    parameters: ["u64"] as const,                        // duckdb_result
    result: "i32" as const,                                  // duckdb_statement_type (int32_t)
  },

  /**
   * Retrieves the logical data type of a specific column in the result based on its index.
   * 
   * The returned logical type must be destroyed using `duckdb_destroy_logical_type` to free memory.
   * Returns `NULL` if the column index is out of range.
   * 
   * @param result Buffer containing the result object (`duckdb_result*`).
   * @param col The column index (`idx_t`).
   * @return Pointer to the logical type of the column (`duckdb_logical_type`).
   */
  duckdb_column_logical_type: {
    parameters: ["pointer", "u64"] as const,                 // duckdb_result*, idx_t
    result: "pointer" as const,                              // duckdb_logical_type
  },

  /**
   * Retrieves the number of columns present in the result object.
   * 
   * @param result Pointer to the result object (`duckdb_result*`).
   * @return The number of columns in the result object (`idx_t` as `usize`).
   */
  duckdb_column_count: {
    parameters: ["pointer"] as const,                        // duckdb_result*
    result: "u64" as const,                                  // idx_t (size_t)
  },

  /**
   * Retrieves the number of rows changed by the query stored in the result object.
   * 
   * This is relevant only for INSERT, UPDATE, and DELETE queries; for other queries, this will return 0.
   * 
   * @param result Pointer to the result object (`duckdb_result*`).
   * @return The number of rows changed by the query (`idx_t` as `usize`).
   */
  duckdb_rows_changed: {
    parameters: ["pointer"] as const,                        // duckdb_result*
    result: "u64" as const,                                  // idx_t (size_t)
  },

  /**
   * Retrieves the error message contained within the result object.
   * 
   * The error is only set if `duckdb_query` returns `DuckDBError`.
   * The error message does not need to be freed, as it will be cleaned up when `duckdb_destroy_result` is called.
   * 
   * @param result Pointer to the result object (`duckdb_result*`).
   * @return Pointer to the error message (`const char*`), or `NULL` if no error is present.
   */
  duckdb_result_error: {
    parameters: ["pointer"] as const,                        // duckdb_result*
    result: "pointer" as const,                              // const char*
  },

  /**
   * Retrieves the error type contained within the result object.
   * 
   * The error is only set if `duckdb_query` returns `DuckDBError`.
   * 
   * @param result Pointer to the result object (`duckdb_result*`).
   * @return The error type of the result (`duckdb_error_type` as `int32_t`).
   */
  duckdb_result_error_type: {
    parameters: ["pointer"] as const,                        // duckdb_result*
    result: "i32" as const,                                  // duckdb_error_type (int32_t)
  },
};
