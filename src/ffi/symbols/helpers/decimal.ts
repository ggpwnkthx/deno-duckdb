//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/helpers/decimal.ts
// Decimal Helpers - FFI functions for handling decimal conversions in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Converts a `double` value to a `duckdb_decimal` object.
   * 
   * If the conversion fails due to the `double` value being too large or the width/scale
   * being invalid, the resulting `duckdb_decimal` object will be set to 0.
   * 
   * @param val The `double` value to convert.
   * @param width The width of the decimal (total number of digits, including the fractional part).
   * @param scale The scale (number of digits after the decimal point) of the decimal.
   * @return The converted `duckdb_decimal` object.
   */
  duckdb_double_to_decimal: {
    parameters: ["f64", "u8", "u8"] as const,   // double (val), uint8_t (width), uint8_t (scale)
    result: "buffer" as const,                 // duckdb_decimal
  },

  /**
   * Converts a `duckdb_decimal` object (as obtained from a `DUCKDB_TYPE_DECIMAL` column) into a `double`.
   * 
   * This function is useful for converting DuckDB's internal decimal representation into a standard
   * floating-point value for further processing.
   * 
   * @param val The `duckdb_decimal` value to convert.
   * @return The converted `double` value.
   */
  duckdb_decimal_to_double: {
    parameters: ["buffer"] as const,           // duckdb_decimal
    result: "f64" as const,                    // double
  },
};
