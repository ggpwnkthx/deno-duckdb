//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/aggregate.ts
// Aggregate Functions
//===--------------------------------------------------------------------===//

import { duckdb_logical_type } from "../enums.ts";

export default {
  /**
   * Creates a new empty aggregate function.
   * The return value should be destroyed with `duckdb_destroy_aggregate_function`.
   *
   * @return A pointer to the created aggregate function object.
   */
  duckdb_create_aggregate_function: {
    parameters: [],
    result: "pointer",  // duckdb_aggregate_function
  },

  /**
   * Destroys the given aggregate function object and frees its associated memory.
   *
   * @param aggregate_function A pointer to the aggregate function to destroy.
   * @return void
   */
  duckdb_destroy_aggregate_function: {
    parameters: ["pointer"],  // duckdb_aggregate_function*
    result: "void",  // void
  },

  /**
   * Sets the name of the aggregate function.
   *
   * @param aggregate_function A pointer to the aggregate function.
   * @param name A pointer to the null-terminated string representing the function name.
   * @return void
   */
  duckdb_aggregate_function_set_name: {
    parameters: ["pointer", "pointer"],  // duckdb_aggregate_function, const char* (name)
    result: "void",  // void
  },

  /**
   * Adds a parameter type to the aggregate function.
   *
   * @param aggregate_function A pointer to the aggregate function.
   * @param type A pointer to the duckdb_logical_type representing the parameter type.
   * @return void
   */
  duckdb_aggregate_function_add_parameter: {
    parameters: ["pointer", duckdb_logical_type],  // duckdb_aggregate_function, duckdb_logical_type
    result: "void",  // void
  },

  /**
   * Sets the return type for the aggregate function.
   *
   * @param aggregate_function A pointer to the aggregate function.
   * @param type A pointer to the duckdb_logical_type representing the return type.
   * @return void
   */
  duckdb_aggregate_function_set_return_type: {
    parameters: ["pointer", duckdb_logical_type],  // duckdb_aggregate_function, duckdb_logical_type
    result: "void",  // void
  },

  /**
   * Sets the state size, initialization, update, combine, and finalize functions for the aggregate function.
   *
   * @param aggregate_function A pointer to the aggregate function.
   * @param state_size A function pointer for calculating the state size.
   * @param state_init A function pointer for initializing the state.
   * @param update A function pointer for updating the state.
   * @param combine A function pointer for combining states.
   * @param finalize A function pointer for finalizing the aggregate state.
   * @return void
   */
  duckdb_aggregate_function_set_functions: {
    parameters: ["pointer", "pointer", "pointer", "pointer", "pointer", "pointer"],  // duckdb_aggregate_function, duckdb_aggregate_state_size, duckdb_aggregate_init_t, duckdb_aggregate_update_t, duckdb_aggregate_combine_t, duckdb_aggregate_finalize_t
    result: "void",  // void
  },

  /**
   * Sets the destructor function for the aggregate function state (optional).
   *
   * @param aggregate_function A pointer to the aggregate function.
   * @param destroy A function pointer for destroying the aggregate state.
   * @return void
   */
  duckdb_aggregate_function_set_destructor: {
    parameters: ["pointer", "pointer"],  // duckdb_aggregate_function, duckdb_aggregate_destroy_t
    result: "void",  // void
  },

  /**
   * Registers the aggregate function in the given DuckDB connection.
   * The function must have a name, the necessary function pointers, and a return type.
   *
   * @param con A pointer to the duckdb_connection.
   * @param aggregate_function A pointer to the aggregate function object.
   * @return An integer representing the success (`DuckDBSuccess`) or failure (`DuckDBError`) of the registration.
   */
  duckdb_register_aggregate_function: {
    parameters: ["pointer", "pointer"],  // duckdb_connection, duckdb_aggregate_function
    result: "i32",  // duckdb_state (int32_t)
  },

  /**
   * Sets the NULL handling of the aggregate function to SPECIAL_HANDLING.
   *
   * @param aggregate_function A pointer to the aggregate function.
   * @return void
   */
  duckdb_aggregate_function_set_special_handling: {
    parameters: ["pointer"],  // duckdb_aggregate_function
    result: "void",  // void
  },

  /**
   * Attaches extra information to the aggregate function.
   * The extra info can be fetched during binding or execution.
   *
   * @param aggregate_function A pointer to the aggregate function.
   * @param extra_info A pointer to the extra information.
   * @param destroy A callback function to destroy the extra information when no longer needed.
   * @return void
   */
  duckdb_aggregate_function_set_extra_info: {
    parameters: ["pointer", "pointer", "pointer"],  // duckdb_aggregate_function, void* (extra_info), duckdb_delete_callback_t
    result: "void",  // void
  },

  /**
   * Retrieves the extra information attached to the aggregate function.
   *
   * @param info A pointer to the duckdb_function_info.
   * @return A pointer to the extra information.
   */
  duckdb_aggregate_function_get_extra_info: {
    parameters: ["pointer"],  // duckdb_function_info
    result: "pointer",  // void*
  },

  /**
   * Reports an error during the execution of the aggregate function.
   *
   * @param info A pointer to the duckdb_function_info.
   * @param error A pointer to a null-terminated string containing the error message.
   * @return void
   */
  duckdb_aggregate_function_set_error: {
    parameters: ["pointer", "pointer"],  // duckdb_function_info, const char* (error message)
    result: "void",  // void
  },

  /**
   * Creates a new aggregate function set.
   * The return value should be destroyed with `duckdb_destroy_aggregate_function_set`.
   *
   * @param name A pointer to a null-terminated string representing the name of the function set.
   * @return A pointer to the created aggregate function set.
   */
  duckdb_create_aggregate_function_set: {
    parameters: ["pointer"],  // const char* (name)
    result: "pointer",  // duckdb_aggregate_function_set
  },

  /**
   * Destroys an aggregate function set and frees its associated memory.
   *
   * @param aggregate_function_set A pointer to the aggregate function set to destroy.
   * @return void
   */
  duckdb_destroy_aggregate_function_set: {
    parameters: ["pointer"],  // duckdb_aggregate_function_set*
    result: "void",  // void
  },

  /**
   * Adds an aggregate function as an overload to an aggregate function set.
   *
   * @param set A pointer to the aggregate function set.
   * @param function A pointer to the aggregate function to add as an overload.
   * @return An integer representing success (`DuckDBSuccess`) or failure (`DuckDBError`).
   */
  duckdb_add_aggregate_function_to_set: {
    parameters: ["pointer", "pointer"],  // duckdb_aggregate_function_set, duckdb_aggregate_function
    result: "i32",  // duckdb_state (int32_t)
  },

  /**
   * Registers an aggregate function set in the given DuckDB connection.
   * The set must contain at least one valid overload.
   *
   * @param con A pointer to the duckdb_connection.
   * @param set A pointer to the aggregate function set.
   * @return An integer representing success (`DuckDBSuccess`) or failure (`DuckDBError`).
   */
  duckdb_register_aggregate_function_set: {
    parameters: ["pointer", "pointer"],  // duckdb_connection, duckdb_aggregate_function_set
    result: "i32",  // duckdb_state (int32_t)
  },
} as const satisfies Deno.ForeignLibraryInterface;
