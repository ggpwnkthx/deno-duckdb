//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/helpers/hugeint.ts
// Hugeint Helpers - FFI functions for handling huge integer conversions in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Converts a `duckdb_hugeint` object (as obtained from a `DUCKDB_TYPE_HUGEINT` column) into a `double`.
   * 
   * This function is useful for converting very large integers that are stored in DuckDB's internal
   * `hugeint` format into a standard floating-point value (`double`) for further calculations.
   * 
   * @param val The `duckdb_hugeint` value to convert.
   * @return The converted `double` value.
   */
  duckdb_hugeint_to_double: {
    parameters: ["buffer"] as const,    // duckdb_hugeint
    result: "f64" as const,             // double
  },

  /**
   * Converts a `double` value to a `duckdb_hugeint` object.
   * 
   * If the conversion fails because the `double` value is too large to fit into a `duckdb_hugeint`,
   * the resulting `duckdb_hugeint` object will be set to 0.
   * 
   * @param val The `double` value to convert.
   * @return The converted `duckdb_hugeint` object.
   */
  duckdb_double_to_hugeint: {
    parameters: ["f64"] as const,       // double
    result: "buffer" as const,          // duckdb_hugeint
  },
};
