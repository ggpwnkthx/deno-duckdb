//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/table/init.ts
// Table Function Init - FFI functions for initializing table functions in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Retrieves the extra info set in the table function using `duckdb_table_function_set_extra_info`.
   * 
   * The extra info is user-defined data that was attached to the table function during its creation.
   * 
   * @param info A pointer to the `duckdb_init_info` object.
   * @return A pointer to the extra info object (`void*`).
   */
  duckdb_init_get_extra_info: {
    parameters: ["pointer"] as const,  // duckdb_init_info
    result: "pointer" as const,        // void*
  },

  /**
   * Retrieves the bind data set during the bind phase using `duckdb_bind_set_bind_data`.
   * 
   * The bind data is treated as read-only during execution. To maintain execution state, use the init data instead.
   * 
   * @param info A pointer to the `duckdb_init_info` object.
   * @return A pointer to the bind data object (`void*`).
   */
  duckdb_init_get_bind_data: {
    parameters: ["pointer"] as const,  // duckdb_init_info
    result: "pointer" as const,        // void*
  },

  /**
   * Sets the user-provided init data, which can be accessed during execution.
   * 
   * This init data allows you to track state throughout the execution of the table function.
   * The `destroy` callback will be called to clean up the init data when it is no longer needed.
   * 
   * @param info A pointer to the `duckdb_init_info` object.
   * @param init_data A pointer to the init data object (`void*`).
   * @param destroy A callback function to destroy the init data if necessary (`duckdb_delete_callback_t`).
   * @return void
   */
  duckdb_init_set_init_data: {
    parameters: ["pointer", "pointer", "pointer"] as const,  // duckdb_init_info, void* (init_data), duckdb_delete_callback_t
    result: "void" as const,                                 // void
  },

  /**
   * Retrieves the number of projected columns when projection pushdown is enabled.
   * 
   * Projection pushdown allows the table function to limit the columns it emits to only the ones that are required.
   * 
   * @param info A pointer to the `duckdb_init_info` object.
   * @return The number of projected columns (`idx_t`).
   */
  duckdb_init_get_column_count: {
    parameters: ["pointer"] as const,  // duckdb_init_info
    result: "u64" as const,            // idx_t (uint64_t)
  },

  /**
   * Retrieves the column index of the projected column at the specified position.
   * 
   * This function is used during projection pushdown to identify which columns are being emitted by the table function.
   * 
   * @param info A pointer to the `duckdb_init_info` object.
   * @param column_index The index at which to get the projected column index (0 to `duckdb_init_get_column_count(info)`).
   * @return The column index of the projected column (`idx_t`).
   */
  duckdb_init_get_column_index: {
    parameters: ["pointer", "u64"] as const,  // duckdb_init_info, idx_t (uint64_t)
    result: "u64" as const,                   // idx_t (uint64_t)
  },

  /**
   * Sets the maximum number of threads that can process the table function in parallel.
   * 
   * By default, only one thread processes the table function, but this function allows you to specify a higher number
   * of threads to handle parallel processing.
   * 
   * @param info A pointer to the `duckdb_init_info` object.
   * @param max_threads The maximum number of threads allowed to process the table function (`idx_t`).
   * @return void
   */
  duckdb_init_set_max_threads: {
    parameters: ["pointer", "u64"] as const,  // duckdb_init_info, idx_t (uint64_t)
    result: "void" as const,                  // void
  },

  /**
   * Reports an error that occurred during the init phase of the table function.
   * 
   * The error message is stored and can be retrieved or logged accordingly during execution.
   * 
   * @param info A pointer to the `duckdb_init_info` object.
   * @param error A pointer to the null-terminated string representing the error message (`const char*`).
   * @return void
   */
  duckdb_init_set_error: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_init_info, const char* (error message)
    result: "void" as const,                      // void
  },
};
