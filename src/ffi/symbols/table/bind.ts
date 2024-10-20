//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/table/bind.ts
// Table Function Bind - FFI functions for binding table functions in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Retrieves the extra info set in the table function using `duckdb_table_function_set_extra_info`.
   * 
   * @param info A pointer to the `duckdb_bind_info` object.
   * @return A pointer to the extra info object (`void*`).
   */
  duckdb_bind_get_extra_info: {
    parameters: ["pointer"] as const,  // duckdb_bind_info
    result: "pointer" as const,        // void*
  },

  /**
   * Adds a result column to the output of the table function.
   * 
   * This function specifies the name and logical type of a result column for the table function.
   * 
   * @param info A pointer to the `duckdb_bind_info` object.
   * @param name A pointer to the null-terminated string representing the column name (`const char*`).
   * @param type A pointer to the `duckdb_logical_type` representing the column's logical type.
   * @return void
   */
  duckdb_bind_add_result_column: {
    parameters: ["pointer", "pointer", "pointer"] as const,  // duckdb_bind_info, const char* (name), duckdb_logical_type
    result: "void" as const,                                 // void
  },

  /**
   * Retrieves the number of regular (non-named) parameters passed to the table function.
   * 
   * @param info A pointer to the `duckdb_bind_info` object.
   * @return The number of parameters (`idx_t`).
   */
  duckdb_bind_get_parameter_count: {
    parameters: ["pointer"] as const,  // duckdb_bind_info
    result: "u64" as const,            // idx_t (uint64_t)
  },

  /**
   * Retrieves the parameter at the specified index.
   * 
   * The returned `duckdb_value` must be destroyed with `duckdb_destroy_value` after use.
   * 
   * @param info A pointer to the `duckdb_bind_info` object.
   * @param index The index of the parameter to retrieve (`idx_t`).
   * @return A pointer to the `duckdb_value` object. Must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_bind_get_parameter: {
    parameters: ["pointer", "u64"] as const,  // duckdb_bind_info, idx_t (uint64_t)
    result: "pointer" as const,               // duckdb_value (pointer to result)
  },

  /**
   * Retrieves the named parameter with the specified name.
   * 
   * The returned `duckdb_value` must be destroyed with `duckdb_destroy_value` after use.
   * 
   * @param info A pointer to the `duckdb_bind_info` object.
   * @param name A pointer to the null-terminated string representing the parameter name (`const char*`).
   * @return A pointer to the `duckdb_value` object. Must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_bind_get_named_parameter: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_bind_info, const char* (name)
    result: "pointer" as const,                   // duckdb_value (pointer to result)
  },

  /**
   * Sets user-provided bind data in the bind object.
   * 
   * This data can be retrieved later during function execution.
   * 
   * @param info A pointer to the `duckdb_bind_info` object.
   * @param bind_data A pointer to the bind data object (`void*`).
   * @param destroy A callback function to destroy the bind data if necessary (`duckdb_delete_callback_t`).
   * @return void
   */
  duckdb_bind_set_bind_data: {
    parameters: ["pointer", "pointer", "pointer"] as const,  // duckdb_bind_info, void* (bind_data), duckdb_delete_callback_t
    result: "void" as const,                                 // void
  },

  /**
   * Sets the cardinality estimate for the table function.
   * 
   * This estimate is used for query optimization, and it can be either an exact count or an approximation.
   * 
   * @param info A pointer to the `duckdb_bind_info` object.
   * @param cardinality The estimated number of rows (`idx_t`).
   * @param is_exact A boolean indicating whether the cardinality is exact (`true`) or an approximation (`false`).
   * @return void
   */
  duckdb_bind_set_cardinality: {
    parameters: ["pointer", "u64", "bool"] as const,  // duckdb_bind_info, idx_t (cardinality), bool (is_exact)
    result: "void" as const,                          // void
  },

  /**
   * Reports an error that occurred during the bind phase of the table function.
   * 
   * This error message will be displayed or logged accordingly.
   * 
   * @param info A pointer to the `duckdb_bind_info` object.
   * @param error A pointer to the null-terminated string representing the error message (`const char*`).
   * @return void
   */
  duckdb_bind_set_error: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_bind_info, const char* (error)
    result: "void" as const,                      // void
  },
};
