//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/prepared_statements/extract.ts
// Extract Statements - FFI functions for extracting SQL statements from queries in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Extracts all SQL statements from a query string.
   * 
   * After calling this function, the extracted statements should always be destroyed using `duckdb_destroy_extracted`,
   * even if no statements were extracted. If extraction fails, `duckdb_extract_statements_error` can be used to 
   * retrieve the error message.
   * 
   * @param connection The database connection object (`duckdb_connection`).
   * @param query The SQL query string to extract statements from (`const char*`).
   * @param out_extracted_statements A pointer to the object containing the extracted statements (`duckdb_extracted_statements*`).
   * @return The number of extracted statements (`idx_t`) or 0 if extraction fails.
   */
  duckdb_extract_statements: {
    parameters: ["pointer", "pointer", "pointer"], // duckdb_connection, const char* (query), duckdb_extracted_statements*
    result: "u64",                                 // idx_t (uint64_t)
  },

  /**
   * Prepares an extracted statement at a specific index.
   * 
   * This prepares one of the statements extracted from a query. After calling this function, 
   * the prepared statement should always be destroyed using `duckdb_destroy_prepare`, even if preparation fails.
   * In case of failure, `duckdb_prepare_error` can be called to obtain the reason for failure.
   * 
   * @param connection The database connection object (`duckdb_connection`).
   * @param extracted_statements The object containing the extracted statements (`duckdb_extracted_statements`).
   * @param index The index of the statement to prepare (`idx_t`).
   * @param out_prepared_statement A pointer to the resulting prepared statement object (`duckdb_prepared_statement*`).
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_prepare_extracted_statement: {
    parameters: ["pointer", "pointer", "u64", "pointer"], // duckdb_connection, duckdb_extracted_statements, idx_t (uint64_t), duckdb_prepared_statement*
    result: "i32",                                        // duckdb_state (int32_t)
  },

  /**
   * Retrieves the error message from the extracted statements.
   * 
   * This function returns any error message associated with the extracted statements. The returned error message
   * does not need to be freed, as it will be automatically deallocated when `duckdb_destroy_extracted` is called.
   * 
   * @param extracted_statements The object containing the extracted statements (`duckdb_extracted_statements`).
   * @return A pointer to the error message string (`const char*`), or `nullptr` if no error exists.
   */
  duckdb_extract_statements_error: {
    parameters: ["pointer"],                 // duckdb_extracted_statements
    result: "pointer",                       // const char* (string pointer)
  },

  /**
   * Destroys the extracted statements object and frees all associated memory.
   * 
   * This function should be called after the extracted statements are no longer needed to free the allocated memory.
   * 
   * @param extracted_statements A pointer to the extracted statements object to destroy (`duckdb_extracted_statements*`).
   * @return void
   */
  duckdb_destroy_extracted: {
    parameters: ["pointer"],                 // duckdb_extracted_statements*
    result: "void",                          // void
  },
} as const satisfies Deno.ForeignLibraryInterface;
