//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/validity_mask.ts
// Validity Mask Functions
//===--------------------------------------------------------------------===//

export default {
  /**
   * Checks if a specific row in the validity mask is valid (not NULL).
   *
   * @param validity - Pointer to the `uint64_t` array representing the validity mask.
   * @param row - Index of the row to check.
   * @returns `boolean`: `true` if the row is valid, `false` if NULL/invalid.
   */
  duckdb_validity_row_is_valid: {
    parameters: ["pointer", "u64"],
    result: "bool",
  },

  /**
   * Sets the validity status of a specific row in the validity mask.
   *
   * @param validity - Pointer to the `uint64_t` array representing the validity mask.
   * @param row - Index of the row to update.
   * @param valid - `true` to mark the row as valid, `false` to mark it as invalid.
   * @returns Void.
   */
  duckdb_validity_set_row_validity: {
    parameters: ["pointer", "u64", "bool"],
    result: "void",
  },

  /**
   * Marks a specific row in the validity mask as invalid (NULL).
   *
   * @param validity - Pointer to the `uint64_t` array representing the validity mask.
   * @param row - Index of the row to mark as invalid.
   * @returns Void.
   */
  duckdb_validity_set_row_invalid: {
    parameters: ["pointer", "u64"],
    result: "void",
  },

  /**
   * Marks a specific row in the validity mask as valid (not NULL).
   *
   * @param validity - Pointer to the `uint64_t` array representing the validity mask.
   * @param row - Index of the row to mark as valid.
   * @returns Void.
   */
  duckdb_validity_set_row_valid: {
    parameters: ["pointer", "u64"],
    result: "void",
  },
} as const satisfies Deno.ForeignLibraryInterface;
