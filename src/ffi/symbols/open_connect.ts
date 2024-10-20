//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/open_connect.ts
// Open Connect - FFI functions for opening, connecting, and managing DuckDB databases
//===--------------------------------------------------------------------===//

export default {
  /**
   * Opens a new DuckDB database or connects to an existing one.
   * If the path is `nullptr` or `:memory:`, an in-memory database is created.
   * Make sure to close the database using `duckdb_close` after usage.
   * 
   * @param path Pointer to the database file path (`char*`), or `nullptr`/`:memory:` for an in-memory DB.
   * @param out_database Pointer to the resulting database object (`duckdb_database*`).
   * @return `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_open: {
    parameters: ["pointer", "pointer"] as const,  // char* (path), duckdb_database*
    result: "i32" as const,                       // duckdb_state (int32_t)
  },

  /**
   * Extended version of `duckdb_open`, with added support for configuration.
   * Creates or opens a database with optional configuration. If the operation fails,
   * `out_error` will contain a message (which should be freed with `duckdb_free`).
   * The database should be closed with `duckdb_close`.
   * 
   * @param path Pointer to the database file path (`char*`), or `nullptr`/`:memory:` for an in-memory DB.
   * @param out_database Pointer to the resulting database object (`duckdb_database*`).
   * @param config Optional configuration object (`duckdb_config*`).
   * @param out_error Pointer to error message (`char**`) if the operation fails.
   * @return `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_open_ext: {
    parameters: ["pointer", "pointer", "pointer", "pointer"] as const,  // char* (path), duckdb_database*, duckdb_config, char**
    result: "i32" as const,                                             // duckdb_state (int32_t)
  },

  /**
   * Closes an open DuckDB database and deallocates all memory associated with it.
   * This function should be called after using a database opened with `duckdb_open` or `duckdb_open_ext`.
   * Failing to call this function (e.g., due to a crash) will not result in data corruption, but
   * it's still recommended to close the database properly.
   * 
   * @param database Pointer to the database object to close (`duckdb_database*`).
   * @return void
   */
  duckdb_close: {
    parameters: ["pointer"] as const,            // duckdb_database*
    result: "void" as const,                     // void
  },

  /**
   * Establishes a connection to an open DuckDB database.
   * A connection is required to execute queries and manage transaction states.
   * Ensure to close the connection using `duckdb_disconnect` when no longer needed.
   * 
   * @param database Pointer to the database object to connect to (`duckdb_database`).
   * @param out_connection Pointer to the resulting connection object (`duckdb_connection*`).
   * @return `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_connect: {
    parameters: ["pointer", "pointer"] as const, // duckdb_database, duckdb_connection*
    result: "i32" as const,                      // duckdb_state (int32_t)
  },

  /**
   * Interrupts the execution of a currently running query on the provided connection.
   * 
   * @param connection Pointer to the connection on which the query is running (`duckdb_connection`).
   * @return void
   */
  duckdb_interrupt: {
    parameters: ["pointer"] as const,            // duckdb_connection
    result: "void" as const,                     // void
  },

  /**
   * Retrieves the progress of a running query on the provided connection.
   * Returns -1 if no query is running or if progress is not available, otherwise
   * returns the percentage of query progress.
   * 
   * @param connection Pointer to the connection (`duckdb_connection`).
   * @return Progress of the query as `duckdb_query_progress_type` (`int32_t`).
   */
  duckdb_query_progress: {
    parameters: ["pointer"] as const,            // duckdb_connection
    result: "i32" as const,                      // duckdb_query_progress_type (int32_t)
  },

  /**
   * Disconnects an active connection to a DuckDB database and deallocates all memory
   * associated with the connection. This should be called after you are done using
   * the connection.
   * 
   * @param connection Pointer to the connection object to close (`duckdb_connection*`).
   * @return void
   */
  duckdb_disconnect: {
    parameters: ["pointer"] as const,            // duckdb_connection*
    result: "void" as const,                     // void
  },

  /**
   * Returns the version of the linked DuckDB library, including any development version postfixes.
   * This is useful for checking compatibility when developing extensions.
   * 
   * @return Pointer to the version string (`char*`).
   */
  duckdb_library_version: {
    parameters: [] as const,                     // No parameters
    result: "pointer" as const,                  // char* (string pointer)
  },
};
