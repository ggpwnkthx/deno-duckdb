//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/configuration.ts
// Configuration - FFI functions for configuring DuckDB start-up options
//===--------------------------------------------------------------------===//

export default {
  /**
   * Creates a new configuration object for DuckDB, which can be used to specify start-up options.
   * This function always succeeds unless there is a memory allocation failure.
   * 
   * It is important to call `duckdb_destroy_config` on the resulting configuration object,
   * even if an error occurs during its usage.
   * 
   * @param out_config Pointer to the resulting configuration object (`duckdb_config*`).
   * @return `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_create_config: {
    parameters: ["pointer"],   // duckdb_config*
    result: "i32",             // duckdb_state (int32_t)
  },

  /**
   * Retrieves the total number of available configuration options that can be used with `duckdb_get_config_flag`.
   * This function internally loops through all available options and should not be called in a tight loop.
   * 
   * @return The number of available configuration options (`size_t`).
   */
  duckdb_config_count: {
    parameters: [],            // No parameters
    result: "usize",           // size_t
  },

  /**
   * Retrieves the name and description of a specific configuration option based on its index.
   * The name and description are human-readable and must not be freed by the user.
   * 
   * If the provided index is out of range (i.e., greater than or equal to `duckdb_config_count`), the function fails.
   * 
   * @param index The index of the configuration option (between 0 and `duckdb_config_count`).
   * @param out_name Pointer to store the name of the configuration option (`const char**`).
   * @param out_description Pointer to store the description of the configuration option (`const char**`).
   * @return `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_get_config_flag: {
    parameters: ["usize", "pointer", "pointer"], // size_t, char** (name), char** (description)
    result: "i32",                               // duckdb_state (int32_t)
  },

  /**
   * Sets a specific configuration option for the provided configuration object.
   * 
   * The option is indicated by its name, and this function will fail if either the option name or the value is invalid.
   * Configuration options can be retrieved using `duckdb_get_config_flag`.
   * 
   * @param config Pointer to the configuration object (`duckdb_config*`).
   * @param name Pointer to the name of the configuration option (`const char*`).
   * @param option Pointer to the value to set the configuration option to (`const char*`).
   * @return `DuckDBSuccess` (`int32_t`) on success, or `DuckDBError` on failure.
   */
  duckdb_set_config: {
    parameters: ["pointer", "pointer", "pointer"], // duckdb_config, char* (name), char* (option)
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Destroys the given configuration object and deallocates any memory associated with it.
   * 
   * This should be called after you are done using the configuration object to free memory resources.
   * 
   * @param config Pointer to the configuration object to destroy (`duckdb_config*`).
   * @return void
   */
  duckdb_destroy_config: {
    parameters: ["pointer"],    // duckdb_config*
    result: "void",             // void
  },
} as const satisfies Deno.ForeignLibraryInterface;
