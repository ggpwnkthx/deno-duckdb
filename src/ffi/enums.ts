//===--------------------------------------------------------------------===//
// File: src/ffi/enums.ts
// Enums - 
//===--------------------------------------------------------------------===//
// WARNING: the numbers of these enums should not be changed, as changing 
// the numbers breaks ABI compatibility. Always add enums at the END of the enum.

/**
 * Enum representing DuckDB's internal types.
 * 
 * These types correspond to the DuckDB data types and are used when interacting with
 * the database through the Foreign Function Interface (FFI). Each enum value is associated 
 * with a specific C type or a JavaScript equivalent type, where applicable.
 * 
 * WARNING: The values of these enums should not be changed, as doing so breaks ABI compatibility.
 */
export enum duckdb_type {
  DUCKDB_TYPE_INVALID = 0,        // Invalid type
  DUCKDB_TYPE_BOOLEAN = 1,        // bool               | Boolean
  DUCKDB_TYPE_TINYINT = 2,        // int8_t             | Number
  DUCKDB_TYPE_SMALLINT = 3,       // int16_t            | Number
  DUCKDB_TYPE_INTEGER = 4,        // int32_t            | Number
  DUCKDB_TYPE_BIGINT = 5,         // int64_t            | BigInt
  DUCKDB_TYPE_UTINYINT = 6,       // uint8_t            | Number
  DUCKDB_TYPE_USMALLINT = 7,      // uint16_t           | Number
  DUCKDB_TYPE_UINTEGER = 8,       // uint32_t           | Number
  DUCKDB_TYPE_UBIGINT = 9,        // uint64_t           | BigInt
  DUCKDB_TYPE_FLOAT = 10,         // float              | Number
  DUCKDB_TYPE_DOUBLE = 11,        // double             | Number
  DUCKDB_TYPE_TIMESTAMP = 12,     // duckdb_timestamp, in microseconds
  DUCKDB_TYPE_DATE = 13,          // duckdb_date
  DUCKDB_TYPE_TIME = 14,          // duckdb_time
  DUCKDB_TYPE_INTERVAL = 15,      // duckdb_interval
  DUCKDB_TYPE_HUGEINT = 16,       // duckdb_hugeint
  DUCKDB_TYPE_UHUGEINT = 32,      // duckdb_uhugeint
  DUCKDB_TYPE_VARCHAR = 17,       // const char*        | String
  DUCKDB_TYPE_BLOB = 18,          // duckdb_blob
  DUCKDB_TYPE_DECIMAL = 19,       // decimal            | Number
  DUCKDB_TYPE_TIMESTAMP_S = 20,   // duckdb_timestamp, in seconds
  DUCKDB_TYPE_TIMESTAMP_MS = 21,  // duckdb_timestamp, in milliseconds
  DUCKDB_TYPE_TIMESTAMP_NS = 22,  // duckdb_timestamp, in nanoseconds
  DUCKDB_TYPE_ENUM = 23,          // enum type, only useful as logical type
  DUCKDB_TYPE_LIST = 24,          // list type, only useful as logical type
  DUCKDB_TYPE_STRUCT = 25,        // struct type, only useful as logical type
  DUCKDB_TYPE_MAP = 26,           // map type, only useful as logical type
  DUCKDB_TYPE_ARRAY = 33,         // duckdb_array, only useful as logical type
  DUCKDB_TYPE_UUID = 27,          // duckdb_hugeint
  DUCKDB_TYPE_UNION = 28,         // union type, only useful as logical type
  DUCKDB_TYPE_BIT = 29,           // duckdb_bit         | Boolean
  DUCKDB_TYPE_TIME_TZ = 30,       // duckdb_time_tz
  DUCKDB_TYPE_TIMESTAMP_TZ = 31,  // duckdb_timestamp
  DUCKDB_TYPE_ANY = 34,           // ANY type           | Any
  DUCKDB_TYPE_VARINT = 35,        // duckdb_varint      | Number
  DUCKDB_TYPE_SQLNULL = 36,       // SQLNULL type       | null
}

/**
 * Enum representing the returned state of different DuckDB functions.
 * 
 * The state of a DuckDB function can indicate either success or failure (error).
 */
export enum duckdb_state {
  DuckDBSuccess = 0,  // Operation was successful
  DuckDBError = 1,    // Operation resulted in an error
}

