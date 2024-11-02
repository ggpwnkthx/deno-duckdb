//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/logical_types.ts
// Logical Type Interface - FFI functions for managing logical types in DuckDB
//===--------------------------------------------------------------------===//

import { duckdb_connection, duckdb_logical_type } from "../../structs.ts";

export default {
  /**
   * Retrieves the type ID of a logical type.
   * 
   * @param type The `duckdb_logical_type` buffer.
   * @return The `duckdb_type` of the logical type.
   */
  duckdb_get_type_id: {
    parameters: [duckdb_logical_type],           // duckdb_logical_type
    result: "i32",                     // duckdb_type (int32_t)
  },
  
  /**
   * Destroys a logical type and frees its allocated memory.
   * 
   * @param type A pointer to the logical type to destroy.
   * @return void
   */
  duckdb_destroy_logical_type: {
    parameters: ["pointer"],           // duckdb_logical_type*
    result: "void",                    // void
  },

  /**
   * Registers a custom logical type within a given connection.
   * 
   * @param con A pointer to the `duckdb_connection` where the type will be registered.
   * @param type A pointer to the `duckdb_logical_type` to register.
   * @param info A pointer to the `duckdb_create_type_info` structure containing the type information.
   * @return `DuckDBSuccess` on success, or `DuckDBError` on failure.
   */
  duckdb_register_logical_type: {
    parameters: [duckdb_connection, duckdb_logical_type, "pointer"],
    result: "i32",
  },
  
  /**
   * Retrieves the width of a decimal type.
   * 
   * @param type A pointer to the `duckdb_logical_type` to register.
   * @return  The width of the decimal type.
   */
  duckdb_decimal_width: {
    parameters: [duckdb_logical_type],
    result: "u8"
  },
  /**
   * Retrieves the scale of a decimal type.
   * 
   * @param type A pointer to the `duckdb_logical_type` to register.
   * @return The scale of the decimal type.
   */
  duckdb_decimal_scale: {
    parameters: [duckdb_logical_type],
    result: "u8"
  },
  /**
   * Retrieves the internal storage type of a decimal type.
   * 
   * @param type A pointer to the `duckdb_logical_type` to register.
   * @return The internal type of the decimal type.
   */
  duckdb_decimal_internal_type: {
    parameters: [duckdb_logical_type],
    result: "i32"
  }


} as const satisfies Deno.ForeignLibraryInterface;
