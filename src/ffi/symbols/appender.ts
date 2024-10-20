//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/appender.ts
// Appender - FFI functions for appending data into tables in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Creates an appender object for a given connection and table.
   * 
   * The appender is used to efficiently append data into a table. The schema can be set to `nullptr` 
   * for the default schema. The resulting appender must be destroyed with `duckdb_appender_destroy`
   * to free associated resources.
   * 
   * @param connection The DuckDB connection to create the appender in.
   * @param schema The schema of the table, or `nullptr` for the default schema.
   * @param table The name of the table to append data to.
   * @param out_appender A pointer to hold the resulting appender object.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_appender_create: {
    parameters: ["pointer", "pointer", "pointer", "pointer"] as const, // duckdb_connection, const char*, const char*, duckdb_appender*
    result: "i32" as const,                                            // duckdb_state (int32_t)
  },

  /**
   * Retrieves the number of columns in the table associated with the appender.
   * 
   * @param appender The appender object.
   * @returns The number of columns (`idx_t`) in the table.
   */
  duckdb_appender_column_count: {
    parameters: ["pointer"] as const,          // duckdb_appender
    result: "u64" as const,                    // idx_t
  },

  /**
   * Retrieves the logical type of the specified column in the appender.
   * 
   * The returned type must be destroyed with `duckdb_destroy_logical_type` to free resources.
   * 
   * @param appender The appender object.
   * @param col_idx The index of the column.
   * @returns A pointer to the logical type of the column.
   */
  duckdb_appender_column_type: {
    parameters: ["pointer", "u64"] as const,   // duckdb_appender, idx_t
    result: "pointer" as const,                // duckdb_logical_type
  },

  /**
   * Retrieves the error message associated with the appender.
   * 
   * If no error is present, it returns `nullptr`. The error message is automatically freed when 
   * `duckdb_appender_destroy` is called.
   * 
   * @param appender The appender object.
   * @returns The error message or `nullptr` if there is no error.
   */
  duckdb_appender_error: {
    parameters: ["pointer"] as const,          // duckdb_appender
    result: "pointer" as const,                // const char*
  },

  /**
   * Flushes the appender, forcing the cache to be cleared and data written to the table.
   * 
   * If an error occurs (e.g., constraint violation), the appender is invalidated and cannot be used further.
   * 
   * @param appender The appender object.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_appender_flush: {
    parameters: ["pointer"] as const,          // duckdb_appender
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Closes the appender, finalizing all intermediate states and preventing further appends.
   * 
   * If an error occurs during the flush, the appender is invalidated.
   * 
   * @param appender The appender object.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_appender_close: {
    parameters: ["pointer"] as const,          // duckdb_appender
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Destroys the appender, de-allocating any associated memory.
   * 
   * After destruction, the appender becomes invalid and cannot be used. Any error messages are no longer retrievable.
   * 
   * @param appender A pointer to the appender object to be destroyed.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_appender_destroy: {
    parameters: ["pointer"] as const,          // duckdb_appender*
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * No-op function for backward compatibility. Does nothing.
   * 
   * @param appender The appender object.
   * @returns Always returns `DuckDBSuccess`.
   */
  duckdb_appender_begin_row: {
    parameters: ["pointer"] as const,          // duckdb_appender
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Finalizes the current row in the appender.
   * 
   * After this is called, the next row can be appended.
   * 
   * @param appender The appender object.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_appender_end_row: {
    parameters: ["pointer"] as const,          // duckdb_appender
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a DEFAULT value (or NULL if no default is available) to the appender.
   * 
   * @param appender The appender object.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_default: {
    parameters: ["pointer"] as const,          // duckdb_appender
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a boolean value to the appender.
   * 
   * @param appender The appender object.
   * @param value The boolean value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_bool: {
    parameters: ["pointer", "bool"] as const,  // duckdb_appender, bool
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends an int8 value to the appender.
   * 
   * @param appender The appender object.
   * @param value The int8_t value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_int8: {
    parameters: ["pointer", "i8"] as const,    // duckdb_appender, int8_t
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends an int16 value to the appender.
   * 
   * @param appender The appender object.
   * @param value The int16_t value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_int16: {
    parameters: ["pointer", "i16"] as const,   // duckdb_appender, int16_t
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends an int32 value to the appender.
   * 
   * @param appender The appender object.
   * @param value The int32_t value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_int32: {
    parameters: ["pointer", "i32"] as const,   // duckdb_appender, int32_t
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends an int64 value to the appender.
   * 
   * @param appender The appender object.
   * @param value The int64_t value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_int64: {
    parameters: ["pointer", "i64"] as const,   // duckdb_appender, int64_t
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a hugeint value to the appender.
   * 
   * @param appender The appender object.
   * @param value A buffer containing the `duckdb_hugeint` value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_hugeint: {
    parameters: ["pointer", "buffer"] as const, // duckdb_appender, duckdb_hugeint
    result: "i32" as const,                     // duckdb_state (int32_t)
  },

  /**
   * Appends a uint8 value to the appender.
   * 
   * @param appender The appender object.
   * @param value The uint8_t value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_uint8: {
    parameters: ["pointer", "u8"] as const,    // duckdb_appender, uint8_t
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a uint16 value to the appender.
   * 
   * @param appender The appender object.
   * @param value The uint16_t value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_uint16: {
    parameters: ["pointer", "u16"] as const,   // duckdb_appender, uint16_t
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a uint32 value to the appender.
   * 
   * @param appender The appender object.
   * @param value The uint32_t value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_uint32: {
    parameters: ["pointer", "u32"] as const,   // duckdb_appender, uint32_t
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a uint64 value to the appender.
   * 
   * @param appender The appender object.
   * @param value The uint64_t value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_uint64: {
    parameters: ["pointer", "u64"] as const,   // duckdb_appender, uint64_t
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a float value to the appender.
   * 
   * @param appender The appender object.
   * @param value The float value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_float: {
    parameters: ["pointer", "f32"] as const,   // duckdb_appender, float
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a double value to the appender.
   * 
   * @param appender The appender object.
   * @param value The double value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_double: {
    parameters: ["pointer", "f64"] as const,   // duckdb_appender, double
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a date value to the appender.
   * 
   * @param appender The appender object.
   * @param value A buffer containing the `duckdb_date` value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_date: {
    parameters: ["pointer", "buffer"] as const, // duckdb_appender, duckdb_date
    result: "i32" as const,                     // duckdb_state (int32_t)
  },

  /**
   * Appends a time value to the appender.
   * 
   * @param appender The appender object.
   * @param value A buffer containing the `duckdb_time` value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_time: {
    parameters: ["pointer", "buffer"] as const, // duckdb_appender, duckdb_time
    result: "i32" as const,                     // duckdb_state (int32_t)
  },

  /**
   * Appends a timestamp value to the appender.
   * 
   * @param appender The appender object.
   * @param value A buffer containing the `duckdb_timestamp` value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_timestamp: {
    parameters: ["pointer", "buffer"] as const, // duckdb_appender, duckdb_timestamp
    result: "i32" as const,                     // duckdb_state (int32_t)
  },

  /**
   * Appends an interval value to the appender.
   * 
   * @param appender The appender object.
   * @param value A buffer containing the `duckdb_interval` value to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_interval: {
    parameters: ["pointer", "buffer"] as const, // duckdb_appender, duckdb_interval
    result: "i32" as const,                     // duckdb_state (int32_t)
  },

  /**
   * Appends a varchar (string) value to the appender.
   * 
   * @param appender The appender object.
   * @param val The null-terminated string to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_varchar: {
    parameters: ["pointer", "pointer"] as const, // duckdb_appender, const char*
    result: "i32" as const,                      // duckdb_state (int32_t)
  },

  /**
   * Appends a varchar (string) value with a specific length to the appender.
   * 
   * @param appender The appender object.
   * @param val The string to append.
   * @param length The length of the string.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_varchar_length: {
    parameters: ["pointer", "pointer", "u64"] as const, // duckdb_appender, const char*, idx_t (length)
    result: "i32" as const,                             // duckdb_state (int32_t)
  },

  /**
   * Appends a blob value to the appender.
   * 
   * @param appender The appender object.
   * @param data The blob data to append.
   * @param length The length of the blob data.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_blob: {
    parameters: ["pointer", "pointer", "u64"] as const, // duckdb_appender, const void*, idx_t (length)
    result: "i32" as const,                             // duckdb_state (int32_t)
  },

  /**
   * Appends a NULL value to the appender.
   * 
   * @param appender The appender object.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_null: {
    parameters: ["pointer"] as const,          // duckdb_appender
    result: "i32" as const,                    // duckdb_state (int32_t)
  },

  /**
   * Appends a pre-filled data chunk to the appender.
   * 
   * The types of the data chunk must match the table schema exactly. If the types don't match, 
   * `DuckDBError` is returned.
   * 
   * @param appender The appender object.
   * @param chunk The data chunk to append.
   * @returns `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_append_data_chunk: {
    parameters: ["pointer", "pointer"] as const, // duckdb_appender, duckdb_data_chunk
    result: "i32" as const,                      // duckdb_state (int32_t)
  },
};