/**
 * Enum representing the pending state of a query result.
 * 
 * A query result in DuckDB may not always be immediately available. This enum indicates
 * whether the result is ready, pending, or if an error occurred.
 */
export enum duckdb_pending_state {
  DUCKDB_PENDING_RESULT_READY = 0,             // Query result is ready
  DUCKDB_PENDING_RESULT_NOT_READY = 1,         // Query result is not yet ready
  DUCKDB_PENDING_ERROR = 2,                    // An error occurred while fetching the result
  DUCKDB_PENDING_NO_TASKS_AVAILABLE = 3,       // No tasks are available for execution
}

/**
 * Enum representing DuckDB's different result types.
 * 
 * This enum helps distinguish between various types of results that can be returned
 * from DuckDB queries, such as affected rows or query results.
 */
export enum duckdb_result_type {
  DUCKDB_RESULT_TYPE_INVALID = 0,      // Invalid result type
  DUCKDB_RESULT_TYPE_CHANGED_ROWS = 1, // Result represents the number of changed rows
  DUCKDB_RESULT_TYPE_NOTHING = 2,      // No result (e.g., for statements like VACUUM)
  DUCKDB_RESULT_TYPE_QUERY_RESULT = 3, // The result is a set of query rows
}

/**
 * Enum representing DuckDB's different statement types.
 * 
 * This enum is used to classify different SQL statement types that DuckDB supports.
 */
export enum duckdb_statement_type {
  DUCKDB_STATEMENT_TYPE_INVALID = 0,        // Invalid statement
  DUCKDB_STATEMENT_TYPE_SELECT = 1,         // SELECT statement
  DUCKDB_STATEMENT_TYPE_INSERT = 2,         // INSERT statement
  DUCKDB_STATEMENT_TYPE_UPDATE = 3,         // UPDATE statement
  DUCKDB_STATEMENT_TYPE_EXPLAIN = 4,        // EXPLAIN statement
  DUCKDB_STATEMENT_TYPE_DELETE = 5,         // DELETE statement
  DUCKDB_STATEMENT_TYPE_PREPARE = 6,        // PREPARE statement
  DUCKDB_STATEMENT_TYPE_CREATE = 7,         // CREATE statement
  DUCKDB_STATEMENT_TYPE_EXECUTE = 8,        // EXECUTE statement
  DUCKDB_STATEMENT_TYPE_ALTER = 9,          // ALTER statement
  DUCKDB_STATEMENT_TYPE_TRANSACTION = 10,   // TRANSACTION statement
  DUCKDB_STATEMENT_TYPE_COPY = 11,          // COPY statement
  DUCKDB_STATEMENT_TYPE_ANALYZE = 12,       // ANALYZE statement
  DUCKDB_STATEMENT_TYPE_VARIABLE_SET = 13,  // SET statement for variables
  DUCKDB_STATEMENT_TYPE_CREATE_FUNC = 14,   // CREATE FUNCTION statement
  DUCKDB_STATEMENT_TYPE_DROP = 15,          // DROP statement
  DUCKDB_STATEMENT_TYPE_EXPORT = 16,        // EXPORT statement
  DUCKDB_STATEMENT_TYPE_PRAGMA = 17,        // PRAGMA statement
  DUCKDB_STATEMENT_TYPE_VACUUM = 18,        // VACUUM statement
  DUCKDB_STATEMENT_TYPE_CALL = 19,          // CALL statement
  DUCKDB_STATEMENT_TYPE_SET = 20,           // SET statement
  DUCKDB_STATEMENT_TYPE_LOAD = 21,          // LOAD statement
  DUCKDB_STATEMENT_TYPE_RELATION = 22,      // RELATION statement
  DUCKDB_STATEMENT_TYPE_EXTENSION = 23,     // EXTENSION statement
  DUCKDB_STATEMENT_TYPE_LOGICAL_PLAN = 24,  // LOGICAL PLAN statement
  DUCKDB_STATEMENT_TYPE_ATTACH = 25,        // ATTACH statement
  DUCKDB_STATEMENT_TYPE_DETACH = 26,        // DETACH statement
  DUCKDB_STATEMENT_TYPE_MULTI = 27,         // MULTI statement
}

