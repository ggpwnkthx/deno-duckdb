//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/interfaces/streaming_result.ts
// Streaming Result Interface - FFI functions for fetching result data chunks from DuckDB
//===--------------------------------------------------------------------===//

import { duckdb_data_chunk, duckdb_result } from "../../structs.ts";

export default {
  /**
   * Fetches a data chunk from the specified DuckDB result object.
   * 
   * This function retrieves chunks of data from a result set, which is useful when processing large datasets in
   * smaller, more manageable chunks. The function should be called repeatedly until all data chunks have been fetched.
   * The number of chunks is not known in advance, so fetching continues until no more chunks are returned.
   * 
   * The returned data chunk must be destroyed using `duckdb_destroy_data_chunk` after it is no longer needed
   * to free associated memory.
   * 
   * @param result Address to the DuckDB result object (`duckdb_result`), from which to fetch the data chunk.
   * @return A pointer to the fetched data chunk (`duckdb_data_chunk`). If an error occurs during fetching, returns `NULL`.
   */
  duckdb_fetch_chunk: {
    parameters: [duckdb_result],           // duckdb_result (result address)
    result: duckdb_data_chunk,                 // duckdb_data_chunk (fetched data chunk)
  },
} as const satisfies Deno.ForeignLibraryInterface;
