//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/prepared_statements/index.ts
// Prepared Statements - FFI functions for handling prepared statements in DuckDB
//===--------------------------------------------------------------------===//

import bind_values from "./bind_values.ts";
import execute from "./execute.ts";
import extract from "./extract.ts";
import pending from "./pending.ts";

export default {
  /**
   * Creates a prepared statement object from a given SQL query.
   * 
   * After calling `duckdb_prepare`, the prepared statement should always be destroyed using
   * `duckdb_destroy_prepare`, even if the preparation fails.
   * 
   * If the preparation fails, `duckdb_prepare_error` can be used to retrieve the reason for the failure.
   * 
   * @param connection The database connection object (`duckdb_connection`).
   * @param query The SQL query to prepare (`const char*`).
   * @param out_prepared_statement The resulting prepared statement object (`duckdb_prepared_statement*`).
   * @return `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_prepare: {
    parameters: ["pointer", "pointer", "pointer"], // duckdb_connection, const char* (string pointer), duckdb_prepared_statement*
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Destroys a prepared statement and deallocates all memory associated with it.
   * 
   * This should be called after the prepared statement is no longer needed.
   * 
   * @param prepared_statement The prepared statement object to destroy (`duckdb_prepared_statement*`).
   * @return void
   */
  duckdb_destroy_prepare: {
    parameters: ["pointer"],                       // duckdb_prepared_statement*
    result: "void",                                // void
  },

  /**
   * Retrieves the error message associated with a prepared statement.
   * 
   * If the prepared statement has no error, this returns `nullptr`. The error message does not need
   * to be freed, as it will be deallocated when `duckdb_destroy_prepare` is called.
   * 
   * @param prepared_statement The prepared statement to get the error message from (`duckdb_prepared_statement`).
   * @return The error message (`const char*`), or `nullptr` if no error is present.
   */
  duckdb_prepare_error: {
    parameters: ["pointer"],                       // duckdb_prepared_statement
    result: "pointer",                             // const char* (string pointer)
  },

  /**
   * Retrieves the number of parameters in a prepared statement.
   * 
   * Returns 0 if the statement was not successfully prepared.
   * 
   * @param prepared_statement The prepared statement object (`duckdb_prepared_statement`).
   * @return The number of parameters in the statement (`idx_t`).
   */
  duckdb_nparams: {
    parameters: ["pointer"],                       // duckdb_prepared_statement
    result: "u64",                                 // idx_t (uint64_t)
  },

  /**
   * Retrieves the name of a parameter at a specific index.
   * 
   * The returned string should be freed using `duckdb_free`. If the index is out of range, this returns `nullptr`.
   * 
   * @param prepared_statement The prepared statement object (`duckdb_prepared_statement`).
   * @param index The index of the parameter to retrieve.
   * @return The parameter name (`const char*`), or `nullptr` if the index is out of range.
   */
  duckdb_parameter_name: {
    parameters: ["pointer", "u64"],                // duckdb_prepared_statement, idx_t (uint64_t)
    result: "pointer",                             // const char* (string pointer)
  },

  /**
   * Retrieves the type of a parameter at a specific index.
   * 
   * Returns `DUCKDB_TYPE_INVALID` if the index is out of range or if the statement was not successfully prepared.
   * 
   * @param prepared_statement The prepared statement object (`duckdb_prepared_statement`).
   * @param param_idx The index of the parameter to retrieve the type for.
   * @return The parameter type (`duckdb_type`).
   */
  duckdb_param_type: {
    parameters: ["pointer", "u64"],                // duckdb_prepared_statement, idx_t (uint64_t)
    result: "i32",                                 // duckdb_type (int32_t)
  },

  /**
   * Clears all parameter bindings from the prepared statement.
   * 
   * This can be useful if you want to reset the statement for another execution with new parameters.
   * 
   * @param prepared_statement The prepared statement object (`duckdb_prepared_statement`).
   * @return `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_clear_bindings: {
    parameters: ["pointer"],                       // duckdb_prepared_statement
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Retrieves the type of the statement (e.g., SELECT, INSERT, UPDATE).
   * 
   * @param statement The prepared statement object (`duckdb_prepared_statement`).
   * @return The statement type (`duckdb_statement_type`), or `DUCKDB_STATEMENT_TYPE_INVALID` on error.
   */
  duckdb_prepared_statement_type: {
    parameters: ["pointer"],                       // duckdb_prepared_statement
    result: "i32",                                 // duckdb_statement_type (int32_t)
  },

  // Additional FFI functions for prepared statements
  ...bind_values,
  ...execute,
  ...extract,
  ...pending,
} as const satisfies Deno.ForeignLibraryInterface;
