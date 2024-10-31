//===--------------------------------------------------------------------===//
// File: src/ffi/structs.ts
// Structs - 
//===--------------------------------------------------------------------===//

// Define internal pointer types
const duckdb_internal_pointer = { struct: ["pointer"] as const };

// Database objects as internal pointers
export const duckdb_database = duckdb_internal_pointer;
export const duckdb_connection = duckdb_internal_pointer;
export const duckdb_data_chunk = duckdb_internal_pointer;
export const duckdb_vector = duckdb_internal_pointer;
export const duckdb_logical_type = duckdb_internal_pointer;

// Result struct for query results in DuckDB
export const duckdb_result = {
  struct: [
    "u64",    // row count
    "u64",    // column count
    "u64",    // total size
    "pointer", // column data pointers
    "pointer", // column name pointers
    "pointer", // error message pointer
  ] as const,
};

// Query progress struct in DuckDB
export const duckdb_query_progress_type = {
  struct: [
    "f64",    // progress percentage
    "u64",    // estimated total rows
    "u64"     // current rows processed
  ] as const,
};