//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/table/describe.ts
// Table Description - FFI functions for creating and managing table descriptions in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Creates a table description object for a specified table within the database.
   * 
   * The table description object provides metadata about the table's structure (columns, types, etc.).
   * The resulting table description object must be destroyed using `duckdb_table_description_destroy`
   * to free associated memory.
   * 
   * @param connection A pointer to the DuckDB connection context (`duckdb_connection*`).
   * @param schema A pointer to the schema name (`const char*`), or `nullptr` for the default schema.
   * @param table A pointer to the name of the table (`const char*`).
   * @param out A pointer to store the resulting table description object (`duckdb_table_description*`).
   * @returns `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_table_description_create: {
    parameters: ["pointer", "pointer", "pointer", "pointer"], // duckdb_connection, const char*, const char*, duckdb_table_description*
    result: "i32",                                            // duckdb_state (int32_t)
  },

  /**
   * Destroys a table description object and deallocates any associated memory.
   * 
   * This function should always be called after the table description is no longer needed
   * to prevent memory leaks.
   * 
   * @param table_description A pointer to the table description object to destroy (`duckdb_table_description*`).
   * @returns void
   */
  duckdb_table_description_destroy: {
    parameters: ["pointer"], // duckdb_table_description*
    result: "void",          // void
  },

  /**
   * Retrieves the error message associated with the given table description.
   * 
   * If there was an error during table description creation or manipulation, this function retrieves
   * the error message. If no error occurred, it returns `nullptr`. The error message is automatically freed
   * when `duckdb_table_description_destroy` is called.
   * 
   * @param table_description A pointer to the table description object (`duckdb_table_description*`).
   * @returns A pointer to the error message (`const char*`), or `nullptr` if no error is present.
   */
  duckdb_table_description_error: {
    parameters: ["pointer"], // duckdb_table_description
    result: "pointer",       // const char* (string pointer)
  },

  /**
   * Checks if the column at the specified index within the table has a DEFAULT expression.
   * 
   * A default expression indicates that if no value is provided during an insert, the default value
   * for that column will be used. This function checks if such an expression exists for the column.
   * 
   * @param table_description A pointer to the table description object (`duckdb_table_description*`).
   * @param index The index of the column to check (`idx_t`).
   * @param out A pointer to store the result (`bool*`), true if the column has a default expression, false otherwise.
   * @returns `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_column_has_default: {
    parameters: ["pointer", "u64", "pointer"], // duckdb_table_description, idx_t (uint64_t), bool*
    result: "i32",                             // duckdb_state (int32_t)
  },
} as const satisfies Deno.ForeignLibraryInterface;
