//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/interfaces/data_chunk.ts
// Data Chunk Interface - FFI functions for managing data chunks in DuckDB
//===--------------------------------------------------------------------===//

export default {
  /**
   * Creates an empty data chunk with the specified column types.
   * 
   * This function allocates a new data chunk based on the provided logical column types. The chunk can
   * be used to store data for a set of columns.
   * 
   * @param types A pointer to an array of `duckdb_logical_type` representing the column types.
   *              The types must not include `DUCKDB_TYPE_ANY` or `DUCKDB_TYPE_INVALID`.
   * @param column_count The number of columns in the data chunk (`idx_t`).
   * @return A pointer to the created `duckdb_data_chunk`. The chunk must be destroyed using `duckdb_destroy_data_chunk`.
   */
  duckdb_create_data_chunk: {
    parameters: ["pointer", "u64"] as const,    // duckdb_logical_type*, idx_t (column count)
    result: "pointer" as const,                 // duckdb_data_chunk
  },

  /**
   * Destroys a data chunk and frees all associated memory.
   * 
   * After a data chunk is no longer needed, this function must be called to free the allocated memory.
   * 
   * @param chunk A pointer to the `duckdb_data_chunk` to destroy.
   * @return void
   */
  duckdb_destroy_data_chunk: {
    parameters: ["pointer"] as const,           // duckdb_data_chunk*
    result: "void" as const,                    // void
  },

  /**
   * Resets a data chunk, clearing its validity masks and setting its size to 0.
   * 
   * After resetting, the chunk's data and validity must be reinitialized using `duckdb_vector_get_validity` and 
   * `duckdb_vector_get_data`.
   * 
   * @param chunk A pointer to the `duckdb_data_chunk` to reset.
   * @return void
   */
  duckdb_data_chunk_reset: {
    parameters: ["pointer"] as const,           // duckdb_data_chunk
    result: "void" as const,                    // void
  },

  /**
   * Retrieves the number of columns in a data chunk.
   * 
   * This function returns the total number of columns that are part of the data chunk.
   * 
   * @param chunk A pointer to the `duckdb_data_chunk` to query.
   * @return The number of columns in the data chunk (`idx_t`).
   */
  duckdb_data_chunk_get_column_count: {
    parameters: ["pointer"] as const,           // duckdb_data_chunk
    result: "u64" as const,                     // idx_t
  },

  /**
   * Retrieves the vector at the specified column index within a data chunk.
   * 
   * The returned vector remains valid as long as the chunk is alive and does not need to be destroyed separately.
   * 
   * @param chunk A pointer to the `duckdb_data_chunk` to query.
   * @param col_idx The index of the column to retrieve the vector for (`idx_t`).
   * @return A pointer to the `duckdb_vector` at the specified column index.
   */
  duckdb_data_chunk_get_vector: {
    parameters: ["pointer", "u64"] as const,    // duckdb_data_chunk, idx_t (column index)
    result: "pointer" as const,                 // duckdb_vector
  },

  /**
   * Retrieves the current number of tuples (rows) in a data chunk.
   * 
   * This function provides the current number of rows stored in the chunk.
   * 
   * @param chunk A pointer to the `duckdb_data_chunk` to query.
   * @return The number of tuples (rows) in the data chunk (`idx_t`).
   */
  duckdb_data_chunk_get_size: {
    parameters: ["pointer"] as const,           // duckdb_data_chunk
    result: "u64" as const,                     // idx_t
  },

  /**
   * Sets the current number of tuples (rows) in a data chunk.
   * 
   * This allows you to set the number of rows within the chunk.
   * 
   * @param chunk A pointer to the `duckdb_data_chunk` to modify.
   * @param size The new number of tuples (rows) in the data chunk (`idx_t`).
   * @return void
   */
  duckdb_data_chunk_set_size: {
    parameters: ["pointer", "u64"] as const,    // duckdb_data_chunk, idx_t (size)
    result: "void" as const,                    // void
  },
};
