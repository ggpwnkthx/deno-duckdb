//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/profile_info.ts
// Profiling Info - FFI functions for retrieving profiling information in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Retrieves the root node of the profiling information.
   * 
   * If profiling is enabled in the current connection, this function returns the root profiling node, 
   * which contains the performance metrics of the executed queries. If profiling is not enabled, 
   * this function returns `nullptr`.
   * 
   * @param connection A pointer to the `duckdb_connection` object.
   * @return A `duckdb_profiling_info` object representing the root profiling node, or `nullptr` if profiling is not enabled.
   */
  duckdb_get_profiling_info: {
    parameters: ["pointer"],           // duckdb_connection
    result: "pointer",                 // duckdb_profiling_info
  },

  /**
   * Retrieves the value of the specified metric from the current profiling node.
   * 
   * Metrics provide detailed performance information for queries or specific operations. 
   * The metric's value is stored as a string, which can be retrieved using `duckdb_get_varchar` on the returned `duckdb_value`.
   * If the specified metric does not exist or is not enabled, this function returns `nullptr`.
   * 
   * The returned `duckdb_value` must be destroyed with `duckdb_destroy_value` after use to free memory.
   * 
   * @param info A pointer to the `duckdb_profiling_info` object.
   * @param key A pointer to the null-terminated string representing the name of the metric (`const char*`).
   * @return A `duckdb_value` containing the metric value, or `nullptr` if the metric is not available.
   */
  duckdb_profiling_info_get_value: {
    parameters: ["pointer", "pointer"], // duckdb_profiling_info, const char* (metric key)
    result: "pointer",                  // duckdb_value
  },

  /**
   * Retrieves the key-value metric map of the current profiling node.
   * 
   * The metrics of the current node are returned as a map, where the keys represent metric names and 
   * the values represent their corresponding performance values. The returned map is of type `MAP`, 
   * which can be accessed using DuckDB's MAP functions.
   * 
   * The returned `duckdb_value` must be destroyed with `duckdb_destroy_value` after use to free memory.
   * 
   * @param info A pointer to the `duckdb_profiling_info` object.
   * @return A `duckdb_value` containing the key-value metric map, or `nullptr` if no metrics are available.
   */
  duckdb_profiling_info_get_metrics: {
    parameters: ["pointer"],           // duckdb_profiling_info
    result: "pointer",                 // duckdb_value (MAP type)
  },

  /**
   * Retrieves the number of child nodes in the current profiling node.
   * 
   * Profiling nodes can have multiple child nodes that represent deeper levels of the profiling tree.
   * Each child node provides detailed profiling information about sub-operations within the parent node.
   * 
   * @param info A pointer to the `duckdb_profiling_info` object.
   * @return The number of child nodes (`idx_t`) in the current profiling node.
   */
  duckdb_profiling_info_get_child_count: {
    parameters: ["pointer"],           // duckdb_profiling_info
    result: "u64",                     // idx_t (uint64_t)
  },

  /**
   * Retrieves the child node at the specified index from the current profiling node.
   * 
   * Child nodes contain detailed profiling information of sub-operations within the parent node, 
   * allowing for a more granular view of query execution performance. The index is used to specify 
   * which child node to retrieve.
   * 
   * @param info A pointer to the `duckdb_profiling_info` object.
   * @param index The index of the child node to retrieve (`idx_t`).
   * @return A `duckdb_profiling_info` object representing the child node at the specified index.
   */
  duckdb_profiling_info_get_child: {
    parameters: ["pointer", "u64"],    // duckdb_profiling_info, idx_t (uint64_t)
    result: "pointer",                 // duckdb_profiling_info (child node)
  },
} as const satisfies Deno.ForeignLibraryInterface;
