// types.ts

// ===================================
// Enums
// ===================================

/**
 * Represents the size of a boolean in bytes.
 * Typically, this is 1 byte, but it's defined for clarity and potential platform differences.
 */
export const SIZEOF_BOOL: number = 1;

/**
 * Represents the pending execution state of a DuckDB task.
 */
export enum PendingState {
  RESULT_READY = 0,
  RESULT_NOT_READY = 1,
  ERROR = 2,
  NO_TASKS_AVAILABLE = 3,
}

/**
 * Represents the type of result returned by DuckDB.
 */
export enum ResultType {
  INVALID = 0,
  CHANGED_ROWS = 1,
  NOTHING = 2,
  QUERY_RESULT = 3,
}

/**
 * Represents the type of SQL statement executed.
 */
export enum StatementType {
  INVALID = 0,
  SELECT = 1,
  INSERT = 2,
  UPDATE = 3,
  EXPLAIN = 4,
  DELETE = 5,
  PREPARE = 6,
  CREATE = 7,
  EXECUTE = 8,
  ALTER = 9,
  TRANSACTION = 10,
  COPY = 11,
  ANALYZE = 12,
  VARIABLE_SET = 13,
  CREATE_FUNC = 14,
  DROP = 15,
  EXPORT = 16,
  PRAGMA = 17,
  VACUUM = 18,
  CALL = 19,
  SET = 20,
  LOAD = 21,
  RELATION = 22,
  EXTENSION = 23,
  LOGICAL_PLAN = 24,
  ATTACH = 25,
  DETACH = 26,
  MULTI = 27,
}

/**
 * Represents the various data types supported by DuckDB.
 */
export enum DuckDBType {
  INVALID = 0,
  BOOLEAN = 1,
  TINYINT = 2,
  SMALLINT = 3,
  INTEGER = 4,
  BIGINT = 5,
  UTINYINT = 6,
  USMALLINT = 7,
  UINTEGER = 8,
  UBIGINT = 9,
  FLOAT = 10,
  DOUBLE = 11,
  TIMESTAMP = 12,
  DATE = 13,
  TIME = 14,
  INTERVAL = 15,
  HUGEINT = 16,
  UHUGEINT = 32,
  VARCHAR = 17,
  BLOB = 18,
  DECIMAL = 19,
  TIMESTAMP_S = 20,
  TIMESTAMP_MS = 21,
  TIMESTAMP_NS = 22,
  ENUM = 23,
  LIST = 24,
  STRUCT = 25,
  MAP = 26,
  ARRAY = 33,
  UUID = 27,
  UNION = 28,
  BIT = 29,
  TIME_TZ = 30,
  TIMESTAMP_TZ = 31,
  ANY = 34,
  VARINT = 35,
  SQLNULL = 36,
}

// ===================================
// Interfaces for Data Structures
// ===================================

/**
 * Represents a date as days since 1970-01-01.
 */
export interface DateStruct {
  /** Days since 1970-01-01 */
  days: number;
}

/**
 * Represents a date with individual components.
 */
export interface DateParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Represents a decimal number with width, scale, and value.
 */
export interface Decimal {
  width: number;
  scale: number;
  value: bigint;
}

/**
 * Represents a time interval.
 */
export interface Interval {
  months: number;
  days: number;
  micros: bigint;
}

/**
 * Represents the progress of a query.
 */
export interface QueryProgress {
  percentage: number;
  rowsProcessed: bigint;
  totalRowsToProcess: bigint;
}

/**
 * Represents a time as microseconds since 00:00:00.
 */
export interface TimeStruct {
  /** Microseconds since 00:00:00 */
  micros: number;
}

/**
 * Represents a time with individual components.
 */
export interface TimeParts {
  hour: number;
  minute: number;
  second: number;
  micros: number;
}

/**
 * Represents a time with timezone information.
 */
export interface TimeTZ {
  /**
   * 40 bits for micros, then 24 bits for encoded offset in seconds.
   * 
   * Max absolute unencoded offset = 15:59:59 = 60 * (60 * 15 + 59) + 59 = 57599.
   * 
   * Encoded offset is unencoded offset inverted then shifted (by +57599) to unsigned.
   * 
   * Max unencoded offset = 57599 -> -57599 -> 0 encoded.
   * 
   * Min unencoded offset = -57599 -> 57599 -> 115198 encoded.
   */
  bits: bigint;
}

/**
 * Represents a time with timezone components.
 */
export interface TimeTZParts {
  time: TimeParts;
  /** Offset in seconds, from -15:59:59 = -57599 to 15:59:59 = 57599 */
  offset: number;
}

/**
 * Represents a timestamp as microseconds since 1970-01-01.
 */
export interface Timestamp {
  /** Microseconds since 1970-01-01 */
  micros: bigint;
}

/**
 * Represents a timestamp with individual date and time components.
 */
export interface TimestampParts {
  date: DateParts;
  time: TimeParts;
}

/**
 * Represents a DuckDB vector.
 */
export interface Vector {
  __duckdb_type: 'duckdb_vector';
}

/**
 * Represents a DuckDB appender, which is used for bulk inserting data.
 */
export interface Appender {
  __duckdb_type: 'duckdb_appender';
}

/**
 * Represents a DuckDB configuration.
 */
export interface Config {
  __duckdb_type: 'duckdb_config';
}

/**
 * Represents a DuckDB connection.
 */
export interface Connection {
  __duckdb_type: 'duckdb_connection';
}

/**
 * Represents a DuckDB database.
 */
export interface Database {
  __duckdb_type: 'duckdb_database';
}

/**
 * Represents a DuckDB data chunk.
 */
export interface DataChunk {
  __duckdb_type: 'duckdb_data_chunk';
}

/**
 * Represents extracted SQL statements from a query.
 */
