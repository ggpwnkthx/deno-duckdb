//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/prepared_statements/execute.ts
// Execute Prepared Statements - FFI functions for executing prepared statements in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Executes the prepared statement with the currently bound parameters and returns a materialized query result.
   * 
   * This function can be called multiple times for a single prepared statement. The bound parameters can be modified
   * between each call to this function, making it useful for executing the same statement with different values.
   * 
   * **Note:** The resulting query must be freed using `duckdb_destroy_result` after use to avoid memory leaks.
   * 
   * @param prepared_statement The prepared statement to execute (`duckdb_prepared_statement`).
   * @param out_result A pointer to the resulting query, stored in a `duckdb_result` object.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` (`int32_t`) on failure.
   */
  duckdb_execute_prepared: {
    parameters: ["pointer", "pointer"],  // duckdb_prepared_statement, duckdb_result*
    result: "i32",                       // duckdb_state (int32_t)
  },
} as const satisfies Deno.ForeignLibraryInterface;
