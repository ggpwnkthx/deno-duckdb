//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/open_connect.ts
// Open Connect - FFI functions for opening, connecting, and managing DuckDB databases
//===--------------------------------------------------------------------===//

import { duckdb_config, duckdb_connection, duckdb_database, duckdb_query_progress_type } from "../structs.ts";

export default {
  /**
   * Opens a DuckDB database or connects to an existing one. For in-memory databases, use `nullptr` or `:memory:` as the path.
   *
   * @param path - UTF-8 buffer containing the database file path, or `nullptr`/:memory: for in-memory databases.
   * @param out_database - Pointer for receiving the resulting database instance (`duckdb_database*`).
   * @returns `duckdb_state` as an unsigned 32-bit integer, indicating the success or failure of the operation.
   */
  duckdb_open: {
    parameters: ["buffer", "pointer"], 
    result: "u32",
  },

  /**
   * Opens a DuckDB database with optional configuration support. If an error occurs, `out_error` will be populated with the error message.
   *
   * @param path - UTF-8 buffer with the path to the database file, or `nullptr`/:memory: for in-memory.
   * @param out_database - Pointer to receive the database instance (`duckdb_database*`).
   * @param config - Optional configuration buffer (`duckdb_config`), or `null` for default settings.
   * @param out_error - Pointer for capturing error messages (`char**`), should be freed with `duckdb_free` if populated.
   * @returns `duckdb_state` as an unsigned 32-bit integer.
   */
  duckdb_open_ext: {
    parameters: ["buffer", "pointer", duckdb_config, "pointer"],
    result: "u32",
  },

  /**
   * Closes an open DuckDB database, releasing associated memory.
   *
   * @param database - Pointer to the DuckDB database instance (`duckdb_database*`) to close.
   * @returns Void.
   */
  duckdb_close: {
    parameters: ["pointer"],
    result: "void",
  },

  /**
   * Initiates a connection to a DuckDB database, required for executing queries.
   *
   * @param database - The database instance (`duckdb_database`) to connect to.
   * @param out_connection - Pointer to receive the resulting connection instance (`duckdb_connection*`).
   * @returns `duckdb_state` as an unsigned 32-bit integer.
   */
  duckdb_connect: {
    parameters: [duckdb_database, "pointer"],
    result: "u32",
  },

  /**
   * Interrupts the execution of an active query on the specified connection.
   *
   * @param connection - The connection instance (`duckdb_connection`) on which the query is being executed.
   * @returns Void.
   */
  duckdb_interrupt: {
    parameters: [duckdb_connection],
    result: "void",
  },

  /**
   * Retrieves progress information for a query in progress.
   *
   * @param connection - The connection instance (`duckdb_connection`) on which the query is running.
   * @returns `duckdb_query_progress_type`, containing the query's progress details.
   */
  duckdb_query_progress: {
    parameters: [duckdb_connection],
    result: duckdb_query_progress_type,
  },

  /**
   * Closes a connection to a DuckDB database, releasing associated memory.
   *
   * @param connection - Pointer to the connection instance (`duckdb_connection*`) to close.
   * @returns Void.
   */
  duckdb_disconnect: {
    parameters: ["pointer"],
    result: "void",
  },

  /**
   * Retrieves the DuckDB library version as a string.
   *
   * @returns Buffer containing the DuckDB library version string (`const char*`).
   */
  duckdb_library_version: {
    parameters: [],
    result: "buffer",
  },
} as const satisfies Deno.ForeignLibraryInterface;
