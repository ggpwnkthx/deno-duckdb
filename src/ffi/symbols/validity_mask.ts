//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/validiity_mask.ts
// Validity Mask Functions
//===--------------------------------------------------------------------===//

export default {
  /**
   * Returns whether or not a row is valid (i.e., not NULL) in the given validity mask.
   *
   * @param validity A pointer to the uint64_t array representing the validity mask, as obtained from `duckdb_vector_get_validity`.
   * @param row The row index to check for validity.
   * @return A boolean indicating whether the row is valid (`true`) or NULL/invalid (`false`).
   */
  duckdb_validity_row_is_valid: {
    parameters: ["pointer", "u64"] as const,    // uint64_t* (validity mask), idx_t (row index)
    result: "bool" as const,                    // bool
  },

  /**
   * Sets the validity of a specific row in the validity mask to either valid or invalid.
   *
   * @param validity A pointer to the uint64_t array representing the validity mask, as obtained from `duckdb_vector_get_validity`.
   * @param row The row index to update the validity for.
   * @param valid A boolean indicating whether the row should be set as valid (`true`) or invalid (`false`).
   * @return void
   */
  duckdb_validity_set_row_validity: {
    parameters: ["pointer", "u64", "bool"] as const, // uint64_t* (validity mask), idx_t (row index), bool (valid or invalid)
    result: "void" as const,                         // void
  },

  /**
   * Sets a specific row in the validity mask to invalid (NULL).
   * 
   * Equivalent to calling `duckdb_validity_set_row_validity` with the `valid` parameter set to `false`.
   *
   * @param validity A pointer to the uint64_t array representing the validity mask.
   * @param row The row index to mark as invalid.
   * @return void
   */
  duckdb_validity_set_row_invalid: {
    parameters: ["pointer", "u64"] as const,    // uint64_t* (validity mask), idx_t (row index)
    result: "void" as const,                    // void
  },

  /**
   * Sets a specific row in the validity mask to valid (not NULL).
   * 
   * Equivalent to calling `duckdb_validity_set_row_validity` with the `valid` parameter set to `true`.
   *
   * @param validity A pointer to the uint64_t array representing the validity mask.
   * @param row The row index to mark as valid.
   * @return void
   */
  duckdb_validity_set_row_valid: {
    parameters: ["pointer", "u64"] as const,    // uint64_t* (validity mask), idx_t (row index)
    result: "void" as const,                    // void
  },
};