export interface ExtractedStatements {
  __duckdb_type: 'duckdb_extracted_statements';
}

/**
 * Represents a logical type in DuckDB.
 */
export interface LogicalType {
  __duckdb_type: 'duckdb_logical_type';
}

/**
 * Represents a pending result from a DuckDB operation.
 */
export interface PendingResult {
  __duckdb_type: 'duckdb_pending_result';
}

/**
 * Represents a prepared SQL statement in DuckDB.
 */
export interface PreparedStatement {
  __duckdb_type: 'duckdb_prepared_statement';
}

/**
 * Represents the result of a DuckDB query.
 */
export interface Result {
  __duckdb_type: 'duckdb_result';
}

/**
 * Represents a DuckDB value, used for parameter binding.
 */
export interface Value {
  __duckdb_type: 'duckdb_value';
}

// ===================================
// TypeScript-Only Interfaces
// ===================================

/**
 * Represents a configuration flag with its name and description.
 */
export interface ConfigFlag {
  name: string;
  description: string;
}

/**
 * Represents extracted statements along with their count.
 */
export interface ExtractedStatementsAndCount {
  extractedStatements: ExtractedStatements;
  statementCount: number;
}

// ===================================
// Function Type Definitions
// ===================================

/**
 * Function type for opening a DuckDB database.
 * @param path - The file path to the database. Defaults to in-memory.
 * @param config - Optional configuration for the database.
 * @returns A promise that resolves to a `Database` instance.
 */
export type OpenFunction = (path?: string, config?: Config) => Promise<Database>;

/**
 * Function type for closing a DuckDB database.
 * @param database - The `Database` instance to close.
 * @returns A promise that resolves when the database is closed.
 */
export type CloseFunction = (database: Database) => Promise<void>;

/**
 * Function type for connecting to a DuckDB database.
 * @param database - The `Database` instance to connect to.
 * @returns A promise that resolves to a `Connection` instance.
 */
export type ConnectFunction = (database: Database) => Promise<Connection>;

/**
 * Function type for interrupting a DuckDB connection.
 * @param connection - The `Connection` instance to interrupt.
 */
export type InterruptFunction = (connection: Connection) => void;

/**
 * Function type for retrieving query progress.
 * @param connection - The `Connection` instance.
 * @returns The `QueryProgress` object.
 */
export type QueryProgressFunction = (connection: Connection) => QueryProgress;

/**
 * Function type for disconnecting from a DuckDB connection.
 * @param connection - The `Connection` instance to disconnect.
 * @returns A promise that resolves when the connection is disconnected.
 */
export type DisconnectFunction = (connection: Connection) => Promise<void>;

/**
 * Function type for retrieving the DuckDB library version.
 * @returns The library version as a string.
 */
export type LibraryVersionFunction = () => string;

/**
 * Function type for creating a DuckDB configuration.
 * @returns The `Config` instance.
 */
export type CreateConfigFunction = () => Config;

/**
 * Function type for retrieving the number of configuration flags.
 * @returns The count of configuration flags.
 */
export type ConfigCountFunction = () => number;

/**
 * Function type for retrieving a configuration flag by index.
 * @param index - The index of the configuration flag.
 * @returns The `ConfigFlag` object.
 */
export type GetConfigFlagFunction = (index: number) => ConfigFlag;

/**
 * Function type for setting a configuration option.
 * @param config - The `Config` instance.
 * @param name - The name of the configuration option.
 * @param option - The value of the configuration option.
 */
export type SetConfigFunction = (config: Config, name: string, option: string) => void;

/**
 * Function type for destroying a DuckDB configuration.
 * @param config - The `Config` instance to destroy.
 */
export type DestroyConfigFunction = (config: Config) => void;

/**
 * Function type for executing a SQL query.
 * @param connection - The `Connection` instance.
 * @param query - The SQL query string.
 * @returns A promise that resolves to a `Result` instance.
 */
export type QueryFunction = (connection: Connection, query: string) => Promise<Result>;

/**
 * Function type for destroying a DuckDB result.
 * @param result - The `Result` instance to destroy.
 */
export type DestroyResultFunction = (result: Result) => void;

/**
 * Function type for retrieving a column name from a result.
 * @param result - The `Result` instance.
 * @param columnIndex - The zero-based index of the column.
 * @returns The column name as a string.
 */
export type ColumnNameFunction = (result: Result, columnIndex: number) => string;

/**
 * Function type for retrieving a column type from a result.
 * @param result - The `Result` instance.
 * @param columnIndex - The zero-based index of the column.
 * @returns The column type as a `DuckDBType` enum.
 */
export type ColumnTypeFunction = (result: Result, columnIndex: number) => DuckDBType;

/**
 * Function type for retrieving the statement type of a result.
 * @param result - The `Result` instance.
 * @returns The statement type as a `StatementType` enum.
 */
export type ResultStatementTypeFunction = (result: Result) => StatementType;

/**
 * Function type for retrieving the logical type of a column in a result.
 * @param result - The `Result` instance.
 * @param columnIndex - The zero-based index of the column.
 * @returns The logical type as a `LogicalType` instance.
 */
export type ColumnLogicalTypeFunction = (result: Result, columnIndex: number) => LogicalType;

/**
 * Function type for retrieving the number of columns in a result.
 * @param result - The `Result` instance.
 * @returns The number of columns.
 */
export type ColumnCountFunction = (result: Result) => number;

/**
 * Function type for retrieving the number of rows changed by the result.
 * @param result - The `Result` instance.
 * @returns The number of rows changed.
 */
export type RowsChangedFunction = (result: Result) => number;

/**
 * Function type for retrieving the return type of the result.
 * @param result - The `Result` instance.
 * @returns The return type as a `ResultType` enum.
 */
export type ResultReturnTypeFunction = (result: Result) => ResultType;

