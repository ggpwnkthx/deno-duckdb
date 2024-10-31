//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/configuration.ts
// Configuration - FFI functions for configuring DuckDB start-up options
//===--------------------------------------------------------------------===//

import { duckdb_config } from "../structs.ts";

export default {
  /**
   * Initializes a new DuckDB configuration object for setting start-up options. On success, the `out_config` parameter will hold the resulting configuration object.
   *
   * @param out_config - Pointer to receive the configuration instance (`duckdb_config*`).
   * @returns `duckdb_state` as an unsigned 32-bit integer, indicating the success or failure of the operation.
   */
  duckdb_create_config: {
    parameters: ["pointer"],
    result: "i32",
  },

  /**
   * Returns the total count of available configuration options.
   *
   * @returns `usize`: Number of available configuration options.
   */
  duckdb_config_count: {
    parameters: [],
    result: "usize",
  },

  /**
   * Retrieves the name and description of a configuration option by index. On success, `out_name` and `out_description` will hold human-readable strings.
   *
   * @param index - The configuration option index (valid range: 0 to `duckdb_config_count` - 1).
   * @param out_name - Pointer to receive the option name (`const char**`).
   * @param out_description - Pointer to receive the option description (`const char**`).
   * @returns `duckdb_state` as an unsigned 32-bit integer, indicating the success or failure of the operation.
   */
  duckdb_get_config_flag: {
    parameters: ["usize", "pointer", "pointer"],
    result: "i32",
  },

  /**
   * Assigns a value to a configuration option within the specified configuration object.
   *
   * @param config - Pointer to the configuration instance (`duckdb_config*`).
   * @param name - UTF-8 string specifying the configuration option name (`const char*`).
   * @param option - UTF-8 string specifying the value to assign (`const char*`).
   * @returns `duckdb_state` as an unsigned 32-bit integer, indicating the success or failure of the operation.
   */
  duckdb_set_config: {
    parameters: [duckdb_config, "buffer", "buffer"],
    result: "i32",
  },

  /**
   * Deallocates and destroys the provided configuration object.
   *
   * @param config - Pointer to the configuration instance to destroy (`duckdb_config*`).
   * @returns Void.
   */
  duckdb_destroy_config: {
    parameters: ["pointer"],
    result: "void",
  },
} as const satisfies Deno.ForeignLibraryInterface;
