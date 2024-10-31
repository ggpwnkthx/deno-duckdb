//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/cast.ts
// Cast Functions - FFI functions for managing custom cast functions in DuckDB
//===--------------------------------------------------------------------===//

import { duckdb_logical_type, duckdb_vector } from "../enums.ts";

export default {
  /**
   * Creates a new cast function object.
   * 
   * This cast function object can be used to define custom cast logic between types.
   * 
   * @return A pointer to the created cast function object (`duckdb_cast_function`).
   */
  duckdb_create_cast_function: {
    parameters: [],                    // No parameters
    result: "pointer",                 // duckdb_cast_function
  },

  /**
   * Sets the source type for the cast function.
   * 
   * The source type represents the type that the cast function will convert from.
   * 
   * @param cast_function The cast function object.
   * @param source_type The source type to set for casting (`duckdb_logical_type`).
   */
  duckdb_cast_function_set_source_type: {
    parameters: ["pointer", duckdb_logical_type], // duckdb_cast_function, duckdb_logical_type (source type)
    result: "void",                     // No return value (void)
  },

  /**
   * Sets the target type for the cast function.
   * 
   * The target type represents the type that the cast function will convert to.
   * 
   * @param cast_function The cast function object.
   * @param target_type The target type to set for casting (`duckdb_logical_type`).
   */
  duckdb_cast_function_set_target_type: {
    parameters: ["pointer", duckdb_logical_type], // duckdb_cast_function, duckdb_logical_type (target type)
    result: "void",                     // No return value (void)
  },

  /**
   * Sets the implicit cast cost for the cast function.
   * 
   * This cost is used to determine which cast to use if multiple options are available. 
   * Lower costs are preferred when performing implicit casting.
   * 
   * @param cast_function The cast function object.
   * @param cost The implicit cast cost to set (`int64_t`).
   */
  duckdb_cast_function_set_implicit_cast_cost: {
    parameters: ["pointer", "i64"],    // duckdb_cast_function, int64_t (cost)
    result: "void",                    // No return value (void)
  },

  /**
   * Sets the actual function to use for performing the cast.
   * 
   * This function will handle the logic for converting from the source type to the target type.
   * 
   * @param cast_function The cast function object.
   * @param function The function to use for casting (`duckdb_cast_function_t`).
   */
  duckdb_cast_function_set_function: {
    parameters: ["pointer", "pointer"], // duckdb_cast_function, duckdb_cast_function_t (function)
    result: "void",                    // No return value (void)
  },

  /**
   * Sets extra information that can be retrieved during the execution of the cast function.
   * 
   * This extra information can be used by the cast function during its execution to hold additional context or configuration.
   * 
   * @param cast_function The cast function object.
   * @param extra_info A pointer to extra information (`void*`).
   * @param destroy A callback function to destroy the extra information when no longer needed (`duckdb_delete_callback_t`).
   */
  duckdb_cast_function_set_extra_info: {
    parameters: ["pointer", "pointer", "pointer"], // duckdb_cast_function, void* (extra_info), duckdb_delete_callback_t
    result: "void",                                // No return value (void)
  },

  /**
   * Retrieves the extra information set in the cast function.
   * 
   * @param info The function info object.
   * @return A pointer to the extra information (`void*`).
   */
  duckdb_cast_function_get_extra_info: {
    parameters: ["pointer"],           // duckdb_function_info
    result: "pointer",                 // void* (extra_info)
  },

  /**
   * Retrieves the cast mode from the cast function information.
   * 
   * The cast mode indicates whether the cast is a regular cast or a "try" cast (which doesn't throw an error).
   * 
   * @param info The function info object.
   * @return The cast mode (`duckdb_cast_mode`).
   */
  duckdb_cast_function_get_cast_mode: {
    parameters: ["pointer"],           // duckdb_function_info
    result: "i32",                     // duckdb_cast_mode (int32_t)
  },

  /**
   * Reports an error that occurred while executing the cast function.
   * 
   * This function can be used to report errors encountered during the cast operation.
   * 
   * @param info The function info object.
   * @param error A pointer to the error message (`const char*`).
   */
  duckdb_cast_function_set_error: {
    parameters: ["pointer", "pointer"], // duckdb_function_info, const char* (error message)
    result: "void",                     // No return value (void)
  },

  /**
   * Reports an error for a specific row during the cast function execution and sets the corresponding row to NULL.
   * 
   * This function is useful for handling per-row errors during a cast, ensuring that invalid data is safely ignored.
   * 
   * @param info The function info object.
   * @param error A pointer to the error message (`const char*`).
   * @param row The index of the row in the output vector to set to NULL (`idx_t`).
   * @param output The output vector where the row should be set to NULL.
   */
  duckdb_cast_function_set_row_error: {
    parameters: ["pointer", "pointer", "u64", duckdb_vector], // duckdb_function_info, const char* (error), idx_t (uint64_t), duckdb_vector (output)
    result: "void",                                       // No return value (void)
  },

  /**
   * Registers a cast function within the given connection.
   * 
   * This registers the custom cast function, making it available for use within the DuckDB connection.
   * 
   * @param con The DuckDB connection to register the cast function in.
   * @param cast_function The cast function object to register.
   * @return `DuckDBSuccess` on success, or `DuckDBError` on failure (`int32_t`).
   */
  duckdb_register_cast_function: {
    parameters: ["pointer", "pointer"], // duckdb_connection, duckdb_cast_function
    result: "i32",                      // duckdb_state (int32_t)
  },

  /**
   * Destroys the given cast function object and frees its associated resources.
   * 
   * @param cast_function A pointer to the cast function object to destroy.
   */
  duckdb_destroy_cast_function: {
    parameters: ["pointer"],           // duckdb_cast_function*
    result: "void",                    // No return value (void)
  },
} as const satisfies Deno.ForeignLibraryInterface;