/**
 * Function type for converting a date from `DateStruct` to `DateParts`.
 * @param date - The `DateStruct` instance.
 * @returns The `DateParts` object.
 */
export type FromDateFunction = (date: DateStruct) => DateParts;

/**
 * Function type for converting a date from `DateParts` to `DateStruct`.
 * @param parts - The `DateParts` object.
 * @returns The `DateStruct` instance.
 */
export type ToDateFunction = (parts: DateParts) => DateStruct;

/**
 * Function type for checking if a date is finite.
 * @param date - The `DateStruct` instance.
 * @returns `true` if the date is finite, otherwise `false`.
 */
export type IsFiniteDateFunction = (date: DateStruct) => boolean;

/**
 * Function type for converting a time from `TimeStruct` to `TimeParts`.
 * @param time - The `TimeStruct` instance.
 * @returns The `TimeParts` object.
 */
export type FromTimeFunction = (time: TimeStruct) => TimeParts;

/**
 * Function type for creating a `TimeTZ` instance.
 * @param micros - Microseconds since 00:00:00.
 * @param offset - Offset in seconds.
 * @returns The `TimeTZ` instance.
 */
export type CreateTimeTZFunction = (micros: number, offset: number) => TimeTZ;

/**
 * Function type for converting a `TimeTZ` instance to `TimeTZParts`.
 * @param timeTZ - The `TimeTZ` instance.
 * @returns The `TimeTZParts` object.
 */
export type FromTimeTZFunction = (timeTZ: TimeTZ) => TimeTZParts;

/**
 * Function type for converting a time from `TimeParts` to `TimeStruct`.
 * @param parts - The `TimeParts` object.
 * @returns The `TimeStruct` instance.
 */
export type ToTimeFunction = (parts: TimeParts) => TimeStruct;

/**
 * Function type for converting a timestamp from `Timestamp` to `TimestampParts`.
 * @param timestamp - The `Timestamp` instance.
 * @returns The `TimestampParts` object.
 */
export type FromTimestampFunction = (timestamp: Timestamp) => TimestampParts;

/**
 * Function type for converting a timestamp from `TimestampParts` to `Timestamp`.
 * @param parts - The `TimestampParts` object.
 * @returns The `Timestamp` instance.
 */
export type ToTimestampFunction = (parts: TimestampParts) => Timestamp;

/**
 * Function type for checking if a timestamp is finite.
 * @param timestamp - The `Timestamp` instance.
 * @returns `true` if the timestamp is finite, otherwise `false`.
 */
export type IsFiniteTimestampFunction = (timestamp: Timestamp) => boolean;

/**
 * Function type for converting a `hugeint` to a double.
 * @param hugeint - The `bigint` value.
 * @returns The converted double.
 */
export type HugeIntToDoubleFunction = (hugeint: bigint) => number;

/**
 * Function type for converting a double to a `hugeint`.
 * @param double - The double value.
 * @returns The converted `bigint`.
 */
export type DoubleToHugeIntFunction = (double: number) => bigint;

/**
 * Function type for converting an `uhugeint` to a double.
 * @param uhugeint - The `bigint` value.
 * @returns The converted double.
 */
export type UHugeIntToDoubleFunction = (uhugeint: bigint) => number;

/**
 * Function type for converting a double to an `uhugeint`.
 * @param double - The double value.
 * @returns The converted `bigint`.
 */
export type DoubleToUHugeIntFunction = (double: number) => bigint;

/**
 * Function type for converting a double to a `Decimal`.
 * @param double - The double value.
 * @param width - The width of the decimal.
 * @param scale - The scale of the decimal.
 * @returns The `Decimal` instance.
 */
export type DoubleToDecimalFunction = (double: number, width: number, scale: number) => Decimal;

/**
 * Function type for converting a `Decimal` to a double.
 * @param decimal - The `Decimal` instance.
 * @returns The converted double.
 */
export type DecimalToDoubleFunction = (decimal: Decimal) => number;

/**
 * Function type for preparing a SQL statement.
 * @param connection - The `Connection` instance.
 * @param query - The SQL query string.
 * @returns A promise that resolves to a `PreparedStatement` instance.
 */
export type PrepareFunction = (connection: Connection, query: string) => Promise<PreparedStatement>;

/**
 * Function type for destroying a prepared statement.
 * @param preparedStatement - The `PreparedStatement` instance to destroy.
 */
export type DestroyPrepareFunction = (preparedStatement: PreparedStatement) => void;

/**
 * Function type for retrieving the number of parameters in a prepared statement.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @returns The number of parameters.
 */
export type NParamsFunction = (preparedStatement: PreparedStatement) => number;

/**
 * Function type for retrieving the name of a parameter in a prepared statement.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @returns The parameter name as a string.
 */
export type ParameterNameFunction = (preparedStatement: PreparedStatement, index: number) => string;

/**
 * Function type for retrieving the type of a parameter in a prepared statement.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @returns The parameter type as a `DuckDBType` enum.
 */
export type ParamTypeFunction = (preparedStatement: PreparedStatement, index: number) => DuckDBType;

/**
 * Function type for clearing all bindings in a prepared statement.
 * @param preparedStatement - The `PreparedStatement` instance.
 */
export type ClearBindingsFunction = (preparedStatement: PreparedStatement) => void;

/**
 * Function type for retrieving the statement type of a prepared statement.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @returns The statement type as a `StatementType` enum.
 */
export type PreparedStatementTypeFunction = (preparedStatement: PreparedStatement) => StatementType;

/**
 * Function type for binding a generic `Value` to a parameter.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param value - The `Value` instance to bind.
 */
export type BindValueFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  value: Value
) => void;

/**
 * Function type for retrieving the index of a named parameter.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param name - The name of the parameter.
 * @returns The index of the parameter.
 */
