# Changelog

All notable changes to this project will be documented in this file.

## [1.1.16]

### Changed

- Simplify CI workflow to use consolidated `deno task ci` command
- Rewrite CONTRIBUTING.md with comprehensive contribution guidelines

### Fixed

- Update test task to include coverage reporting

## [1.1.15]

### Added

- Test coverage for missing data types (TINYINT, SMALLINT, INTEGER, BIGINT, UTINYINT, USMALLINT, UINTEGER, UBIGINT, FLOAT, DOUBLE, TIME, TIMESTAMP)

### Changed

- Replace unsafe `as` casts with `satisfies` in config schema for type safety
- Update Deno version requirement to 1.46+ and export runtime config

### Fixed

- Timestamp decoding in `microsecondsToTimestampString()` (correct time constants from nanoseconds to microseconds)
- Config alias runtime handling for `memory_limit`, `worker_threads` at all validation points
- Config validation alias and type issues
- Correctness and type safety issues in config and prepared statements
- Hardened fragile FFI decoding with validation and limits
- Materialization safety limits for strings and rows enforced

## [1.1.14]

### Added

- Cascade close for Connection in Objective API (closes all PreparedStatement and QueryResult objects)
- DuckDB v1.5.0 support
- Optional index validation with runtime toggle (`strictValidation` flag)
- Modular config schema and validation
- `Symbol.dispose` support for Database, Connection, and QueryResult

### Changed

- Make lazy iterators the default iteration pattern (breaking change)
- Rename `query()` to return `IterableIterator` instead of `RowData[]`
- `fetchAll()` and `fetchObjects()` return `IterableIterator` instead of array
- `accessMode` alias removed in favor of native `access_mode` config option
- DatabaseConfig now type-safe using DuckDB config schema
- Strict validation enabled by default

### Fixed

- Memory leak: free error buffer on `duckdb_open_ext` failure
- Large-count correctness: `rowCount` now returns `bigint` instead of `number`
- Config schema alignment with DuckDB documentation

### Removed

- Deprecated core functions
- Legacy stream.ts from functional API

## [1.1.13]

### Added

- JSDocs for all core modules
- Shared console helpers and SQL queries for examples

### Changed

- Remove sync variants and unused functions (`destroyResultSync`, `resetPreparedStatementSync`, etc.)
- File reorganization into categorized folders
- Optimized core result reading and string reading

### Removed

- Benchmark files

## [1.1.12]

### Fixed

- Memory leak in result handling

## [1.1.11]

### Changed

- Refactor examples with shared utilities and unified output style

## [1.1.10]

### Added

- Comprehensive JSDoc documentation for all public APIs

## [1.1.9]

### Changed

- Enforce functional/objective entrypoints

## [1.1.8]

### Changed

- JSDoc improvements

## [1.1.7]

### Changed

- JSDoc improvements

## [1.1.6]

### Changed

- JSDoc improvements

## [1.1.5]

### Changed

- JSDoc improvements

## [1.1.4]

### Changed

- File reorganization
- Data analysis example overhaul

## [1.1.3]

### Removed

- Deprecated core functions removed

## [1.1.2]

### Changed

- Remove benchmark files and optimize core result reading

## [1.1.1]

### Added

- Benchmarks for column info, row allocation, and string reading
- Complete functional API refactoring

## [1.1.0]

### Added

- Streaming with chunked fetching using LIMIT/OFFSET pagination
- `chunkSize` parameter for configurable chunk sizes
- `Symbol.dispose` support for automatic resource cleanup
- Result caching for queries under 10K rows

### Changed

- Refactor streaming and improve API consistency
- Change `execute` to `query`
- Remove arrow API (deprecated)

### Fixed

- Remove legacy `stream.ts` from functional API

## [1.0.8]

### Added

- DECIMAL type support (returned as bigint internal representation)
- Unsigned integer type support: UTINYINT, USMALLINT, UINTEGER, UBIGINT
- Microsecond time support
- Contract tests for validity functions, pointer values, prepared statement metadata
- Fail-fast tests for invalid handle inputs
- Index validation for columnName, columnType, and value getters

### Changed

- `accessMode` validation now lets DuckDB reject invalid values
- Boolean type consistency: returns JS boolean instead of 0/1 for BOOLEAN columns

### Fixed

- BOOLEAN type inconsistency
- Prepared statement binding state leakage
- DATE, TIME, TIMESTAMP decoder issues (stored as integers, not pointers)
- Segfault issues when fetching DATE/TIME/TIMESTAMP values
- QueryError parameter order
- String cache use-after-free
- Null mask handling for rows beyond first 64
- Bounds checking for value access functions

## [1.0.7]

### Changed

- Remove unnecessary async/await usage

## [1.0.6]

### Fixed

- QueryError params handling
- String cache use-after-free
- Null mask handling for rows beyond first 64

## [1.0.5]

### Fixed

- Validation issues
- Caching bugs
- Error handling improvements

## [1.0.4]

### Fixed

- Memory leak: free error buffer on `duckdb_open_ext` failure
- Unsafe null casting in pointerValueToObject
- Input validation for handles and SQL

## [1.0.3]

### Added

- Azure Storage and HTTP data examples
- Comprehensive bounds checking tests
- Prepared statement parameter binding edge case tests
- NULL value handling tests for typed getters
- GitHub Actions workflow for publishing

### Changed

- Remove Resource base class from objective API
- Improve error handling across APIs
- Refactor and enhance error handling across both functional and objective APIs

### Fixed

- Proper error message extraction when opening databases

## [1.0.2]

### Added

- Stream support for both functional and objective APIs
- Example files for functional and objective APIs
- Comprehensive examples demonstrating data analysis, data types, error handling
- Prepared statements, transactions, and auto-cleanup patterns

## [1.0.1]

### Added

- GitHub Actions workflow for publishing package

## [1.0.0]

### Added

- Initial release with stream support
- Functional and objective APIs for DuckDB
- Connection, prepared statement, and query result handling
- FFI binding to libduckdb
