# AGENTS.md - Guidelines for AI Agents

This file provides guidance for AI agents operating in this repository.

## Project Overview

This is a type-safe DuckDB FFI binding library for Deno. It wraps `@ggpwnkthx/libduckdb` and provides two distinct APIs for working with DuckDB databases.

### Version Compatibility (CRITICAL)

This library is **tightly coupled** to specific versions due to direct memory access assumptions:

| Dependency           | Version    | Notes                                     |
| -------------------- | ---------- | ----------------------------------------- |
| DuckDB               | **1.5.0**  | ABI/layout assumptions in result decoding |
| Deno                 | **2.0+**   | Requires FFI support                      |
| @ggpwnkthx/libduckdb | **1.0.15** | Pinned in `deno.json`                     |

**Do not upgrade** DuckDB or Deno without thorough testing. Even minor version upgrades may break result decoding due to changes in:

- Result struct layout (`duckdb_result` is 48 bytes)
- Column vector representation (string length + pointer format)
- Pointer size (assumes 64-bit)

## Build/Lint/Test Commands

```bash
# Run all tests
deno task test

# Run a single test file
deno test -A ./tests/functional_api.test.ts

# Type check the project
deno check

# Lint the project
deno lint

# Format the project
deno fmt

# Run benchmarks
deno task bench

# Run all examples
deno task examples

# Run CI pipeline (fmt + lint + check + test + examples)
deno task ci

# Cache dependencies
deno cache ./src/mod.ts
```

## Code Style Guidelines

### Formatting (from `deno.json`)

```json
{
  "lineWidth": 88,
  "indentWidth": 2,
  "useTabs": false,
  "semiColons": true,
  "singleQuote": false,
  "proseWrap": "preserve",
  "trailingCommas": "onlyMultiLine",
  "operatorPosition": "nextLine"
}
```

- Run `deno fmt` before committing
- Exclude: `libduckdb/**` and hidden files

### TypeScript

- **Strict mode enabled** (`strict: true` in `compilerOptions`)
- Use explicit return types on public functions
- Use `readonly` for immutable fields and arrays
- Use branded types (symbol-based) for handle type safety

### Imports

Organize imports in this order:

1. External JSR imports (`@std/assert`, `@ggpwnkthx/libduckdb`)
2. Internal type imports (`import type { ... }`)
3. Internal value imports (`import { ... } from "./..."`)

```ts
import type { ConnectionHandle } from "../types.ts";
import { DatabaseError } from "../errors.ts";
import { closeDatabase, connectToDatabase } from "../functional/mod.ts";
```

### Naming Conventions

- **Handles**: `DatabaseHandle`, `ConnectionHandle`, `ResultHandle`, `PreparedStatementHandle`
- **Classes**: PascalCase (`Database`, `Connection`, `ResultReader`)
- **Functions/variables**: camelCase (`openDatabase`, `closeConnection`, `queryObjects`)
- **Constants**: UPPER_SNAKE_CASE for module-level constants
- **Private fields**: Use `#fieldName` (class private fields)
- **Aliases**: Use descriptive aliases (e.g., `open` for `openDatabase`, `create` for `connectToDatabase`)

### Branded Handle Types

Uses unique symbol-based types to prevent mixing handles at compile time:

```ts
type Handle<ByteSize extends number, Brand extends string> = Uint8Array<ArrayBuffer> & {
  readonly __byteSize: ByteSize;
  readonly __brand: Brand;
};

export type DatabaseHandle = Handle<8, "DatabaseHandle">;
export type ConnectionHandle = Handle<8, "ConnectionHandle">;
export type ResultHandle = Handle<48, "ResultHandle">;
export type PreparedStatementHandle = Handle<8, "PreparedStatementHandle">;
```

### Error Handling

Custom error hierarchy in `src/errors.ts`:

```ts
// Base error
export class DuckDBError extends Error {
  readonly code: DuckDBErrorCode;
  readonly context?: ErrorContext;
}

// Database/connection/prepared-statement lifecycle failure
export class DatabaseError extends DuckDBError;

// Query text or execution failure
export class QueryError extends DuckDBError {
  readonly query: string;
}

// Attempted access to closed/invalid resource
export class InvalidResourceError extends DuckDBError;

// Invalid input provided to the wrapper
export class ValidationError extends DuckDBError;
```

Error codes: `"DATABASE_ERROR" | "QUERY_ERROR" | "INVALID_RESOURCE" | "VALIDATION_ERROR" | "LIBRARY_LOAD_FAILED"`

### Testing

Tests use `Deno.test()` with `@std/assert`:

```ts
Deno.test({
  name: "functional: description of the test",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // test code using withFunctionalConnection or withObjectiveConnection
    await withFunctionalConnection((connection) => {
      const result = functional.query(connection, "SELECT 1");
      assertEquals(result, null);
    });
  },
});
```