export type BindParameterIndexFunction = (
  preparedStatement: PreparedStatement,
  name: string
) => number;

/**
 * Function type for binding a boolean value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param bool - The boolean value to bind.
 */
export type BindBooleanFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  bool: boolean
) => void;

/**
 * Function type for binding an int8 value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param int8 - The int8 value to bind.
 */
export type BindInt8Function = (
  preparedStatement: PreparedStatement,
  index: number,
  int8: number
) => void;

/**
 * Function type for binding an int16 value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param int16 - The int16 value to bind.
 */
export type BindInt16Function = (
  preparedStatement: PreparedStatement,
  index: number,
  int16: number
) => void;

/**
 * Function type for binding an int32 value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param int32 - The int32 value to bind.
 */
export type BindInt32Function = (
  preparedStatement: PreparedStatement,
  index: number,
  int32: number
) => void;

/**
 * Function type for binding an int64 value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param int64 - The int64 value to bind.
 */
export type BindInt64Function = (
  preparedStatement: PreparedStatement,
  index: number,
  int64: bigint
) => void;

/**
 * Function type for binding a `hugeint` value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param hugeint - The `bigint` value to bind.
 */
export type BindHugeIntFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  hugeint: bigint
) => void;

/**
 * Function type for binding an `uhugeint` value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param uhugeint - The `bigint` value to bind.
 */
export type BindUHugeIntFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  uhugeint: bigint
) => void;

/**
 * Function type for binding a `Decimal` value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param decimal - The `Decimal` instance to bind.
 */
export type BindDecimalFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  decimal: Decimal
) => void;

/**
 * Function type for binding a uint8 value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param uint8 - The uint8 value to bind.
 */
export type BindUInt8Function = (
  preparedStatement: PreparedStatement,
  index: number,
  uint8: number
) => void;

/**
 * Function type for binding a uint16 value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param uint16 - The uint16 value to bind.
 */
export type BindUInt16Function = (
  preparedStatement: PreparedStatement,
  index: number,
  uint16: number
) => void;

/**
 * Function type for binding a uint32 value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param uint32 - The uint32 value to bind.
 */
export type BindUInt32Function = (
  preparedStatement: PreparedStatement,
  index: number,
  uint32: number
) => void;

/**
 * Function type for binding a uint64 value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param uint64 - The uint64 value to bind.
 */
export type BindUInt64Function = (
  preparedStatement: PreparedStatement,
  index: number,
  uint64: bigint
) => void;

/**
 * Function type for binding a float value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param float - The float value to bind.
 */
export type BindFloatFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  float: number
) => void;

/**
 * Function type for binding a double value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param double - The double value to bind.
 */
export type BindDoubleFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  double: number
) => void;

/**
 * Function type for binding a date value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param date - The `DateStruct` instance to bind.
 */
export type BindDateFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  date: DateStruct
) => void;

/**
 * Function type for binding a time value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param time - The `TimeStruct` instance to bind.
 */
export type BindTimeFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  time: TimeStruct
) => void;

/**
 * Function type for binding a timestamp value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param timestamp - The `Timestamp` instance to bind.
 */
export type BindTimestampFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  timestamp: Timestamp
) => void;

/**
 * Function type for binding an interval value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param interval - The `Interval` instance to bind.
 */
export type BindIntervalFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  interval: Interval
) => void;

/**
 * Function type for binding a varchar string.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param varchar - The string to bind.
 */
export type BindVarcharFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  varchar: string
) => void;

/**
 * Function type for binding a blob.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 * @param data - The `Uint8Array` data to bind.
 */
export type BindBlobFunction = (
  preparedStatement: PreparedStatement,
  index: number,
  data: Uint8Array
) => void;

/**
 * Function type for binding a null value.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @param index - The zero-based index of the parameter.
 */
export type BindNullFunction = (
  preparedStatement: PreparedStatement,
  index: number
) => void;

/**
 * Function type for executing a prepared statement.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @returns A promise that resolves to a `Result` instance.
 */
export type ExecutePreparedFunction = (
  preparedStatement: PreparedStatement
) => Promise<Result>;

/**
 * Function type for extracting SQL statements from a query.
 * @param connection - The `Connection` instance.
 * @param query - The SQL query string.
 * @returns A promise that resolves to an `ExtractedStatementsAndCount` object.
 */
export type ExtractStatementsFunction = (
  connection: Connection,
  query: string
) => Promise<ExtractedStatementsAndCount>;

/**
 * Function type for preparing an extracted statement.
 * @param connection - The `Connection` instance.
 * @param extractedStatements - The `ExtractedStatements` instance.
 * @param index - The index of the statement to prepare.
 * @returns A promise that resolves to a `PreparedStatement` instance.
 */
export type PrepareExtractedStatementFunction = (
  connection: Connection,
  extractedStatements: ExtractedStatements,
  index: number
) => Promise<PreparedStatement>;

/**
 * Function type for retrieving errors from extracted statements.
 * @param extractedStatements - The `ExtractedStatements` instance.
 * @returns The error message as a string.
 */
export type ExtractStatementsErrorFunction = (
  extractedStatements: ExtractedStatements
) => string;

/**
 * Function type for destroying extracted statements.
 * @param extractedStatements - The `ExtractedStatements` instance to destroy.
 */
export type DestroyExtractedFunction = (
  extractedStatements: ExtractedStatements
) => void;

/**
 * Function type for creating a pending result from a prepared statement.
 * @param preparedStatement - The `PreparedStatement` instance.
 * @returns The `PendingResult` instance.
 */
export type PendingPreparedFunction = (
  preparedStatement: PreparedStatement
) => PendingResult;

/**
 * Function type for destroying a pending result.
 * @param pendingResult - The `PendingResult` instance to destroy.
 */
export type DestroyPendingFunction = (
  pendingResult: PendingResult
) => void;

