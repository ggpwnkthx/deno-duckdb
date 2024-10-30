//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/helpers/date_time_timestamp.ts
// Date Time Timestamp Helpers - FFI functions for handling date, time, and timestamp operations in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Decomposes a `duckdb_date` object into its constituent year, month, and day components.
   * 
   * This function is useful when working with `DUCKDB_TYPE_DATE` columns.
   * 
   * @param date The date object, as obtained from a `DUCKDB_TYPE_DATE` column.
   * @return The `duckdb_date_struct` with the decomposed year, month, and day.
   */
  duckdb_from_date: {
    parameters: ["buffer"],    // duckdb_date
    result: "buffer",          // duckdb_date_struct
  },

  /**
   * Re-composes a `duckdb_date` from its year, month, and day components.
   * 
   * This function takes a `duckdb_date_struct` and creates a `duckdb_date` object.
   * 
   * @param date The `duckdb_date_struct` containing the year, month, and day.
   * @return The `duckdb_date` element.
   */
  duckdb_to_date: {
    parameters: ["buffer"],    // duckdb_date_struct
    result: "buffer",          // duckdb_date
  },

  /**
   * Checks if a `duckdb_date` is finite, meaning it is not equal to positive or negative infinity.
   * 
   * @param date The date object, as obtained from a `DUCKDB_TYPE_DATE` column.
   * @return `true` if the date is finite, `false` if it is ±infinity.
   */
  duckdb_is_finite_date: {
    parameters: ["buffer"],    // duckdb_date
    result: "bool",            // bool
  },

  /**
   * Decomposes a `duckdb_time` object into its hour, minute, second, and microsecond components.
   * 
   * This function is useful for extracting time information from a `DUCKDB_TYPE_TIME` column.
   * 
   * @param time The time object, as obtained from a `DUCKDB_TYPE_TIME` column.
   * @return The `duckdb_time_struct` with the decomposed time components.
   */
  duckdb_from_time: {
    parameters: ["buffer"],    // duckdb_time
    result: "buffer",          // duckdb_time_struct
  },

  /**
   * Creates a `duckdb_time_tz` object from the provided microseconds and timezone offset.
   * 
   * This function is useful when working with `DUCKDB_TYPE_TIME_TZ` columns.
   * 
   * @param micros The microsecond component of the time.
   * @param offset The timezone offset in seconds.
   * @return The `duckdb_time_tz` element.
   */
  duckdb_create_time_tz: {
    parameters: ["i64", "i32"],    // int64_t (micros), int32_t (offset)
    result: "buffer",              // duckdb_time_tz
  },

  /**
   * Decomposes a `duckdb_time_tz` object into its microseconds and timezone offset components.
   * 
   * This function allows access to the underlying components of a time with timezone object.
   * 
   * @param time The time object, as obtained from a `DUCKDB_TYPE_TIME_TZ` column.
   * @return The `duckdb_time_tz_struct` with the decomposed elements.
   */
  duckdb_from_time_tz: {
    parameters: ["buffer"],    // duckdb_time_tz
    result: "buffer",          // duckdb_time_tz_struct
  },

  /**
   * Re-composes a `duckdb_time` from hour, minute, second, and microsecond components.
   * 
   * This function takes a `duckdb_time_struct` and creates a `duckdb_time` object.
   * 
   * @param time The `duckdb_time_struct` containing hour, minute, second, and microsecond.
   * @return The `duckdb_time` element.
   */
  duckdb_to_time: {
    parameters: ["buffer"],    // duckdb_time_struct
    result: "buffer",          // duckdb_time
  },

  /**
   * Decomposes a `duckdb_timestamp` object into a `duckdb_timestamp_struct` containing its individual components.
   * 
   * This function is useful for working with timestamps in `DUCKDB_TYPE_TIMESTAMP` columns.
   * 
   * @param ts The timestamp object, as obtained from a `DUCKDB_TYPE_TIMESTAMP` column.
   * @return The `duckdb_timestamp_struct` with the decomposed elements.
   */
  duckdb_from_timestamp: {
    parameters: ["buffer"],    // duckdb_timestamp
    result: "buffer",          // duckdb_timestamp_struct
  },

  /**
   * Re-composes a `duckdb_timestamp` from its decomposed components in a `duckdb_timestamp_struct`.
   * 
   * @param ts The decomposed elements in a `duckdb_timestamp_struct`.
   * @return The `duckdb_timestamp` element.
   */
  duckdb_to_timestamp: {
    parameters: ["buffer"],    // duckdb_timestamp_struct
    result: "buffer",          // duckdb_timestamp
  },

  /**
   * Checks if a `duckdb_timestamp` is finite, meaning it is not equal to positive or negative infinity.
   * 
   * @param ts The timestamp object, as obtained from a `DUCKDB_TYPE_TIMESTAMP` column.
   * @return `true` if the timestamp is finite, `false` if it is ±infinity.
   */
  duckdb_is_finite_timestamp: {
    parameters: ["buffer"],    // duckdb_timestamp
    result: "bool",            // bool
  },
} as const satisfies Deno.ForeignLibraryInterface;
