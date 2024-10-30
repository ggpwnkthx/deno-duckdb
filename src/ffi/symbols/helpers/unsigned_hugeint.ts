//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/helpers/unsigned_hugeint.ts
// Unsigned Hugeint Helpers - FFI functions for handling unsigned huge integer conversions in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Converts a `duckdb_uhugeint` object (as obtained from a `DUCKDB_TYPE_UHUGEINT` column) into a `double`.
   * 
   * This function is useful for converting very large unsigned integers stored in DuckDB's
   * `uhugeint` format into a standard floating-point value (`double`).
   * 
   * @param val The `duckdb_uhugeint` value to convert.
   * @return The converted `double` value.
   */
  duckdb_uhugeint_to_double: {
    parameters: ["buffer"],    // duckdb_uhugeint
    result: "f64",             // double
  },

  /**
   * Converts a `double` value to a `duckdb_uhugeint` object.
   * 
   * If the conversion fails because the `double` value is too large to fit into a `duckdb_uhugeint`,
   * the resulting `duckdb_uhugeint` object will be set to 0.
   * 
   * @param val The `double` value to convert.
   * @return The converted `duckdb_uhugeint` object.
   */
  duckdb_double_to_uhugeint: {
    parameters: ["f64"],       // double
    result: "buffer",          // duckdb_uhugeint
  },
} as const satisfies Deno.ForeignLibraryInterface;