/**
 * Function type for retrieving errors from a pending result.
 * @param pendingResult - The `PendingResult` instance.
 * @returns The error message as a string.
 */
export type PendingErrorFunction = (
  pendingResult: PendingResult
) => string;

/**
 * Function type for executing a task from a pending result.
 * @param pendingResult - The `PendingResult` instance.
 * @returns The `PendingState` of the task.
 */
export type PendingExecuteTaskFunction = (
  pendingResult: PendingResult
) => PendingState;

/**
 * Function type for checking the execution state of a pending result.
 * @param pendingResult - The `PendingResult` instance.
 * @returns The `PendingState` of the execution.
 */
export type PendingExecuteCheckStateFunction = (
  pendingResult: PendingResult
) => PendingState;

/**
 * Function type for executing a pending result.
 * @param pendingResult - The `PendingResult` instance.
 * @returns A promise that resolves to a `Result` instance.
 */
export type ExecutePendingFunction = (
  pendingResult: PendingResult
) => Promise<Result>;

/**
 * Function type for checking if pending execution is finished.
 * @param pendingState - The `PendingState` to check.
 * @returns `true` if finished, otherwise `false`.
 */
export type PendingExecutionIsFinishedFunction = (
  pendingState: PendingState
) => boolean;

/**
 * Function type for destroying a DuckDB value.
 * @param value - The `Value` instance to destroy.
 */
export type DestroyValueFunction = (value: Value) => void;

/**
 * Function type for creating a varchar `Value` from a string.
 * @param text - The string to convert.
 * @returns The `Value` instance.
 */
export type CreateVarcharFunction = (text: string) => Value;

/**
 * Function type for creating an int64 `Value` from a bigint.
 * @param int64 - The bigint to convert.
 * @returns The `Value` instance.
 */
export type CreateInt64Function = (int64: bigint) => Value;

/**
 * Function type for creating a struct `Value` from a logical type and an array of values.
 * @param logicalType - The `LogicalType` instance.
 * @param values - An array of `Value` instances.
 * @returns The `Value` instance.
 */
export type CreateStructValueFunction = (
  logicalType: LogicalType,
  values: readonly Value[]
) => Value;

/**
 * Function type for creating a list `Value` from a logical type and an array of values.
 * @param logicalType - The `LogicalType` instance.
 * @param values - An array of `Value` instances.
 * @returns The `Value` instance.
 */
export type CreateListValueFunction = (
  logicalType: LogicalType,
  values: readonly Value[]
) => Value;

/**
 * Function type for creating an array `Value` from a logical type and an array of values.
 * @param logicalType - The `LogicalType` instance.
 * @param values - An array of `Value` instances.
 * @returns The `Value` instance.
 */
export type CreateArrayValueFunction = (
  logicalType: LogicalType,
  values: readonly Value[]
) => Value;

/**
 * Function type for retrieving a varchar string from a `Value`.
 * @param value - The `Value` instance.
 * @returns The string value.
 */
export type GetVarcharFunction = (value: Value) => string;

/**
 * Function type for retrieving an int64 bigint from a `Value`.
 * @param value - The `Value` instance.
 * @returns The bigint value.
 */
export type GetInt64Function = (value: Value) => bigint;

/**
 * Function type for creating a `LogicalType` from a `DuckDBType`.
 * @param type - The `DuckDBType` enum value.
 * @returns The `LogicalType` instance.
 */
export type CreateLogicalTypeFunction = (type: DuckDBType) => LogicalType;

/**
 * Function type for retrieving the alias of a `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The alias as a string, or `null` if none exists.
 */
export type LogicalTypeGetAliasFunction = (
  logicalType: LogicalType
) => string | null;

/**
 * Function type for creating a list `LogicalType`.
 * @param childType - The child `LogicalType` instance.
 * @returns The list `LogicalType` instance.
 */
export type CreateListTypeFunction = (
  childType: LogicalType
) => LogicalType;

/**
 * Function type for creating an array `LogicalType`.
 * @param childType - The child `LogicalType` instance.
 * @param arraySize - The size of the array.
 * @returns The array `LogicalType` instance.
 */
export type CreateArrayTypeFunction = (
  childType: LogicalType,
  arraySize: number
) => LogicalType;

/**
 * Function type for creating a map `LogicalType`.
 * @param keyType - The key `LogicalType` instance.
 * @param valueType - The value `LogicalType` instance.
 * @returns The map `LogicalType` instance.
 */
export type CreateMapTypeFunction = (
  keyType: LogicalType,
  valueType: LogicalType
) => LogicalType;

/**
 * Function type for creating a union `LogicalType`.
 * @param memberTypes - An array of `LogicalType` instances.
 * @param memberNames - An array of member names.
 * @returns The union `LogicalType` instance.
 */
export type CreateUnionTypeFunction = (
  memberTypes: readonly LogicalType[],
  memberNames: readonly string[]
) => LogicalType;

/**
 * Function type for creating a struct `LogicalType`.
 * @param memberTypes - An array of `LogicalType` instances.
 * @param memberNames - An array of member names.
 * @returns The struct `LogicalType` instance.
 */
export type CreateStructTypeFunction = (
  memberTypes: readonly LogicalType[],
  memberNames: readonly string[]
) => LogicalType;

/**
 * Function type for creating an enum `LogicalType`.
 * @param memberNames - An array of member names.
 * @returns The enum `LogicalType` instance.
 */
export type CreateEnumTypeFunction = (
  memberNames: readonly string[]
) => LogicalType;

/**
 * Function type for creating a decimal `LogicalType`.
 * @param width - The width of the decimal.
 * @param scale - The scale of the decimal.
 * @returns The decimal `LogicalType` instance.
 */
export type CreateDecimalTypeFunction = (
  width: number,
  scale: number
) => LogicalType;

