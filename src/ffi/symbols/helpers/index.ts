//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/helpers/index.ts
// Helpers - FFI functions for memory management and utility operations in DuckDB
//===--------------------------------------------------------------------===//

import date_time_timestamp from "./date_time_timestamp.ts";
import decimal from "./decimal.ts";
import hugeint from "./hugeint.ts";
import unsigned_hugeint from "./unsigned_hugeint.ts";

export default {
  /**
   * Allocates `size` bytes of memory using DuckDB's internal malloc function.
   * 
   * Any memory allocated through this function should be freed using `duckdb_free`
   * to ensure proper memory management.
   * 
   * @param size The number of bytes to allocate (`size_t`).
   * @return A pointer to the allocated memory region (`void*`).
   */
  duckdb_malloc: {
    parameters: ["usize"],     // size_t
    result: "pointer",         // void* (pointer to the allocated memory)
  },

  /**
   * Frees a memory region that was previously allocated using `duckdb_malloc`,
   * or memory from functions such as `duckdb_value_varchar`, `duckdb_value_blob`, 
   * or `duckdb_value_string`.
   * 
   * @param ptr Pointer to the memory region to be freed (`void*`).
   * @return void
   */
  duckdb_free: {
    parameters: ["pointer"],   // void*
    result: "void",            // void
  },

  /**
   * Returns the internal vector size used by DuckDB. This is the number of tuples 
   * that can fit into a data chunk created by `duckdb_create_data_chunk`.
   * 
   * This information is useful when working with large datasets or managing performance.
   * 
   * @return The vector size (`idx_t`).
   */
  duckdb_vector_size: {
    parameters: [],            // No parameters
    result: "u64",             // idx_t (uint64_t)
  },

  /**
   * Checks if the `duckdb_string_t` value is inlined. Inlined strings do not require
   * separate memory allocation as the string data is stored directly within the structure.
   * 
   * This function helps optimize memory usage when working with smaller strings.
   * 
   * @param string The `duckdb_string_t` structure to check.
   * @return `true` if the string is inlined, `false` otherwise.
   */
  duckdb_string_is_inlined: {
    parameters: ["buffer"],    // duckdb_string_t
    result: "bool",            // bool
  },

  /**
   * Retrieves the length of a `duckdb_string_t` structure.
   * 
   * The length represents the number of characters in the string.
   * 
   * @param string The `duckdb_string_t` structure.
   * @return The length of the string (`uint32_t`).
   */
  duckdb_string_t_length: {
    parameters: ["buffer"],    // duckdb_string_t (struct)
    result: "u32",             // uint32_t
  },

  /**
   * Retrieves a pointer to the data of a `duckdb_string_t` structure.
   * 
   * This pointer refers to the actual string data and can be used to access
   * the content of the string.
   * 
   * @param string Pointer to the `duckdb_string_t` structure.
   * @return A pointer to the string data (`const char*`).
   */
  duckdb_string_t_data: {
    parameters: ["pointer"],   // duckdb_string_t*
    result: "pointer",         // const char* (pointer to string data)
  },

  // Include additional helper functions from imported modules
  ...date_time_timestamp,
  ...hugeint,
  ...unsigned_hugeint,
  ...decimal,
} as const satisfies Deno.ForeignLibraryInterface;