**Important**: `sanitizeResources: false` and `sanitizeOps: false` are required because Deno's resource sanitizer cannot track FFI-allocated resources (native pointers/memory from DuckDB). Resources are properly cleaned up in `finally` blocks.

Test utilities in `tests/utils.ts`:

- `withFunctionalConnection<T>(fn)` - Wraps database/connection lifecycle for functional API tests
- `withObjectiveConnection<T>(fn)` - Wraps database/connection lifecycle for objective API tests
- `execFunctional(connection, sql)` - Execute DDL/mutation via prepared statement
- `queryCachedRows(connection, sql)` - Execute SELECT and return rows
- `queryCachedObjects(connection, sql)` - Execute SELECT and return object rows
- `materializeResultRows(reader)` - Materialize lazy result as arrays
- `materializeResultObjects(reader)` - Materialize lazy result as objects

### Value Model

The wrapper returns:

- `boolean`, `number`, `bigint`, `string`, `null`
- `Uint8Array` for `BLOB`
- `{ months, days, micros }` for `INTERVAL`
- Complex types (DECIMAL, ENUM, UUID, BIT) returned as text via DuckDB's legacy value conversion

### Documentation

Use JSDoc with `@example`, `@throws`, `@param`, `@returns`, `@see`:

````ts
/**
 * Open a DuckDB database file or in-memory database.
 *
 * @param path - Optional database path (default: ":memory:" for in-memory database)
 * @param config - Optional database configuration including access mode
 * @returns A database handle for use in subsequent operations
 * @throws {DatabaseError} if the database cannot be opened
 *
 * @example
 * ```ts
 * const db = await openDatabase();
 * const db = await openDatabase("my.db");
 * ```
 */
export async function openDatabase(
  path?: string,
  config?: DatabaseOpenConfig,
): Promise<DatabaseHandle>;
````

### Resource Management

**Functional API**: Handles must be manually managed. Always close in `finally` blocks:

```ts
const db = await functional.open();
try {
  const conn = await functional.connectToDatabase(db);
  try {
    // use connection
  } finally {
    functional.closeConnection(conn);
  }
} finally {
  functional.closeDatabase(db);
}
```

**Objective API**: Supports `Symbol.dispose` for automatic cleanup:

```ts
using db = await Database.open();
using conn = await db.connect();
// Resources automatically cleaned up when exiting scope
```

### Dual API Architecture

The library exposes the same functionality through two APIs:

1. **Functional API** (`src/functional/mod.ts`): Pure functional style, explicit state passing
2. **Objective API** (`src/objective/mod.ts`): OOP with classes, automatic cleanup

Both APIs share the same core layer (`src/core/`).

## Project Structure

```
src/
├── mod.ts                    # Main entry point
├── types.ts                  # Shared types (handle types, value types)
├── errors.ts                 # Error hierarchy
├── functional/
│   ├── mod.ts                # Functional API exports
│   ├── native.ts             # Core FFI operations
│   ├── execution.ts          # Query execution helpers
│   └── value.ts              # Value decoding/iteration
├── objective/
│   ├── mod.ts                # Objective API exports
│   ├── database.ts           # Database class
│   ├── connection.ts         # Connection class
│   ├── query.ts              # Query result classes
│   ├── prepared.ts           # Prepared statement class
│   └── base.ts               # Base classes
└── core/
    ├── handles.ts            # Handle creation/validation
    ├── library.ts            # Library loading
    ├── strings.ts            # FFI string handling
    ├── validate.ts           # Input validation
    └── config/
        ├── mod.ts            # Config types
        ├── validate.ts       # Config validation
        ├── limits.ts         # Materialization limits
        └── schema/           # Config schema definitions
tests/
├── utils.ts                  # Test utilities
├── errors.test.ts            # Error handling tests
└── api/
    ├── functional.test.ts    # Functional API tests
    ├── objective.test.ts     # Objective API tests
    └── parity.test.ts        # API parity tests
benchmarks/                    # Performance benchmarks
examples/                      # Usage examples
libduckdb/                     # Native DuckDB library
```

## Required Permissions

Development requires:

- `--allow-ffi` - For loading native DuckDB library
- `--allow-read` - For reading the native library
- `--allow-env` - For environment variables

For auto-downloading the native library:

- `--allow-net` and `--allow-write`

## Common Pitfalls

1. **FFI handle size changes**: Never assume handle sizes. Changes in DuckDB version can break result decoding.

2. **Null pointer handling**: Always check for null pointers before dereferencing. Use `isValidHandle()` and `requireOpaqueHandle()`.

3. **Resource cleanup**: Always close handles in `finally` blocks. Memory from DuckDB is not managed by Deno's garbage collector.

4. **Validation errors**: These indicate bad input (programming errors), not recoverable runtime errors. They should not be caught and suppressed.

5. **Query failures in convenience methods**: The `query()` and `queryObjects()` convenience functions return `null` on failure (not just validation errors). Re-throw `ValidationError` but return `null` for other errors.
