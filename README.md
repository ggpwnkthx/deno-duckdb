# @ggpwnkthx/duckdb

Type-safe DuckDB FFI bindings for Deno with both functional and object-oriented APIs.

## Installation

```ts
import * as functional from "jsr:@ggpwnkthx/duckdb@1.1.1/functional";
import { Database } from "jsr:@ggpwnkthx/duckdb@1.1.1/objective";
```

## Dual APIs

This library provides two distinct APIs for working with DuckDB:

### Functional API

Pure functional style with explicit state passing. Handles must be manually managed and
destroyed.

```ts
import * as functional from "jsr:@ggpwnkthx/duckdb@1.1.1/functional";

const db = await functional.open();
const conn = await functional.create(db);

try {
  const result = functional.query(conn, "SELECT 42 AS answer");
  try {
    console.log(functional.fetchObjects(result));
  } finally {
    functional.destroyResult(result);
  }
} finally {
  functional.closeConnection(conn);
  functional.closeDatabase(db);
}
```

### Objective API

Object-oriented API with classes that encapsulate DuckDB handles. Supports
`Symbol.dispose` for automatic cleanup.

```ts
import {
  Connection,
  Database,
  QueryResult,
} from "jsr:@ggpwnkthx/duckdb@1.1.1/objective";

using db = await Database.open();
using conn = await db.connect();

const result = await conn.query("SELECT 42 AS answer");
console.log(result.toArrayOfObjects());
// Result automatically cleaned up when it goes out of scope
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

Both APIs support lazy row iteration for handling large query results without loading
all into memory:

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

The `ResultReader` class caches column metadata for efficient repeated access. Both APIs
cache results when using methods like `fetchAll()` or `toArrayOfObjects()`.

### Config Normalization

User-friendly config options are normalized to DuckDB's expected names:

```ts
// These are equivalent:
Database.open({ accessMode: "read_only" });
Database.open({ access_mode: "read_only" });
```

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
import { QueryError } from "jsr:@ggpwnkthx/duckdb@1.1.1/functional";

try {
  functional.query(conn, "INVALID SQL");
} catch (e) {
  if (e instanceof QueryError) {
    console.log(`Query failed: ${e.message}`);
    console.log(`Query: ${e.query}`);
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

## Development

```sh
deno task check
deno task test
deno task ci
```
