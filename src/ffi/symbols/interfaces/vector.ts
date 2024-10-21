//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/interfaces/vector.ts
// Vector Interface
//===--------------------------------------------------------------------===//

export default {
  /**
   * Retrieves the logical type of the specified vector.
   *
   * @param vector A pointer to the `duckdb_vector`.
   * @return A pointer to the `duckdb_logical_type` of the vector. Must be destroyed with `duckdb_destroy_logical_type`.
   */
  duckdb_vector_get_column_type: {
    parameters: ["pointer"] as const,           // duckdb_vector
    result: "buffer" as const,                  // duckdb_logical_type
  },

  /**
   * Retrieves the data pointer of a vector for reading or writing values.
   *
   * @param vector A pointer to the `duckdb_vector`.
   * @return A pointer to the data of the vector. The data format depends on the vector's type.
   */
  duckdb_vector_get_data: {
    parameters: ["pointer"] as const,           // duckdb_vector
    result: "pointer" as const,                 // void* (data pointer)
  },

  /**
   * Retrieves the validity mask pointer of the specified vector.
   *
   * @param vector A pointer to the `duckdb_vector`.
   * @return A pointer to the validity mask, or `NULL` if no validity mask is present. The validity mask is a bitset.
   */
  duckdb_vector_get_validity: {
    parameters: ["pointer"] as const,           // duckdb_vector
    result: "pointer" as const,                 // uint64_t* (validity mask pointer)
  },

  /**
   * Ensures the validity mask is writable by allocating it if necessary.
   * After this function is called, the validity mask can be modified, allowing null values to be written.
   *
   * @param vector A pointer to the `duckdb_vector`.
   * @return void
   */
  duckdb_vector_ensure_validity_writable: {
    parameters: ["pointer"] as const,           // duckdb_vector
    result: "void" as const,                    // void
  },

  /**
   * Assigns a string element to a specific row in the vector.
   *
   * @param vector A pointer to the `duckdb_vector`.
   * @param index The row index where the string will be assigned.
   * @param str A pointer to the null-terminated string.
   * @return void
   */
  duckdb_vector_assign_string_element: {
    parameters: ["pointer", "u64", "pointer"] as const, // duckdb_vector, idx_t, const char* (string)
    result: "void" as const,                            // void
  },

  /**
   * Assigns a string or BLOB element to a specific row in the vector, specifying the length of the string.
   *
   * @param vector A pointer to the `duckdb_vector`.
   * @param index The row index where the string will be assigned.
   * @param str A pointer to the string or BLOB data.
   * @param str_len The length of the string or BLOB in bytes.
   * @return void
   */
  duckdb_vector_assign_string_element_len: {
    parameters: ["pointer", "u64", "pointer", "u64"] as const, // duckdb_vector, idx_t, const char* (string), idx_t (length)
    result: "void" as const,                                   // void
  },

  /**
   * Retrieves the child vector of a list vector.
   *
   * @param vector A pointer to the `duckdb_vector` representing a list.
   * @return A pointer to the child `duckdb_vector`. Valid as long as the parent vector is alive.
   */
  duckdb_list_vector_get_child: {
    parameters: ["pointer"] as const,           // duckdb_vector
    result: "pointer" as const,                 // duckdb_vector (child vector)
  },

  /**
   * Retrieves the size of the child vector in a list vector.
   *
   * @param vector A pointer to the `duckdb_vector` representing a list.
   * @return The number of elements in the child vector (list size).
   */
  duckdb_list_vector_get_size: {
    parameters: ["pointer"] as const,           // duckdb_vector
    result: "u64" as const,                     // idx_t (size of child vector)
  },

  /**
   * Sets the size of the child vector in a list vector.
   *
   * @param vector A pointer to the `duckdb_vector` representing a list.
   * @param size The new size for the child vector.
   * @return The `duckdb_state` (`DuckDBSuccess` or `DuckDBError`).
   */
  duckdb_list_vector_set_size: {
    parameters: ["pointer", "u64"] as const,    // duckdb_vector, idx_t (new size)
    result: "i32" as const,                     // duckdb_state (int32_t)
  },

  /**
   * Reserves capacity for the child vector in a list vector.
   *
   * @param vector A pointer to the `duckdb_vector` representing a list.
   * @param required_capacity The required capacity for the child vector.
   * @return The `duckdb_state` (`DuckDBSuccess` or `DuckDBError`).
   */
  duckdb_list_vector_reserve: {
    parameters: ["pointer", "u64"] as const,    // duckdb_vector, idx_t (required capacity)
    result: "i32" as const,                     // duckdb_state (int32_t)
  },

  /**
   * Retrieves a child vector from a struct vector at the specified index.
   *
   * @param vector A pointer to the `duckdb_vector` representing a struct.
   * @param index The index of the child vector to retrieve.
   * @return A pointer to the child `duckdb_vector`. Valid as long as the parent vector is alive.
   */
  duckdb_struct_vector_get_child: {
    parameters: ["pointer", "u64"] as const,    // duckdb_vector, idx_t (child index)
    result: "pointer" as const,                 // duckdb_vector (child vector)
  },

  /**
   * Retrieves the child vector of an array vector.
   *
   * The resulting vector has the size of the parent vector multiplied by the array size.
   *
   * @param vector A pointer to the `duckdb_vector` representing an array.
   * @return A pointer to the child `duckdb_vector`. Valid as long as the parent vector is alive.
   */
  duckdb_array_vector_get_child: {
    parameters: ["pointer"] as const,           // duckdb_vector
    result: "pointer" as const,                 // duckdb_vector (child vector)
  },
};