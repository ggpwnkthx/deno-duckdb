//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/interfaces/values.ts
// Value Interface - FFI functions for managing values in DuckDB
//===--------------------------------------------------------------------===//

import { duckdb_logical_type } from "../../enums.ts";

export default {
  /**
   * Destroys a value and frees its allocated memory.
   * 
   * @param value A pointer to the `duckdb_value` to destroy.
   * @return void
   */
  duckdb_destroy_value: {
    parameters: ["pointer"],           // duckdb_value*
    result: "void",                    // void
  },

  /**
   * Creates a value from a null-terminated string.
   * 
   * @param text A pointer to the null-terminated string.
   * @return A pointer to a `duckdb_value` containing the string. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_varchar: {
    parameters: ["pointer"],           // const char*
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a string of a specified length.
   * 
   * @param text A pointer to the string.
   * @param length The length of the string.
   * @return A pointer to a `duckdb_value` containing the string. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_varchar_length: {
    parameters: ["pointer", "u64"],    // const char*, idx_t (uint64_t)
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a boolean.
   * 
   * @param input The boolean value.
   * @return A pointer to a `duckdb_value` containing the boolean. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_bool: {
    parameters: ["bool"],              // bool
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from an `int8_t`.
   * 
   * @param input The `int8_t` value.
   * @return A pointer to a `duckdb_value` containing the `int8_t`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_int8: {
    parameters: ["i8"],                // int8_t
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a `uint8_t`.
   * 
   * @param input The `uint8_t` value.
   * @return A pointer to a `duckdb_value` containing the `uint8_t`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_uint8: {
    parameters: ["u8"],                // uint8_t
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from an `int16_t`.
   * 
   * @param input The `int16_t` value.
   * @return A pointer to a `duckdb_value` containing the `int16_t`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_int16: {
    parameters: ["i16"],               // int16_t
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a `uint16_t`.
   * 
   * @param input The `uint16_t` value.
   * @return A pointer to a `duckdb_value` containing the `uint16_t`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_uint16: {
    parameters: ["u16"],               // uint16_t
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from an `int32_t`.
   * 
   * @param input The `int32_t` value.
   * @return A pointer to a `duckdb_value` containing the `int32_t`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_int32: {
    parameters: ["i32"],               // int32_t
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a `uint32_t`.
   * 
   * @param input The `uint32_t` value.
   * @return A pointer to a `duckdb_value` containing the `uint32_t`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_uint32: {
    parameters: ["u32"],               // uint32_t
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from an `int64_t`.
   * 
   * @param input The `int64_t` value.
   * @return A pointer to a `duckdb_value` containing the `int64_t`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_int64: {
    parameters: ["i64"],               // int64_t
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a `uint64_t`.
   * 
   * @param input The `uint64_t` value.
   * @return A pointer to a `duckdb_value` containing the `uint64_t`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_uint64: {
    parameters: ["u64"],               // uint64_t
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a float.
   * 
   * @param input The float value.
   * @return A pointer to a `duckdb_value` containing the float. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_float: {
    parameters: ["f32"],               // float
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a double.
   * 
   * @param input The double value.
   * @return A pointer to a `duckdb_value` containing the double. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_double: {
    parameters: ["f64"],               // double
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a `duckdb_hugeint`.
   * 
   * @param input The `duckdb_hugeint` value.
   * @return A pointer to a `duckdb_value` containing the `hugeint`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_hugeint: {
    parameters: ["buffer"],            // duckdb_hugeint
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a `duckdb_uhugeint`.
   * 
   * @param input The `duckdb_uhugeint` value.
   * @return A pointer to a `duckdb_value` containing the `uhugeint`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_uhugeint: {
    parameters: ["buffer"],            // duckdb_uhugeint
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a date.
   * 
   * @param input The `duckdb_date` value.
   * @return A pointer to a `duckdb_value` containing the date. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_date: {
    parameters: ["buffer"],            // duckdb_date
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a time.
   * 
   * @param input The `duckdb_time` value.
   * @return A pointer to a `duckdb_value` containing the time. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_time: {
    parameters: ["buffer"],            // duckdb_time
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a timestamp.
   * 
   * @param input The `duckdb_timestamp` value.
   * @return A pointer to a `duckdb_value` containing the timestamp. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_timestamp: {
    parameters: ["buffer"],            // duckdb_timestamp
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a `duckdb_time_tz`.
   * 
   * @param input The `duckdb_time_tz` value.
   * @return A pointer to a `duckdb_value` containing the `time_tz`. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_time_tz_value: {
    parameters: ["buffer"],            // duckdb_time_tz
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from an interval.
   * 
   * @param input The `duckdb_interval` value.
   * @return A pointer to a `duckdb_value` containing the interval. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_interval: {
    parameters: ["buffer"],            // duckdb_interval
    result: "pointer",                 // duckdb_value
  },

  /**
   * Creates a value from a blob.
   * 
   * @param data A pointer to the blob data.
   * @param length The length of the blob data.
   * @return A pointer to a `duckdb_value` containing the blob. This must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_blob: {
    parameters: ["pointer", "u64"],    // const uint8_t*, idx_t (uint64_t)
    result: "pointer",                 // duckdb_value
  },

  /**
   * Retrieves the boolean value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a boolean.
   * @return The boolean value, or false if it cannot be converted.
   */
  duckdb_get_bool: {
    parameters: ["pointer"],           // duckdb_value
    result: "bool",                    // bool
  },

  /**
   * Retrieves the int8_t value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing an int8_t.
   * @return The int8_t value, or MinValue<int8> if it cannot be converted.
   */
  duckdb_get_int8: {
    parameters: ["pointer"],           // duckdb_value
    result: "i8",                      // int8_t
  },

  /**
   * Retrieves the uint8_t value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a uint8_t.
   * @return The uint8_t value, or MinValue<uint8> if it cannot be converted.
   */
  duckdb_get_uint8: {
    parameters: ["pointer"],           // duckdb_value
    result: "u8",                      // uint8_t
  },

  /**
   * Retrieves the int16_t value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing an int16_t.
   * @return The int16_t value, or MinValue<int16> if it cannot be converted.
   */
  duckdb_get_int16: {
    parameters: ["pointer"],           // duckdb_value
    result: "i16",                     // int16_t
  },

  /**
   * Retrieves the uint16_t value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a uint16_t.
   * @return The uint16_t value, or MinValue<uint16> if it cannot be converted.
   */
  duckdb_get_uint16: {
    parameters: ["pointer"],           // duckdb_value
    result: "u16",                     // uint16_t
  },

  /**
   * Retrieves the int32_t value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing an int32_t.
   * @return The int32_t value, or MinValue<int32> if it cannot be converted.
   */
  duckdb_get_int32: {
    parameters: ["pointer"],           // duckdb_value
    result: "i32",                     // int32_t
  },

  /**
   * Retrieves the uint32_t value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a uint32_t.
   * @return The uint32_t value, or MinValue<uint32> if it cannot be converted.
   */
  duckdb_get_uint32: {
    parameters: ["pointer"],           // duckdb_value
    result: "u32",                     // uint32_t
  },

  /**
   * Retrieves the int64_t value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing an int64_t.
   * @return The int64_t value, or MinValue<int64> if it cannot be converted.
   */
  duckdb_get_int64: {
    parameters: ["pointer"],           // duckdb_value
    result: "i64",                     // int64_t
  },

  /**
   * Retrieves the uint64_t value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a uint64_t.
   * @return The uint64_t value, or MinValue<uint64> if it cannot be converted.
   */
  duckdb_get_uint64: {
    parameters: ["pointer"],           // duckdb_value
    result: "u64",                     // uint64_t
  },

  /**
   * Retrieves the float value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a float.
   * @return The float value, or NaN if it cannot be converted.
   */
  duckdb_get_float: {
    parameters: ["pointer"],           // duckdb_value
    result: "f32",                     // float
  },

  /**
   * Retrieves the double value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a double.
   * @return The double value, or NaN if it cannot be converted.
   */
  duckdb_get_double: {
    parameters: ["pointer"],           // duckdb_value
    result: "f64",                     // double
  },

  /**
   * Retrieves the hugeint value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a hugeint.
   * @return A `duckdb_hugeint` value, or MinValue<hugeint> if it cannot be converted.
   */
  duckdb_get_hugeint: {
    parameters: ["pointer"],           // duckdb_value
    result: "buffer",                  // duckdb_hugeint
  },

  /**
   * Retrieves the uhugeint value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a uhugeint.
   * @return A `duckdb_uhugeint` value, or MinValue<uhugeint> if it cannot be converted.
   */
  duckdb_get_uhugeint: {
    parameters: ["pointer"],           // duckdb_value
    result: "buffer",                  // duckdb_uhugeint
  },

  /**
   * Retrieves the date value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a date.
   * @return A `duckdb_date` value, or MinValue<date> if it cannot be converted.
   */
  duckdb_get_date: {
    parameters: ["pointer"],           // duckdb_value
    result: "buffer",                  // duckdb_date
  },

  /**
   * Retrieves the time value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a time.
   * @return A `duckdb_time` value, or MinValue<time> if it cannot be converted.
   */
  duckdb_get_time: {
    parameters: ["pointer"],           // duckdb_value
    result: "buffer",                  // duckdb_time
  },

  /**
   * Retrieves the timestamp value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing a timestamp.
   * @return A `duckdb_timestamp` value, or MinValue<timestamp> if it cannot be converted.
   */
  duckdb_get_timestamp: {
    parameters: ["pointer"],           // duckdb_value
    result: "buffer",                  // duckdb_timestamp
  },

  /**
   * Retrieves the interval value from a `duckdb_value`.
   * 
   * @param val A pointer to the `duckdb_value` containing an interval.
   * @return A `duckdb_interval` value, or MinValue<interval> if it cannot be converted.
   */
  duckdb_get_interval: {
    parameters: ["pointer"],           // duckdb_value
    result: "buffer",                  // duckdb_interval
  },

  /**
   * Retrieves the string representation of a value.
   * 
   * @param value A pointer to the `duckdb_value` to retrieve the string from.
   * @return A pointer to the string representation of the value. Must be destroyed with `duckdb_free`.
   */
  duckdb_get_varchar: {
    parameters: ["pointer"],           // duckdb_value
    result: "pointer",                 // char* (string pointer)
  },

  /**
   * Creates a struct value from a type and an array of values.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the struct type.
   * @param values A pointer to an array of `duckdb_value` representing the struct fields.
   * @return A pointer to the struct `duckdb_value`. Must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_struct_value: {
    parameters: [duckdb_logical_type, "pointer"],  // duckdb_logical_type, duckdb_value*
    result: "pointer",                   // duckdb_value
  },

  /**
   * Creates a list value from a type and an array of values.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the list type.
   * @param values A pointer to an array of `duckdb_value` representing the list elements.
   * @param value_count The number of elements in the list.
   * @return A pointer to the list `duckdb_value`. Must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_list_value: {
    parameters: [duckdb_logical_type, "pointer", "u64"], // duckdb_logical_type, duckdb_value*, idx_t (uint64_t)
    result: "pointer",                         // duckdb_value
  },

  /**
   * Creates an array value from a type and an array of values.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the array type.
   * @param values A pointer to an array of `duckdb_value` representing the array elements.
   * @param value_count The number of elements in the array.
   * @return A pointer to the array `duckdb_value`. Must be destroyed with `duckdb_destroy_value`.
   */
  duckdb_create_array_value: {
    parameters: [duckdb_logical_type, "pointer", "u64"], // duckdb_logical_type, duckdb_value*, idx_t (uint64_t)
    result: "pointer",                         // duckdb_value
  },

  /**
   * Retrieves the logical type of a value.
   * 
   * @param val A pointer to the `duckdb_value`.
   * @return A pointer to the `duckdb_logical_type` representing the type of the value.
   */
  duckdb_get_value_type: {
    parameters: ["pointer"],           // duckdb_value
    result: duckdb_logical_type,                 // duckdb_logical_type
  },

  /**
   * Retrieves the size of a MAP value.
   * 
   * @param value A pointer to the MAP value.
   * @return The number of elements in the MAP.
   */
  duckdb_get_map_size: {
    parameters: ["pointer"],           // duckdb_value
    result: "u64",                     // idx_t (uint64_t)
  },

  /**
   * Retrieves the key from a MAP value at a specified index.
   * 
   * @param value A pointer to the MAP value.
   * @param index The index of the key to retrieve.
   * @return A pointer to the `duckdb_value` containing the key.
   */
  duckdb_get_map_key: {
    parameters: ["pointer", "u64"],    // duckdb_value, idx_t (uint64_t)
    result: "pointer",                 // duckdb_value
  },

  /**
   * Retrieves the value from a MAP value at a specified index.
   * 
   * @param value A pointer to the MAP value.
   * @param index The index of the value to retrieve.
   * @return A pointer to the `duckdb_value` containing the value.
   */
  duckdb_get_map_value: {
    parameters: ["pointer", "u64"],    // duckdb_value, idx_t (uint64_t)
    result: "pointer",                 // duckdb_value
  },
} as const satisfies Deno.ForeignLibraryInterface;
