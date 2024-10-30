//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/prepared_statements/bind_values.ts
// Bind Values To Prepared Statements - FFI functions for binding values to prepared statements in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Binds a general `duckdb_value` to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the value to.
   * @param val The `duckdb_value` to bind to the parameter.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_value: {
    parameters: ["pointer", "u64", "buffer"],  // duckdb_prepared_statement, idx_t (uint64_t), duckdb_value
    result: "i32",                             // duckdb_state (int32_t)
  },

  /**
   * Binds a value to a prepared statement by parameter name and retrieves the parameter index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx_out The output index of the parameter.
   * @param name The name of the parameter to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_parameter_index: {
    parameters: ["pointer", "pointer", "pointer"], // duckdb_prepared_statement, idx_t*, const char*
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a boolean value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the boolean value to.
   * @param val The boolean value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_boolean: {
    parameters: ["pointer", "u64", "bool"],        // duckdb_prepared_statement, idx_t (uint64_t), bool
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds an int8 value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the int8 value to.
   * @param val The int8 value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_int8: {
    parameters: ["pointer", "u64", "i8"],          // duckdb_prepared_statement, idx_t (uint64_t), int8_t
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds an int16 value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the int16 value to.
   * @param val The int16 value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_int16: {
    parameters: ["pointer", "u64", "i16"],         // duckdb_prepared_statement, idx_t (uint64_t), int16_t
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds an int32 value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the int32 value to.
   * @param val The int32 value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_int32: {
    parameters: ["pointer", "u64", "i32"],         // duckdb_prepared_statement, idx_t (uint64_t), int32_t
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds an int64 value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the int64 value to.
   * @param val The int64 value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_int64: {
    parameters: ["pointer", "u64", "i64"],         // duckdb_prepared_statement, idx_t (uint64_t), int64_t
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a `duckdb_hugeint` value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the `duckdb_hugeint` value to.
   * @param val The `duckdb_hugeint` value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_hugeint: {
    parameters: ["pointer", "u64", "buffer"],      // duckdb_prepared_statement, idx_t (uint64_t), duckdb_hugeint
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a `duckdb_uhugeint` value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the `duckdb_uhugeint` value to.
   * @param val The `duckdb_uhugeint` value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_uhugeint: {
    parameters: ["pointer", "u64", "buffer"],      // duckdb_prepared_statement, idx_t (uint64_t), duckdb_uhugeint
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a `duckdb_decimal` value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the `duckdb_decimal` value to.
   * @param val The `duckdb_decimal` value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_decimal: {
    parameters: ["pointer", "u64", "buffer"],      // duckdb_prepared_statement, idx_t (uint64_t), duckdb_decimal
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a uint8 value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the uint8 value to.
   * @param val The uint8 value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_uint8: {
    parameters: ["pointer", "u64", "u8"],          // duckdb_prepared_statement, idx_t (uint64_t), uint8_t
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a uint16 value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the uint16 value to.
   * @param val The uint16 value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_uint16: {
    parameters: ["pointer", "u64", "u16"],         // duckdb_prepared_statement, idx_t (uint64_t), uint16_t
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a uint32 value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the uint32 value to.
   * @param val The uint32 value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_uint32: {
    parameters: ["pointer", "u64", "u32"],         // duckdb_prepared_statement, idx_t (uint64_t), uint32_t
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a uint64 value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the uint64 value to.
   * @param val The uint64 value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_uint64: {
    parameters: ["pointer", "u64", "u64"],         // duckdb_prepared_statement, idx_t (uint64_t), uint64_t
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a float value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the float value to.
   * @param val The float value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_float: {
    parameters: ["pointer", "u64", "f32"],         // duckdb_prepared_statement, idx_t (uint64_t), float
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a double value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the double value to.
   * @param val The double value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_double: {
    parameters: ["pointer", "u64", "f64"],         // duckdb_prepared_statement, idx_t (uint64_t), double
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a `duckdb_date` value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the `duckdb_date` value to.
   * @param val The `duckdb_date` value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_date: {
    parameters: ["pointer", "u64", "buffer"],      // duckdb_prepared_statement, idx_t (uint64_t), duckdb_date
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a `duckdb_time` value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the `duckdb_time` value to.
   * @param val The `duckdb_time` value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_time: {
    parameters: ["pointer", "u64", "buffer"],      // duckdb_prepared_statement, idx_t (uint64_t), duckdb_time
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a `duckdb_timestamp` value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the `duckdb_timestamp` value to.
   * @param val The `duckdb_timestamp` value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_timestamp: {
    parameters: ["pointer", "u64", "buffer"],      // duckdb_prepared_statement, idx_t (uint64_t), duckdb_timestamp
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a `duckdb_timestamp_tz` value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the `duckdb_timestamp_tz` value to.
   * @param val The `duckdb_timestamp_tz` value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_timestamp_tz: {
    parameters: ["pointer", "u64", "buffer"],      // duckdb_prepared_statement, idx_t (uint64_t), duckdb_timestamp_tz
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a `duckdb_interval` value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the `duckdb_interval` value to.
   * @param val The `duckdb_interval` value to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_interval: {
    parameters: ["pointer", "u64", "buffer"],      // duckdb_prepared_statement, idx_t (uint64_t), duckdb_interval
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a null-terminated varchar string to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the varchar string to.
   * @param val The null-terminated varchar string to bind.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_varchar: {
    parameters: ["pointer", "u64", "pointer"],     // duckdb_prepared_statement, idx_t (uint64_t), const char*
    result: "i32",                                 // duckdb_state (int32_t)
  },

  /**
   * Binds a varchar string of a specific length to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the varchar string to.
   * @param val The varchar string to bind.
   * @param length The length of the varchar string.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_varchar_length: {
    parameters: ["pointer", "u64", "pointer", "u64"], // duckdb_prepared_statement, idx_t (uint64_t), const char*, idx_t
    result: "i32",                                    // duckdb_state (int32_t)
  },

  /**
   * Binds a blob of data to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind the blob data to.
   * @param data The blob data to bind.
   * @param length The length of the blob data.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_blob: {
    parameters: ["pointer", "u64", "pointer", "u64"], // duckdb_prepared_statement, idx_t (uint64_t), const void*, idx_t
    result: "i32",                                    // duckdb_state (int32_t)
  },

  /**
   * Binds a NULL value to a prepared statement at the specified index.
   * 
   * @param prepared_statement The prepared statement object.
   * @param param_idx The index of the parameter to bind NULL to.
   * @return `DuckDBSuccess` (`int32_t`) on success or `DuckDBError` on failure.
   */
  duckdb_bind_null: {
    parameters: ["pointer", "u64"],                // duckdb_prepared_statement, idx_t (uint64_t)
    result: "i32",                                 // duckdb_state (int32_t)
  },
} as const satisfies Deno.ForeignLibraryInterface;
