//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/result.ts
// Result Functions - FFI functions for working with query results in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Retrieves the return type of the given result object.
   * 
   * The return type indicates the nature of the result, such as whether the result is 
   * a set of query rows, a modified row count, or if the result is invalid.
   * If an error occurs, it returns `DUCKDB_RETURN_TYPE_INVALID`.
   * 
   * @param result Pointer to the result object (`duckdb_result`).
   * @return The result return type (`duckdb_result_type`) or `DUCKDB_RETURN_TYPE_INVALID` on error.
   */
  duckdb_result_return_type: {
    parameters: ["pointer"] as const,   // duckdb_result (pointer to internal_data)
    result: "i32" as const,             // duckdb_result_type (int32_t)
  },
};
