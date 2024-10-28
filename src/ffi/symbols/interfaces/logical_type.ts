//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/logical_types.ts
// Logical Type Interface - FFI functions for managing logical types in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Creates a logical type from a primitive type.
   * 
   * @param type The primitive `duckdb_type` to create (e.g., `DUCKDB_TYPE_INTEGER`).
   * @return A pointer to the created `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_create_logical_type: {
    parameters: ["i32"] as const,              // duckdb_type (primitive type)
    result: "pointer" as const,                // duckdb_logical_type
  },

  /**
   * Retrieves the alias of a logical type.
   * 
   * @param type A pointer to the `duckdb_logical_type`.
   * @return A pointer to the alias string if set, otherwise `nullptr`. Must be destroyed with `duckdb_free`.
   */
  duckdb_logical_type_get_alias: {
    parameters: ["pointer"] as const,          // duckdb_logical_type
    result: "pointer" as const,                // char* (string pointer)
  },

  /**
   * Sets the alias of a logical type.
   * 
   * @param type A pointer to the `duckdb_logical_type`.
   * @param alias A pointer to the alias string to set.
   * @return void
   */
  duckdb_logical_type_set_alias: {
    parameters: ["pointer", "pointer"] as const, // duckdb_logical_type, const char* (alias)
    result: "void" as const,                    // void
  },

  /**
   * Creates a LIST type from its child type.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the child type.
   * @return A pointer to the created `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_create_list_type: {
    parameters: ["pointer"] as const,           // duckdb_logical_type (child type)
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Creates an ARRAY type from its child type and size.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the child type.
   * @param array_size The number of elements in the array.
   * @return A pointer to the created `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_create_array_type: {
    parameters: ["pointer", "u64"] as const,    // duckdb_logical_type, idx_t (uint64_t)
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Creates a MAP type from its key type and value type.
   * 
   * @param key_type A pointer to the `duckdb_logical_type` representing the key type.
   * @param value_type A pointer to the `duckdb_logical_type` representing the value type.
   * @return A pointer to the created `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_create_map_type: {
    parameters: ["buffer", "buffer"] as const,  // duckdb_logical_type (key type), duckdb_logical_type (value type)
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Creates a UNION type from an array of member types and names.
   * 
   * @param member_types A pointer to an array of `duckdb_logical_type` representing the union members.
   * @param member_names A pointer to an array of strings representing the names of the union members.
   * @param member_count The number of union members.
   * @return A pointer to the created `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_create_union_type: {
    parameters: ["pointer", "pointer", "u64"] as const, // duckdb_logical_type*, const char**, idx_t (uint64_t)
    result: "pointer" as const,                         // duckdb_logical_type
  },

  /**
   * Creates a STRUCT type from an array of member types and names.
   * 
   * @param member_types A pointer to an array of `duckdb_logical_type` representing the struct members.
   * @param member_names A pointer to an array of strings representing the names of the struct members.
   * @param member_count The number of struct members.
   * @return A pointer to the created `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_create_struct_type: {
    parameters: ["pointer", "pointer", "u64"] as const, // duckdb_logical_type*, const char**, idx_t (uint64_t)
    result: "pointer" as const,                         // duckdb_logical_type
  },

  /**
   * Creates an ENUM type from an array of member names.
   * 
   * @param member_names A pointer to an array of strings representing the names of the enum members.
   * @param member_count The number of enum members.
   * @return A pointer to the created `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_create_enum_type: {
    parameters: ["pointer", "u64"] as const,    // const char** (member names), idx_t (uint64_t)
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Creates a DECIMAL type with the specified width and scale.
   * 
   * @param width The width of the decimal type.
   * @param scale The scale of the decimal type.
   * @return A pointer to the created `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_create_decimal_type: {
    parameters: ["u8", "u8"] as const,          // uint8_t (width), uint8_t (scale)
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Retrieves the type ID of a logical type.
   * 
   * @param type A pointer to the `duckdb_logical_type`.
   * @return The `duckdb_type` of the logical type.
   */
  duckdb_get_type_id: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "i32" as const,                     // duckdb_type (int32_t)
  },

  /**
   * Retrieves the width of a DECIMAL type.
   * 
   * @param type A pointer to the `duckdb_logical_type`.
   * @return The width of the DECIMAL type.
   */
  duckdb_decimal_width: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "u8" as const,                      // uint8_t
  },

  /**
   * Retrieves the scale of a DECIMAL type.
   * 
   * @param type A pointer to the `duckdb_logical_type`.
   * @return The scale of the DECIMAL type.
   */
  duckdb_decimal_scale: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "u8" as const,                      // uint8_t
  },

  /**
   * Retrieves the internal storage type of a DECIMAL type.
   * 
   * @param type A pointer to the `duckdb_logical_type`.
   * @return The `duckdb_type` representing the internal storage type of the DECIMAL type.
   */
  duckdb_decimal_internal_type: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "i32" as const,                     // duckdb_type (int32_t)
  },

  /**
   * Retrieves the internal storage type of an ENUM type.
   * 
   * @param type A pointer to the `duckdb_logical_type`.
   * @return The `duckdb_type` representing the internal storage type of the ENUM type.
   */
  duckdb_enum_internal_type: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "i32" as const,                     // duckdb_type (int32_t)
  },

  /**
   * Retrieves the dictionary size of the ENUM type.
   * 
   * @param type A pointer to the `duckdb_logical_type`.
   * @return The size of the ENUM dictionary.
   */
  duckdb_enum_dictionary_size: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "u32" as const,                     // uint32_t
  },

  /**
   * Retrieves the dictionary value of the ENUM type at the specified index.
   * 
   * @param type A pointer to the `duckdb_logical_type`.
   * @param index The index of the ENUM dictionary to retrieve.
   * @return A pointer to the string value. Must be destroyed with `duckdb_free`.
   */
  duckdb_enum_dictionary_value: {
    parameters: ["pointer", "u64"] as const,    // duckdb_logical_type, idx_t (uint64_t)
    result: "pointer" as const,                 // char* (string pointer)
  },

  /**
   * Retrieves the child type of a LIST or MAP type.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the LIST or MAP type.
   * @return A pointer to the child `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_list_type_child_type: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Retrieves the child type of an ARRAY type.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the ARRAY type.
   * @return A pointer to the child `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_array_type_child_type: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Retrieves the array size of an ARRAY type.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the ARRAY type.
   * @return The number of elements in the ARRAY type.
   */
  duckdb_array_type_array_size: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "u64" as const,                     // idx_t (uint64_t)
  },

  /**
   * Retrieves the key type of a MAP type.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the MAP type.
   * @return A pointer to the key `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_map_type_key_type: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Retrieves the value type of a MAP type.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the MAP type.
   * @return A pointer to the value `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_map_type_value_type: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Retrieves the number of children of a STRUCT type.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the STRUCT type.
   * @return The number of children in the STRUCT type.
   */
  duckdb_struct_type_child_count: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "u64" as const,                     // idx_t (uint64_t)
  },

  /**
   * Retrieves the name of a child in a STRUCT type at a specific index.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the STRUCT type.
   * @param index The index of the child.
   * @return A pointer to the child name string. Must be destroyed with `duckdb_free`.
   */
  duckdb_struct_type_child_name: {
    parameters: ["pointer", "u64"] as const,    // duckdb_logical_type, idx_t (uint64_t)
    result: "pointer" as const,                 // char* (string pointer)
  },

  /**
   * Retrieves the child type of a STRUCT type at a specific index.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the STRUCT type.
   * @param index The index of the child.
   * @return A pointer to the child `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_struct_type_child_type: {
    parameters: ["pointer", "u64"] as const,    // duckdb_logical_type, idx_t (uint64_t)
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Retrieves the number of members in a UNION type.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the UNION type.
   * @return The number of members in the UNION type.
   */
  duckdb_union_type_member_count: {
    parameters: ["pointer"] as const,           // duckdb_logical_type
    result: "u64" as const,                     // idx_t (uint64_t)
  },

  /**
   * Retrieves the name of a member in a UNION type at a specific index.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the UNION type.
   * @param index The index of the member.
   * @return A pointer to the member name string. Must be destroyed with `duckdb_free`.
   */
  duckdb_union_type_member_name: {
    parameters: ["pointer", "u64"] as const,    // duckdb_logical_type, idx_t (uint64_t)
    result: "pointer" as const,                 // char* (string pointer)
  },

  /**
   * Retrieves the type of a member in a UNION type at a specific index.
   * 
   * @param type A pointer to the `duckdb_logical_type` representing the UNION type.
   * @param index The index of the member.
   * @return A pointer to the member `duckdb_logical_type`. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_union_type_member_type: {
    parameters: ["pointer", "u64"] as const,    // duckdb_logical_type, idx_t (uint64_t)
    result: "pointer" as const,                 // duckdb_logical_type
  },

  /**
   * Destroys a logical type and frees its allocated memory.
   * 
   * @param type A pointer to the logical type to destroy.
   * @return void
   */
  duckdb_destroy_logical_type: {
    parameters: ["pointer"] as const,           // duckdb_logical_type*
    result: "void" as const,                    // void
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
    parameters: ["pointer", "pointer", "pointer"] as const, // duckdb_connection, duckdb_logical_type, duckdb_create_type_info
    result: "i32" as const,                                 // duckdb_state (int32_t)
  },
};
