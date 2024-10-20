//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/prepared_statements/pending.ts
// Pending Result Interface - FFI functions for managing pending query execution in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Executes a prepared statement and returns a pending result.
   * 
   * The pending result represents an intermediate state for a query that is not fully executed.
   * This allows incremental execution of the query, where control can return to the client between tasks.
   * 
   * After calling this function, the pending result should be destroyed using `duckdb_destroy_pending`, 
   * even if the function fails.
   * 
   * @param prepared_statement The prepared statement to execute (`duckdb_prepared_statement`).
   * @param out_result A pointer to the resulting pending query result (`duckdb_pending_result*`).
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` (`int32_t`) on failure.
   */
  duckdb_pending_prepared: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_prepared_statement, duckdb_pending_result*
    result: "i32" as const,                       // duckdb_state (int32_t)
  },

  /**
   * Closes the pending result and deallocates all associated memory.
   * 
   * This function should be called when the pending result is no longer needed to free the memory.
   * 
   * @param pending_result The pending result to destroy (`duckdb_pending_result*`).
   * @return void
   */
  duckdb_destroy_pending: {
    parameters: ["pointer"] as const,             // duckdb_pending_result*
    result: "void" as const,                      // void
  },

  /**
   * Returns the error message contained within a pending result.
   * 
   * The returned error message does not need to be freed, as it will be deallocated when `duckdb_destroy_pending` 
   * is called.
   * 
   * @param pending_result The pending result from which to retrieve the error message (`duckdb_pending_result`).
   * @return A pointer to the error message string (`const char*`), or `nullptr` if no error exists.
   */
  duckdb_pending_error: {
    parameters: ["pointer"] as const,             // duckdb_pending_result
    result: "pointer" as const,                   // const char* (string pointer)
  },

  /**
   * Executes a single task within a pending query and returns the current state.
   * 
   * This function incrementally executes a part of the query. If the query is ready for result retrieval, it returns
   * `DUCKDB_PENDING_RESULT_READY`. If the query requires further tasks, it returns `DUCKDB_PENDING_RESULT_NOT_READY`.
   * On error, it returns `DUCKDB_PENDING_ERROR`.
   * 
   * The error message can be obtained by calling `duckdb_pending_error` on the pending result.
   * 
   * @param pending_result The pending result for which to execute a task (`duckdb_pending_result`).
   * @return The current state of the pending result (`DUCKDB_PENDING_RESULT_READY`, `DUCKDB_PENDING_RESULT_NOT_READY`,
   * or `DUCKDB_PENDING_ERROR`).
   */
  duckdb_pending_execute_task: {
    parameters: ["pointer"] as const,             // duckdb_pending_result
    result: "i32" as const,                       // duckdb_pending_state (int32_t)
  },

  /**
   * Checks the state of a pending result to see if it is ready for result retrieval or still executing.
   * 
   * This function returns the current state of the pending result. If the query is fully executed, it returns
   * `DUCKDB_PENDING_RESULT_READY`. If the query still has tasks to perform, it returns `DUCKDB_PENDING_RESULT_NOT_READY`.
   * On error, it returns `DUCKDB_PENDING_ERROR`.
   * 
   * @param pending_result The pending result to check (`duckdb_pending_result`).
   * @return The state of the pending result (`DUCKDB_PENDING_RESULT_READY`, `DUCKDB_PENDING_RESULT_NOT_READY`,
   * or `DUCKDB_PENDING_ERROR`).
   */
  duckdb_pending_execute_check_state: {
    parameters: ["pointer"] as const,             // duckdb_pending_result
    result: "i32" as const,                       // duckdb_pending_state (int32_t)
  },

  /**
   * Fully executes a pending query and returns the final result.
   * 
   * If `duckdb_pending_execute_task` has been called until `DUCKDB_PENDING_RESULT_READY` was returned, 
   * this function will complete the query execution quickly. Otherwise, all remaining tasks will be executed first.
   * The final query result must be destroyed with `duckdb_destroy_result` after use.
   * 
   * @param pending_result The pending result to execute fully (`duckdb_pending_result`).
   * @param out_result A pointer to the resulting query result (`duckdb_result*`).
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_execute_pending: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_pending_result, duckdb_result*
    result: "i32" as const,                       // duckdb_state (int32_t)
  },

  /**
   * Determines if a pending state has finished executing.
   * 
   * This function returns true if the pending state is `DUCKDB_PENDING_RESULT_READY`, indicating the query 
   * has finished execution.
   * 
   * @param pending_state The pending state to check (`duckdb_pending_state`).
   * @return `true` if the query is finished executing, `false` otherwise.
   */
  duckdb_pending_execution_is_finished: {
    parameters: ["i32"] as const,                 // duckdb_pending_state (int32_t)
    result: "bool" as const,                      // bool
  },
};
