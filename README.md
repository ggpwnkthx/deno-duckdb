# @ggpwnkthx/duckdb

Type-safe DuckDB functional and object-oriented APIs.

## Version Compatibility

> **Important:** This library is tightly coupled to specific DuckDB and Deno versions.
> It is **not guaranteed to work** with other versions.

| Dependency           | Version    | Notes                                     |
| -------------------- | ---------- | ----------------------------------------- |
| DuckDB               | **1.5.0**  | ABI/layout assumptions in result decoding |
| Deno                 | **1.46+**  | Requires FFI support                      |
| @ggpwnkthx/libduckdb | **1.0.15** | Pinned in `deno.json`                     |

This library uses direct memory access for high-performance result decoding. It makes
assumptions about DuckDB's internal memory layout (pointer sizes, struct sizes, column
vector formats). These assumptions are **only guaranteed for the versions above**.

**Do not upgrade** DuckDB or Deno without testing thoroughly first. Even minor version
upgrades may break result decoding due to changes in:

- Result struct layout (`duckdb_result` is 48 bytes)
- Column vector representation (string length + pointer format)
- Pointer size (assumes 64-bit)

---

> **Note:** While this library is stable and production-ready, I haven't fully settled on a
> consistent function naming pattern yet. This will be normalized in a future major version.
>
> Starting with version 1.2.0, this project will adhere to **semantic versioning**:
>
> - **MAJOR** (x.0.0) - Breaking changes to the public API
> - **MINOR** (1.x.0) - New features (backward-compatible)
> - **PATCH** (1.2.x) - Bug fixes (backward-compatible)

## Installation

```ts
import * as functional from "jsr:@ggpwnkthx/duckdb/functional";
import { Database } from "jsr:@ggpwnkthx/duckdb/objective";
```

## Dual APIs

This library provides two distinct APIs for working with DuckDB:

### Functional API

Pure functional style with explicit state passing. Handles must be manually managed and
destroyed.

```ts
import * as functional from "jsr:@ggpwnkthx/duckdb/functional";

const db = await functional.open();
const conn = await functional.create(db);

try {
  // Eager - get all rows as objects
  const rows = functional.queryObjects(conn, "SELECT 42 AS answer");
  console.log([...rows]);
} finally {
  functional.closeConnection(conn);
  functional.closeDatabase(db);
}
```

### Objective API

Object-oriented API with classes that encapsulate DuckDB handles. Supports
`Symbol.dispose` for automatic cleanup.

```ts
import { Database } from "jsr:@ggpwnkthx/duckdb/objective";

using db = await Database.open();
using conn = await db.connect();

// Eager - get all rows as objects
const rows = conn.queryObjects("SELECT 42 AS answer");
console.log(rows);
// Resources automatically cleaned up when exiting scope
```

## Architecture

The library uses a three-layer architecture:

- **Core Layer** (`src/core/`) - Internal shared FFI operations (database, connection,
  query, prepared statements)
- **Functional API** (`src/functional/`) - Pure functional style with explicit state
  passing
- **Objective API** (`src/objective/`) - Object-oriented classes with automatic cleanup

## Key Features

### Lazy Iteration

Both APIs support lazy row iteration that decodes rows on-demand from an in-memory
result buffer. Note that while row decoding is lazy (rows are decoded only when iterated),
DuckDB itself materializes the full result set in memory when the query executes - this
library does not provide streaming execution.

**Functional API:**

```ts
for (const row of functional.iterateRows(result)) {
  console.log(row);
}

for (const obj of functional.iterateObjects(result)) {
  console.log(obj);
}
```

**Objective API:**

```ts
for (const row of result.rows()) {
  console.log(row);
}

for (const obj of result.objects()) {
  console.log(obj);
}
```

### Result Caching

The `ResultReader` class caches column metadata for efficient repeated access.

### Config Normalization

User-friendly config options are normalized to DuckDB's expected names:

```ts
// Use the native DuckDB config option name:
Database.open(undefined, { access_mode: "READ_ONLY" });
```

### Type-Safe Configuration

The `DatabaseConfig` type is derived from DuckDB's config schema, providing autocomplete
and type safety for all known configuration options:

```ts
import { Database } from "jsr:@ggpwnkthx/duckdb/objective";

// TypeScript provides autocomplete for known config options:
const db = await Database.open(undefined, {
  access_mode: "READ_ONLY", // Restricted to "AUTOMATIC" | "READ_ONLY" | "READ_WRITE"
  threads: 4n, // bigint
  max_memory: "8GB", // string
  enable_http_metadata_cache: true, // boolean
});
```

Each config option has a proper TypeScript type based on the DuckDB schema:

- **Boolean options** - `boolean` type
- **Enum options** - Specific union type of valid values
- **Integer/Double options** - `number` type
- **BigInt options** - `bigint` type
- **String options** - `string` type
- **String array options** - `readonly string[]` type

The config also supports unknown keys for extensibility via `[key: string]: unknown`.

### Branded Handle Types

The library uses unique symbol-based types to prevent mixing handles at compile time:

- `DatabaseHandle` - Database instance
- `ConnectionHandle` - Connection to a database
- `ResultHandle` - Query result
- `PreparedStatementHandle` - Prepared statement

### Symbol.dispose Support

The objective API supports automatic resource cleanup using `Symbol.dispose`:

```ts
using db = await Database.open();
using conn = await db.connect();
// Resources automatically cleaned up when exiting scope
```

## Value Model

The wrapper returns the following JavaScript value types:

- booleans, numbers, bigints, strings, `null`
- `Uint8Array` for `BLOB`
- `{ months, days, micros }` for `INTERVAL`

Notes:

- `DECIMAL`, `ENUM`, `UUID`, `BIT`, and other complex/legacy-awkward values are returned
  as exact text through DuckDB's legacy value conversion helpers.
- This avoids silent precision loss while keeping the public API simple and
  serializable.

## Error Handling

The library provides a custom error hierarchy:

- `DuckDBError` - Base error class
- `DatabaseError` - Database operation errors (connection, creation)
- `QueryError` - Query execution errors
- `InvalidResourceError` - Invalid handle errors
- `ValidationError` - Input validation errors

```ts
import { executeSqlResult, query } from "jsr:@ggpwnkthx/duckdb/functional";
import { QueryError } from "jsr:@ggpwnkthx/duckdb";

// Convenience method - returns null on query failure
const result = query(conn, "SELECT * FROM nonexistent");
if (result === null) {
  console.log("Query failed");
} else {
  console.log("Query succeeded with", result.length, "rows");
}

// Lower-level method - throws QueryError on failure
try {
  const result = executeSqlResult(conn, "INVALID SQL");
  // ... use result
} catch (e) {
  if (e instanceof QueryError) {
    console.log(`Query failed: ${e.message}`);
  }
}
```

## Permissions

Typical dev/test usage requires:

- `--allow-ffi`
- `--allow-read`
- `--allow-env`

If the native DuckDB library is not already present, the low-level loader may
auto-download it. In that case you may also need:

- `--allow-net`
- `--allow-write`
