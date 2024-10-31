//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/result.ts
// Result Functions - FFI functions for working with query results in DuckDB
//===--------------------------------------------------------------------===//

import { duckdb_result } from "../structs.ts";

export default {
  /**
   * Retrieves the type of data contained in the result, indicating if it represents query rows, a row count, or is invalid.
   *
   * @param result - The result buffer (`duckdb_result`).
   * @returns `duckdb_result_type` as an unsigned 32-bit integer.
   */
  duckdb_result_return_type: {
    parameters: [duckdb_result],
    result: "u32",
  },
} as const satisfies Deno.ForeignLibraryInterface;