/**
 * Enum representing DuckDB's different error types.
 * 
 * This enum is used to categorize different kinds of errors that can occur during 
 * DuckDB operations, such as syntax errors, transaction issues, or I/O problems.
 */
export enum duckdb_error_type {
  DUCKDB_ERROR_INVALID = 0,                  // Invalid error type
  DUCKDB_ERROR_OUT_OF_RANGE = 1,             // Out-of-range error
  DUCKDB_ERROR_CONVERSION = 2,               // Type conversion error
  DUCKDB_ERROR_UNKNOWN_TYPE = 3,             // Unknown type error
  DUCKDB_ERROR_DECIMAL = 4,                  // Decimal error
  DUCKDB_ERROR_MISMATCH_TYPE = 5,            // Type mismatch error
  DUCKDB_ERROR_DIVIDE_BY_ZERO = 6,           // Divide by zero error
  DUCKDB_ERROR_OBJECT_SIZE = 7,              // Object size error
  DUCKDB_ERROR_INVALID_TYPE = 8,             // Invalid type error
  DUCKDB_ERROR_SERIALIZATION = 9,            // Serialization error
  DUCKDB_ERROR_TRANSACTION = 10,             // Transaction error
  DUCKDB_ERROR_NOT_IMPLEMENTED = 11,         // Not implemented error
  DUCKDB_ERROR_EXPRESSION = 12,              // Expression error
  DUCKDB_ERROR_CATALOG = 13,                 // Catalog error
  DUCKDB_ERROR_PARSER = 14,                  // Parser error
  DUCKDB_ERROR_PLANNER = 15,                 // Planner error
  DUCKDB_ERROR_SCHEDULER = 16,               // Scheduler error
  DUCKDB_ERROR_EXECUTOR = 17,                // Executor error
  DUCKDB_ERROR_CONSTRAINT = 18,              // Constraint error
  DUCKDB_ERROR_INDEX = 19,                   // Index error
  DUCKDB_ERROR_STAT = 20,                    // Statistics error
  DUCKDB_ERROR_CONNECTION = 21,              // Connection error
  DUCKDB_ERROR_SYNTAX = 22,                  // Syntax error
  DUCKDB_ERROR_SETTINGS = 23,                // Settings error
  DUCKDB_ERROR_BINDER = 24,                  // Binder error
  DUCKDB_ERROR_NETWORK = 25,                 // Network error
  DUCKDB_ERROR_OPTIMIZER = 26,               // Optimizer error
  DUCKDB_ERROR_NULL_POINTER = 27,            // Null pointer error
  DUCKDB_ERROR_IO = 28,                      // Input/output error
  DUCKDB_ERROR_INTERRUPT = 29,               // Interrupt error
  DUCKDB_ERROR_FATAL = 30,                   // Fatal error
  DUCKDB_ERROR_INTERNAL = 31,                // Internal error
  DUCKDB_ERROR_INVALID_INPUT = 32,           // Invalid input error
  DUCKDB_ERROR_OUT_OF_MEMORY = 33,           // Out-of-memory error
  DUCKDB_ERROR_PERMISSION = 34,              // Permission error
  DUCKDB_ERROR_PARAMETER_NOT_RESOLVED = 35,  // Parameter not resolved error
  DUCKDB_ERROR_PARAMETER_NOT_ALLOWED = 36,   // Parameter not allowed error
  DUCKDB_ERROR_DEPENDENCY = 37,              // Dependency error
  DUCKDB_ERROR_HTTP = 38,                    // HTTP error
  DUCKDB_ERROR_MISSING_EXTENSION = 39,       // Missing extension error
  DUCKDB_ERROR_AUTOLOAD = 40,                // Autoload error
  DUCKDB_ERROR_SEQUENCE = 41,                // Sequence error
  DUCKDB_ERROR_INVALID_CONFIGURATION = 42,   // Invalid configuration error
}

/**
 * Enum representing DuckDB's cast modes.
 * 
 * This enum defines how casting between different data types should be handled.
 * The `TRY` cast mode allows for safe casting where errors are ignored.
 */
export enum duckdb_cast_mode {
  DUCKDB_CAST_NORMAL = 0,  // Normal cast mode
  DUCKDB_CAST_TRY = 1,     // Try cast mode, ignores errors
}

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