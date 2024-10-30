//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/table/index.ts
// Table Functions - FFI functions for working with table functions in DuckDB
//===--------------------------------------------------------------------===//

import bind from "./bind.ts";
import describe from "./describe.ts";
import init from "./init.ts";

export default {
  /**
   * Creates a new empty table function.
   * 
   * The created table function object must be destroyed with `duckdb_destroy_table_function`
   * to free the associated memory.
   * 
   * @return A pointer to the created table function object.
   */
  duckdb_create_table_function: {
    parameters: [],
    result: "pointer",  // duckdb_table_function
  },

  /**
   * Destroys the given table function object and frees its associated memory.
   * 
   * @param table_function A pointer to the table function to destroy (`duckdb_table_function*`).
   * @return void
   */
  duckdb_destroy_table_function: {
    parameters: ["pointer"],  // duckdb_table_function*
    result: "void",  // void
  },

  /**
   * Sets the name of the given table function.
   * 
   * @param table_function A pointer to the table function (`duckdb_table_function*`).
   * @param name A pointer to the null-terminated string representing the function name (`const char*`).
   * @return void
   */
  duckdb_table_function_set_name: {
    parameters: ["pointer", "pointer"],  // duckdb_table_function, const char* (name)
    result: "void",  // void
  },

  /**
   * Adds a parameter type to the table function.
   * 
   * The parameter type must be valid and cannot be `INVALID`.
   * 
   * @param table_function A pointer to the table function (`duckdb_table_function*`).
   * @param type A pointer to the `duckdb_logical_type` representing the parameter type.
   * @return void
   */
  duckdb_table_function_add_parameter: {
    parameters: ["pointer", "pointer"],  // duckdb_table_function, duckdb_logical_type
    result: "void",  // void
  },

  /**
   * Adds a named parameter to the table function.
   * 
   * The parameter type must be valid and cannot be `INVALID`.
   * 
   * @param table_function A pointer to the table function (`duckdb_table_function*`).
   * @param name A pointer to the null-terminated string representing the parameter name (`const char*`).
   * @param type A pointer to the `duckdb_logical_type` representing the parameter type.
   * @return void
   */
  duckdb_table_function_add_named_parameter: {
    parameters: ["pointer", "pointer", "pointer"],  // duckdb_table_function, const char* (name), duckdb_logical_type
    result: "void",  // void
  },

  /**
   * Sets extra information for the table function, which can be accessed during binding or other stages.
   * 
   * The `destroy` callback is used to clean up the extra info if needed.
   * 
   * @param table_function A pointer to the table function (`duckdb_table_function*`).
   * @param extra_info A pointer to the extra information (`void*`).
   * @param destroy A callback function to destroy the extra info (`duckdb_delete_callback_t`).
   * @return void
   */
  duckdb_table_function_set_extra_info: {
    parameters: ["pointer", "pointer", "pointer"],  // duckdb_table_function, void* (extra_info), duckdb_delete_callback_t
    result: "void",  // void
  },

  /**
   * Sets the bind function for the table function.
   * 
   * The bind function is responsible for defining how the table function is executed.
   * 
   * @param table_function A pointer to the table function (`duckdb_table_function*`).
   * @param bind A pointer to the bind function (`duckdb_table_function_bind_t`).
   * @return void
   */
  duckdb_table_function_set_bind: {
    parameters: ["pointer", "pointer"],  // duckdb_table_function, duckdb_table_function_bind_t (bind function)
    result: "void",  // void
  },

  /**
   * Sets the initialization function for the table function.
   * 
   * The initialization function prepares the function for execution.
   * 
   * @param table_function A pointer to the table function (`duckdb_table_function*`).
   * @param init A pointer to the initialization function (`duckdb_table_function_init_t`).
   * @return void
   */
  duckdb_table_function_set_init: {
    parameters: ["pointer", "pointer"],  // duckdb_table_function, duckdb_table_function_init_t (init function)
    result: "void",  // void
  },

  /**
   * Sets the thread-local initialization function for the table function.
   * 
   * This function is used during parallel execution to initialize the function per thread.
   * 
   * @param table_function A pointer to the table function (`duckdb_table_function*`).
   * @param init A pointer to the thread-local initialization function (`duckdb_table_function_init_t`).
   * @return void
   */
  duckdb_table_function_set_local_init: {
    parameters: ["pointer", "pointer"],  // duckdb_table_function, duckdb_table_function_init_t (init function)
    result: "void",  // void
  },

  /**
   * Sets the main execution function for the table function.
   * 
   * The main execution function handles the core logic of the table function.
   * 
   * @param table_function A pointer to the table function (`duckdb_table_function*`).
   * @param function A pointer to the main execution function (`duckdb_table_function_t`).
   * @return void
   */
  duckdb_table_function_set_function: {
    parameters: ["pointer", "pointer"],  // duckdb_table_function, duckdb_table_function_t (function)
    result: "void",  // void
  },

  /**
   * Configures the table function to support projection pushdown.
   * 
   * If enabled, the system will pass a list of required columns during the init stage, 
   * optimizing the execution of the table function.
   * 
   * @param table_function A pointer to the table function (`duckdb_table_function*`).
   * @param pushdown A boolean indicating whether projection pushdown is supported.
   * @return void
   */
  duckdb_table_function_supports_projection_pushdown: {
    parameters: ["pointer", "bool"],  // duckdb_table_function, bool (pushdown)
    result: "void",  // void
  },

  /**
   * Registers the table function object within a connection.
   * 
   * The table function must have a name, a bind function, an init function, and a main function.
   * 
   * @param con A pointer to the DuckDB connection (`duckdb_connection*`).
   * @param function A pointer to the table function object (`duckdb_table_function*`).
   * @return An integer representing success (`DuckDBSuccess`) or failure (`DuckDBError`).
   */
  duckdb_register_table_function: {
    parameters: ["pointer", "pointer"],  // duckdb_connection, duckdb_table_function
    result: "i32",  // duckdb_state (int32_t)
  },

  /**
   * Retrieves the extra information associated with the table function.
   * 
   * This extra info is set using `duckdb_table_function_set_extra_info`.
   * 
   * @param info A pointer to the `duckdb_function_info` object.
   * @return A pointer to the extra info object.
   */
  duckdb_function_get_extra_info: {
    parameters: ["pointer"],  // duckdb_function_info
    result: "pointer",        // void*
  },

  /**
   * Retrieves the bind data that was set during the bind phase using `duckdb_bind_set_bind_data`.
   * 
   * The bind data should be treated as read-only during function execution. For state tracking purposes,
   * the init data should be used instead.
   * 
   * @param info A pointer to the `duckdb_function_info` object.
   * @return A pointer to the bind data object.
   */
  duckdb_function_get_bind_data: {
    parameters: ["pointer"],  // duckdb_function_info
    result: "pointer",        // void*
  },

  /**
   * Retrieves the init data that was set during the initialization phase using `duckdb_init_set_init_data`.
   * 
   * This data can be accessed during the execution of the function.
   * 
   * @param info A pointer to the `duckdb_function_info` object.
   * @return A pointer to the init data object.
   */
  duckdb_function_get_init_data: {
    parameters: ["pointer"],  // duckdb_function_info
    result: "pointer",        // void*
  },

  /**
   * Retrieves the thread-local init data that was set during the local initialization phase using `duckdb_init_set_init_data`.
   * 
   * This data is specific to a particular thread during parallel execution of the table function.
   * 
   * @param info A pointer to the `duckdb_function_info` object.
   * @return A pointer to the thread-local init data object.
   */
  duckdb_function_get_local_init_data: {
    parameters: ["pointer"],  // duckdb_function_info
    result: "pointer",        // void*
  },

  /**
   * Reports an error that occurred during the execution of the table function.
   * 
   * The error message will be displayed or logged accordingly.
   * 
   * @param info A pointer to the `duckdb_function_info` object.
   * @param error A pointer to the null-terminated string representing the error message (`const char*`).
   * @return void
   */
  duckdb_function_set_error: {
    parameters: ["pointer", "pointer"],  // duckdb_function_info, const char* (error message)
    result: "void",                      // void
  },

  ...bind,
  ...init,
  ...describe,
} as const satisfies Deno.ForeignLibraryInterface;
