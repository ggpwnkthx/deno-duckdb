//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/scalar.ts
// Scalar Functions
//===--------------------------------------------------------------------===//

export default {
  /**
   * Creates a new empty scalar function.
   * The return value should be destroyed with `duckdb_destroy_scalar_function`.
   *
   * @return A pointer to the created scalar function object.
   */
  duckdb_create_scalar_function: {
    parameters: [] as const,
    result: "pointer" as const,                // duckdb_scalar_function
  },

  /**
   * Destroys the given scalar function object and frees associated memory.
   *
   * @param scalar_function A pointer to the scalar function to destroy.
   * @return void
   */
  duckdb_destroy_scalar_function: {
    parameters: ["pointer"] as const,          // duckdb_scalar_function*
    result: "void" as const,                   // void
  },

  /**
   * Sets the name of the given scalar function.
   *
   * @param scalar_function A pointer to the scalar function.
   * @param name A pointer to the null-terminated string representing the function name.
   * @return void
   */
  duckdb_scalar_function_set_name: {
    parameters: ["pointer", "pointer"] as const, // duckdb_scalar_function, const char* (name)
    result: "void" as const,                     // void
  },

  /**
   * Configures the scalar function to accept variable argument types (varargs).
   *
   * @param scalar_function A pointer to the scalar function.
   * @param type A pointer to the duckdb_logical_type indicating the argument type.
   * @return void
   */
  duckdb_scalar_function_set_varargs: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_scalar_function, duckdb_logical_type
    result: "void" as const,                      // void
  },

  /**
   * Marks the scalar function for special handling (custom behavior).
   *
   * @param scalar_function A pointer to the scalar function.
   * @return void
   */
  duckdb_scalar_function_set_special_handling: {
    parameters: ["pointer"] as const,            // duckdb_scalar_function
    result: "void" as const,                    // void
  },

  /**
   * Sets the function's stability to VOLATILE, meaning it must be evaluated for every row.
   *
   * @param scalar_function A pointer to the scalar function.
   * @return void
   */
  duckdb_scalar_function_set_volatile: {
    parameters: ["pointer"] as const,           // duckdb_scalar_function
    result: "void" as const,                    // void
  },

  /**
   * Adds a parameter type to the scalar function.
   *
   * @param scalar_function A pointer to the scalar function.
   * @param type A pointer to the duckdb_logical_type representing the parameter type.
   * @return void
   */
  duckdb_scalar_function_add_parameter: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_scalar_function, duckdb_logical_type
    result: "void" as const,                      // void
  },

  /**
   * Sets the return type for the scalar function.
   *
   * @param scalar_function A pointer to the scalar function.
   * @param type A pointer to the duckdb_logical_type representing the return type.
   * @return void
   */
  duckdb_scalar_function_set_return_type: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_scalar_function, duckdb_logical_type
    result: "void" as const,                      // void
  },

  /**
   * Sets extra information associated with the scalar function.
   *
   * @param scalar_function A pointer to the scalar function.
   * @param extra_info A pointer to the extra information to attach to the function.
   * @param destroy A callback function that is called to destroy the extra information when no longer needed.
   * @return void
   */
  duckdb_scalar_function_set_extra_info: {
    parameters: ["pointer", "pointer", "pointer"] as const, // duckdb_scalar_function, void* (extra_info), duckdb_delete_callback_t
    result: "void" as const,                                // void
  },

  /**
   * Sets the main callback function to be executed when the scalar function is called.
   *
   * @param scalar_function A pointer to the scalar function.
   * @param function A pointer to the duckdb_scalar_function_t function callback.
   * @return void
   */
  duckdb_scalar_function_set_function: {
    parameters: ["pointer", "pointer"] as const, // duckdb_scalar_function, duckdb_scalar_function_t (function)
    result: "void" as const,                     // void
  },

  /**
   * Registers the scalar function in the given DuckDB connection.
   *
   * @param con A pointer to the duckdb_connection.
   * @param scalar_function A pointer to the scalar function object.
   * @return An integer representing the success (`DuckDBSuccess`) or failure (`DuckDBError`) of the registration.
   */
  duckdb_register_scalar_function: {
    parameters: ["pointer", "pointer"] as const, // duckdb_connection, duckdb_scalar_function
    result: "i32" as const,                      // duckdb_state (int32_t)
  },

  /**
   * Retrieves the extra information attached to a scalar function.
   *
   * @param info A pointer to the duckdb_function_info.
   * @return A pointer to the extra information.
   */
  duckdb_scalar_function_get_extra_info: {
    parameters: ["pointer"] as const,            // duckdb_function_info
    result: "pointer" as const,                  // void* (extra_info)
  },

  /**
   * Reports an error during the execution of a scalar function.
   *
   * @param info A pointer to the duckdb_function_info.
   * @param error A pointer to a null-terminated string containing the error message.
   * @return void
   */
  duckdb_scalar_function_set_error: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_function_info, const char* (error message)
    result: "void" as const,                     // void
  },

  /**
   * Creates a new scalar function set, which groups multiple scalar function overloads.
   *
   * @param name A pointer to a null-terminated string representing the name of the scalar function set.
   * @return A pointer to the created scalar function set.
   */
  duckdb_create_scalar_function_set: {
    parameters: ["pointer"] as const,            // const char* (name)
    result: "pointer" as const,                  // duckdb_scalar_function_set
  },

  /**
   * Destroys a scalar function set and frees its associated memory.
   *
   * @param scalar_function_set A pointer to the scalar function set to destroy.
   * @return void
   */
  duckdb_destroy_scalar_function_set: {
    parameters: ["pointer"] as const,            // duckdb_scalar_function_set*
    result: "void" as const,                     // void
  },

  /**
   * Adds a scalar function as an overload to an existing scalar function set.
   *
   * @param set A pointer to the scalar function set.
   * @param function A pointer to the scalar function to add as an overload.
   * @return An integer representing success (`DuckDBSuccess`) or failure (`DuckDBError`).
   */
  duckdb_add_scalar_function_to_set: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_scalar_function_set, duckdb_scalar_function
    result: "i32" as const,                       // duckdb_state (int32_t)
  },

  /**
   * Registers a scalar function set in the given DuckDB connection.
   *
   * @param con A pointer to the duckdb_connection.
   * @param set A pointer to the scalar function set.
   * @return An integer representing success (`DuckDBSuccess`) or failure (`DuckDBError`).
   */
  duckdb_register_scalar_function_set: {
    parameters: ["pointer", "pointer"] as const,  // duckdb_connection, duckdb_scalar_function_set
    result: "i32" as const,                       // duckdb_state (int32_t)
  },
};