/**
 * Function type for retrieving the type ID from a `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The type ID as a `DuckDBType` enum.
 */
export type GetTypeIDFunction = (logicalType: LogicalType) => DuckDBType;

/**
 * Function type for retrieving the width of a decimal `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The width as a number.
 */
export type DecimalWidthFunction = (
  logicalType: LogicalType
) => number;

/**
 * Function type for retrieving the scale of a decimal `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The scale as a number.
 */
export type DecimalScaleFunction = (
  logicalType: LogicalType
) => number;

/**
 * Function type for retrieving the internal type of a decimal `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The internal type as a `DuckDBType` enum.
 */
export type DecimalInternalTypeFunction = (
  logicalType: LogicalType
) => DuckDBType;

/**
 * Function type for retrieving the internal type of an enum `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The internal type as a `DuckDBType` enum.
 */
export type EnumInternalTypeFunction = (
  logicalType: LogicalType
) => DuckDBType;

/**
 * Function type for retrieving the size of the enum dictionary.
 * @param logicalType - The `LogicalType` instance.
 * @returns The size of the dictionary.
 */
export type EnumDictionarySizeFunction = (
  logicalType: LogicalType
) => number;

/**
 * Function type for retrieving the value of an enum dictionary by index.
 * @param logicalType - The `LogicalType` instance.
 * @param index - The index of the dictionary value.
 * @returns The dictionary value as a string.
 */
export type EnumDictionaryValueFunction = (
  logicalType: LogicalType,
  index: number
) => string;

/**
 * Function type for retrieving the child type of a list `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The child `LogicalType` instance.
 */
export type ListTypeChildTypeFunction = (
  logicalType: LogicalType
) => LogicalType;

/**
 * Function type for retrieving the child type of an array `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The child `LogicalType` instance.
 */
export type ArrayTypeChildTypeFunction = (
  logicalType: LogicalType
) => LogicalType;

/**
 * Function type for retrieving the array size of an array `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The array size.
 */
export type ArrayTypeArraySizeFunction = (
  logicalType: LogicalType
) => number;

/**
 * Function type for retrieving the key type of a map `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The key `LogicalType` instance.
 */
export type MapTypeKeyTypeFunction = (
  logicalType: LogicalType
) => LogicalType;

/**
 * Function type for retrieving the value type of a map `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The value `LogicalType` instance.
 */
export type MapTypeValueTypeFunction = (
  logicalType: LogicalType
) => LogicalType;

/**
 * Function type for retrieving the number of child types in a struct `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The number of child types.
 */
export type StructTypeChildCountFunction = (
  logicalType: LogicalType
) => number;

/**
 * Function type for retrieving the name of a child in a struct `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @param index - The index of the child.
 * @returns The child name as a string.
 */
export type StructTypeChildNameFunction = (
  logicalType: LogicalType,
  index: number
) => string;

/**
 * Function type for retrieving the child type of a struct `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @param index - The index of the child.
 * @returns The child `LogicalType` instance.
 */
export type StructTypeChildTypeFunction = (
  logicalType: LogicalType,
  index: number
) => LogicalType;

/**
 * Function type for retrieving the number of members in a union `LogicalType`.
 * @param logicalType - The `LogicalType` instance.
 * @returns The number of members.
 */
export type UnionTypeMemberCountFunction = (
  logicalType: LogicalType
) => number;

/**
 * Function type for retrieving the name of a union member by index.
 * @param logicalType - The `LogicalType` instance.
 * @param index - The index of the member.
 * @returns The member name as a string.
 */
export type UnionTypeMemberNameFunction = (
  logicalType: LogicalType,
  index: number
) => string;

/**
 * Function type for retrieving the member type of a union `LogicalType` by index.
 * @param logicalType - The `LogicalType` instance.
 * @param index - The index of the member.
 * @returns The member `LogicalType` instance.
 */
export type UnionTypeMemberTypeFunction = (
  logicalType: LogicalType,
  index: number
) => LogicalType;

/**
 * Function type for destroying a `LogicalType` instance.
 * @param logicalType - The `LogicalType` instance to destroy.
 */
export type DestroyLogicalTypeFunction = (
  logicalType: LogicalType
) => void;

/**
 * Function type for creating a data chunk from logical types.
 * @param logicalTypes - An array of `LogicalType` instances.
 * @returns The `DataChunk` instance.
 */
export type CreateDataChunkFunction = (
  logicalTypes: readonly LogicalType[]
) => DataChunk;

/**
 * Function type for destroying a data chunk.
 * @param chunk - The `DataChunk` instance to destroy.
 */
export type DestroyDataChunkFunction = (chunk: DataChunk) => void;

/**
 * Function type for resetting a data chunk.
 * @param chunk - The `DataChunk` instance to reset.
 */
export type DataChunkResetFunction = (chunk: DataChunk) => void;

/**
 * Function type for retrieving the number of columns in a data chunk.
 * @param chunk - The `DataChunk` instance.
 * @returns The number of columns.
 */
export type DataChunkGetColumnCountFunction = (
  chunk: DataChunk
) => number;

/**
 * Function type for retrieving a vector from a data chunk by column index.
 * @param chunk - The `DataChunk` instance.
 * @param columnIndex - The zero-based index of the column.
 * @returns The `Vector` instance.
 */
export type DataChunkGetVectorFunction = (
  chunk: DataChunk,
  columnIndex: number
) => Vector;

/**
 * Function type for retrieving the size of a data chunk.
 * @param chunk - The `DataChunk` instance.
 * @returns The size of the chunk.
 */
export type DataChunkGetSizeFunction = (chunk: DataChunk) => number;

/**
 * Function type for setting the size of a data chunk.
 * @param chunk - The `DataChunk` instance.
 * @param size - The new size to set.
 */
