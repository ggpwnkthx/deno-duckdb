//===--------------------------------------------------------------------===//
// File: src/ffi/symbols/interfaces/index.ts
// Interface Aggregation - FFI interfaces for handling various DuckDB objects
//===--------------------------------------------------------------------===//

import data_chunk from "./data_chunk.ts";
import logical_type from "./logical_type.ts";
import streaming_result from "./streaming_result.ts";
import vector from "./vector.ts";

export default {
  // Aggregates the FFI bindings from different DuckDB interface modules.
  // This export merges functionalities related to logical types, data chunks,
  // vectors, and streaming results, providing a unified interface.
  ...logical_type,
  ...data_chunk,
  ...vector,
  ...streaming_result,
} as const satisfies Deno.ForeignLibraryInterface;