export type DataChunkSetSizeFunction = (
  chunk: DataChunk,
  size: number
) => void;

/**
 * Function type for retrieving the logical type of a vector.
 * @param vector - The `Vector` instance.
 * @returns The `LogicalType` instance.
 */
export type VectorGetColumnTypeFunction = (
  vector: Vector
) => LogicalType;

/**
 * Function type for retrieving data from a vector.
 * @param vector - The `Vector` instance.
 * @param byteCount - The number of bytes to retrieve.
 * @returns The data as a `Uint8Array`.
 */
export type VectorGetDataFunction = (
  vector: Vector,
  byteCount: number
) => Uint8Array;

/**
 * Function type for retrieving validity data from a vector.
 * @param vector - The `Vector` instance.
 * @param byteCount - The number of bytes to retrieve.
 * @returns The validity data as a `Uint8Array`.
 */
export type VectorGetValidityFunction = (
  vector: Vector,
  byteCount: number
) => Uint8Array;

/**
 * Function type for ensuring the validity data of a vector is writable.
 * @param vector - The `Vector` instance.
 */
export type VectorEnsureValidityWritableFunction = (
  vector: Vector
) => void;

/**
 * Function type for assigning a string element to a vector at a specified index.
 * @param vector - The `Vector` instance.
 * @param index - The zero-based index.
 * @param str - The string to assign.
 */
export type VectorAssignStringElementFunction = (
  vector: Vector,
  index: number,
  str: string
) => void;

/**
 * Function type for retrieving the child vector of a list vector.
 * @param vector - The `Vector` instance.
 * @returns The child `Vector` instance.
 */
export type ListVectorGetChildFunction = (
  vector: Vector
) => Vector;

/**
 * Function type for retrieving the size of a list vector.
 * @param vector - The `Vector` instance.
 * @returns The size of the list vector.
 */
export type ListVectorGetSizeFunction = (vector: Vector) => number;

/**
 * Function type for setting the size of a list vector.
 * @param vector - The `Vector` instance.
 * @param size - The new size to set.
 */
export type ListVectorSetSizeFunction = (
  vector: Vector,
  size: number
) => void;

/**
 * Function type for reserving capacity for a list vector.
 * @param vector - The `Vector` instance.
 * @param requiredCapacity - The required capacity.
 */
export type ListVectorReserveFunction = (
  vector: Vector,
  requiredCapacity: number
) => void;

/**
 * Function type for retrieving a child vector from a struct vector by index.
 * @param vector - The `Vector` instance.
 * @param index - The zero-based index of the child.
 * @returns The child `Vector` instance.
 */
export type StructVectorGetChildFunction = (
  vector: Vector,
  index: number
) => Vector;

/**
 * Function type for retrieving the child vector of an array vector.
 * @param vector - The `Vector` instance.
 * @returns The child `Vector` instance.
 */
export type ArrayVectorGetChildFunction = (
  vector: Vector
) => Vector;

/**
 * Function type for checking if a row in the validity data is valid.
 * @param validity - The validity data as a `Uint8Array`.
 * @param rowIndex - The zero-based index of the row.
 * @returns `true` if the row is valid, otherwise `false`.
 */
export type ValidityRowIsValidFunction = (
  validity: Uint8Array,
  rowIndex: number
) => boolean;

/**
 * Function type for setting the validity of a row to invalid.
 * @param validity - The validity data as a `Uint8Array`.
 * @param rowIndex - The zero-based index of the row.
 */
export type ValiditySetRowInvalidFunction = (
  validity: Uint8Array,
  rowIndex: number
) => void;

/**
 * Function type for setting the validity of a row to valid.
 * @param validity - The validity data as a `Uint8Array`.
 * @param rowIndex - The zero-based index of the row.
 */
export type ValiditySetRowValidFunction = (
  validity: Uint8Array,
  rowIndex: number
) => void;

/**
 * Function type for appending a boolean value to an appender.
 * @param appender - The `Appender` instance.
 * @param value - The boolean value to append.
 */
export type AppendBoolFunction = (
  appender: Appender,
  value: boolean
) => void;

/**
 * Function type for appending an int8 value to an appender.
 * @param appender - The `Appender` instance.
 * @param int8 - The int8 value to append.
 */
export type AppendInt8Function = (
  appender: Appender,
  int8: number
) => void;

/**
 * Function type for appending an int16 value to an appender.
 * @param appender - The `Appender` instance.
 * @param int16 - The int16 value to append.
 */
export type AppendInt16Function = (
  appender: Appender,
  int16: number
) => void;

/**
 * Function type for appending an int32 value to an appender.
 * @param appender - The `Appender` instance.
 * @param int32 - The int32 value to append.
 */
export type AppendInt32Function = (
  appender: Appender,
  int32: number
) => void;

/**
 * Function type for appending an int64 value to an appender.
 * @param appender - The `Appender` instance.
 * @param int64 - The int64 value to append.
 */
export type AppendInt64Function = (
  appender: Appender,
  int64: bigint
) => void;

/**
 * Function type for appending a `hugeint` value to an appender.
 * @param appender - The `Appender` instance.
 * @param hugeint - The `bigint` value to append.
 */
export type AppendHugeIntFunction = (
  appender: Appender,
  hugeint: bigint
) => void;

/**
 * Function type for appending a uint8 value to an appender.
 * @param appender - The `Appender` instance.
 * @param uint8 - The uint8 value to append.
 */
export type AppendUInt8Function = (
  appender: Appender,
  uint8: number
) => void;

/**
 * Function type for appending a uint16 value to an appender.
 * @param appender - The `Appender` instance.
 * @param uint16 - The uint16 value to append.
 */
export type AppendUInt16Function = (
  appender: Appender,
  uint16: number
) => void;

/**
 * Function type for appending a uint32 value to an appender.
 * @param appender - The `Appender` instance.
 * @param uint32 - The uint32 value to append.
 */
export type AppendUInt32Function = (
  appender: Appender,
  uint32: number
) => void;

/**
 * Function type for appending a uint64 value to an appender.
 * @param appender - The `Appender` instance.
 * @param uint64 - The uint64 value to append.
 */
export type AppendUInt64Function = (
  appender: Appender,
  uint64: bigint
) => void;

/**
 * Function type for appending a float value to an appender.
 * @param appender - The `Appender` instance.
 * @param float - The float value to append.
 */
export type AppendFloatFunction = (
  appender: Appender,
  float: number
) => void;

/**
 * Function type for appending a double value to an appender.
 * @param appender - The `Appender` instance.
 * @param double - The double value to append.
 */
export type AppendDoubleFunction = (
  appender: Appender,
  double: number
) => void;

/**
 * Function type for appending a date value to an appender.
 * @param appender - The `Appender` instance.
 * @param date - The `DateStruct` instance to append.
 */
export type AppendDateFunction = (
  appender: Appender,
  date: DateStruct
) => void;

/**
 * Function type for appending a time value to an appender.
 * @param appender - The `Appender` instance.
 * @param time - The `TimeStruct` instance to append.
 */
export type AppendTimeFunction = (
  appender: Appender,
  time: TimeStruct
) => void;

/**
 * Function type for appending a timestamp value to an appender.
 * @param appender - The `Appender` instance.
 * @param timestamp - The `Timestamp` instance to append.
 */
export type AppendTimestampFunction = (
  appender: Appender,
  timestamp: Timestamp
) => void;

/**
 * Function type for appending an interval value to an appender.
 * @param appender - The `Appender` instance.
 * @param interval - The `Interval` instance to append.
 */
export type AppendIntervalFunction = (
  appender: Appender,
  interval: Interval
) => void;

/**
 * Function type for appending a varchar string to an appender.
 * @param appender - The `Appender` instance.
 * @param varchar - The string to append.
 */
export type AppendVarcharFunction = (
  appender: Appender,
  varchar: string
) => void;

/**
 * Function type for appending a blob to an appender.
 * @param appender - The `Appender` instance.
 * @param data - The `Uint8Array` data to append.
 */
export type AppendBlobFunction = (
  appender: Appender,
  data: Uint8Array
) => void;

/**
 * Function type for appending a null value to an appender.
 * @param appender - The `Appender` instance.
 */
export type AppendNullFunction = (
  appender: Appender
) => void;

/**
 * Function type for appending a data chunk to an appender.
 * @param appender - The `Appender` instance.
 * @param chunk - The `DataChunk` instance to append.
 */
export type AppendDataChunkFunction = (
  appender: Appender,
  chunk: DataChunk
) => void;

/**
 * Function type for creating an appender.
 * @param connection - The `Connection` instance.
 * @param schema - The schema name.
 * @param table - The table name.
 * @returns The `Appender` instance.
 */
export type AppenderCreateFunction = (
  connection: Connection,
  schema: string,
  table: string
) => Appender;

/**
 * Function type for retrieving the number of columns in an appender.
 * @param appender - The `Appender` instance.
 * @returns The number of columns.
 */
export type AppenderColumnCountFunction = (
  appender: Appender
) => number;

/**
 * Function type for retrieving the type of a column in an appender.
 * @param appender - The `Appender` instance.
 * @param columnIndex - The zero-based index of the column.
 * @returns The `LogicalType` instance.
 */
export type AppenderColumnTypeFunction = (
  appender: Appender,
  columnIndex: number
) => LogicalType;

/**
 * Function type for flushing an appender.
 * @param appender - The `Appender` instance.
 */
export type AppenderFlushFunction = (
  appender: Appender
) => void;

/**
 * Function type for closing an appender.
 * @param appender - The `Appender` instance.
 */
export type AppenderCloseFunction = (
  appender: Appender
) => void;

/**
 * Function type for destroying an appender.
 * @param appender - The `Appender` instance to destroy.
 */
export type AppenderDestroyFunction = (
  appender: Appender
) => void;

/**
 * Function type for ending a row in an appender.
 * @param appender - The `Appender` instance.
 */
export type AppenderEndRowFunction = (
  appender: Appender
) => void;

/**
 * Function type for fetching a data chunk from a result.
 * @param result - The `Result` instance.
 * @returns A promise that resolves to a `DataChunk` instance.
 */
export type FetchChunkFunction = (
  result: Result
) => Promise<DataChunk>;

/**
 * Function type for retrieving data from a pointer within an array buffer.
 * 
 * Used to read from `duckdb_string_t`s with non-inlined data that are embedded in VARCHAR, BLOB, and BIT vectors.
 * 
 * @param arrayBuffer - The source `ArrayBuffer`.
 * @param pointerOffset - The byte offset where the pointer is located within the array buffer.
 * @param byteCount - The number of bytes to read from the pointer's target location.
 * @returns The data as a `Uint8Array`.
 */
export type GetDataFromPointerFunction = (
  arrayBuffer: ArrayBuffer,
  pointerOffset: number,
  byteCount: number
) => Uint8Array;

// ===================================
// Additional Recommendations
// ===================================

/**
 * Union type for DuckDB logical types that can be used in various functions.
 */
export type DuckDBLogicalType = LogicalType | DuckDBType;

/**
 * Readonly interfaces to prevent accidental mutation.
 */
export interface ReadonlyDateStruct {
  readonly days: number;
}

export interface ReadonlyDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/**
 * Additional utility types or helper functions can be defined here to enhance type safety and usability.
 */

// Example: Readonly interfaces can be expanded for other data structures as needed.
export interface ReadonlyTimestamp {
  readonly micros: bigint;
}

export interface ReadonlyTimeStruct {
  readonly micros: number;
}
