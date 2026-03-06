[![JSR](https://jsr.io/badges/@ggpwnkthx/duckdb)](https://jsr.io/@ggpwnkthx/duckdb)

Type-safe DuckDB FFI bindings for Deno. Wraps
[`@ggpwnkthx/libduckdb`](https://jsr.io/@ggpwnkthx/libduckdb) with two distinct
APIs for working with DuckDB databases.

## Installation

```bash
deno add jsr:@ggpwnkthx/duckdb
```

Or import directly in your code:

```typescript
import { ... } from "jsr:@ggpwnkthx/duckdb";
import { ... } from "jsr:@ggpwnkthx/duckdb/functional";
import { ... } from "jsr:@ggpwnkthx/duckdb/objective";
```

## Requirements

- [![Deno](https://img.shields.io/badge/deno-2.0+-fff?style=flat&logo=deno)](https://deno.land)
- DuckDB (version determined by `@ggpwnkthx/libduckdb`)

## Quick Start

### Functional API

Pure functional style with explicit state passing:

```typescript
import {
  closeConnection,
  closeDatabase,
  create,
  destroyResult,
  execute,
  fetchAll,
  open,
} from "jsr:@ggpwnkthx/duckdb/functional";

// Library loads automatically on first use
const db = await open();
const conn = await create(db);
const resultHandle = await execute(conn, "SELECT * FROM t");
const rows = await fetchAll(resultHandle);
await destroyResult(resultHandle);
await closeConnection(conn);
await closeDatabase(db);
```

### Objective API

Classes with encapsulated handles and automatic resource management:

```typescript
import { Database } from "jsr:@ggpwnkthx/duckdb/objective";

// Library loads automatically on first use
const db = new Database();
await db.open();
const conn = await db.connect();
const result = await conn.query("SELECT * FROM t");
const rows = await result.fetchAll();
result.close();
conn.close();
db.close();
```

Or use `Symbol.dispose` for automatic cleanup:

```typescript
import { Database } from "jsr:@ggpwnkthx/duckdb/objective";

using db = new Database();
await db.open();
using conn = await db.connect();
const result = await conn.query("SELECT * FROM t");
const rows = await result.fetchAll();
// Auto-cleanup at end of scope
```

## API Overview

This library provides two parallel APIs that wrap the same underlying DuckDB FFI
calls:

### Functional API (`jsr:@ggpwnkthx/duckdb/functional`)

Pure functional style with explicit state management. Functions return result
objects containing handles that must be manually managed and destroyed.

**Entry point:** `src/functional/mod.ts`

**Database functions:**

- `open` - Open a database (auto-loads library)
- `closeDatabase` - Close a database
- `isValidDatabase` - Check if database handle is valid
- `getPointerValue` - Get database pointer value

**Connection functions:**

- `create` - Create a connection
- `closeConnection` - Close a connection
- `isValidConnection` - Check if connection handle is valid
- `getPointerValueConnection` - Get connection pointer value

**Query functions:**

- `execute` - Execute a query
- `rowCount` - Get number of rows in result
- `columnCount` - Get number of columns in result
- `columnName` - Get column name by index
- `columnType` - Get column type by index
- `columnInfos` - Get all column information
- `destroyResult` - Destroy a result handle (async)
- `destroyResultSync` - Destroy a result handle (sync)

**Prepared statement functions:**

- `prepare` - Prepare a SQL statement
- `executePrepared` - Execute a prepared statement
- `preparedColumnCount` - Get column count for prepared statement
- `preparedParameterCount` - Get parameter count for prepared statement
- `bind` - Bind parameters to prepared statement
- `destroyPrepared` - Destroy prepared statement (async)
- `destroyPreparedSync` - Destroy prepared statement (sync)

**Value extraction functions:**

- `fetchAll` - Fetch all rows from a result
- `isNull` - Check if value at row/col is NULL
- `getInt32` - Get INT32 value
- `getInt64` - Get INT64 value
- `getDouble` - Get DOUBLE value
- `getString` - Get VARCHAR value
- `getValueByType` - Get value by DuckDB type

**Lazy iteration:**

- `stream` - Iterate over rows from query lazily

### Objective API (`jsr:@ggpwnkthx/duckdb/objective`)

Object-oriented API with classes that encapsulate DuckDB handles and provide
automatic resource management. Supports `Symbol.dispose` for automatic cleanup.

**Entry point:** `src/objective/mod.ts`

**Classes:**

- `Database` - Represents a DuckDB database
- `Connection` - Represents a database connection
- `QueryResult` - Represents a query result set
- `PreparedStatement` - Represents a prepared SQL statement

**Types:**

- `Disposable` - Interface for explicit resource cleanup
- `RowStream` - Type for lazy iteration row results

**Error classes:**

- `DuckDBError` - Base error class
- `DatabaseError` - Database operation errors
- `QueryError` - Query execution errors
- `InvalidResourceError` - Invalid handle errors

## Key Features

- **Type-safe** - Full TypeScript type definitions
- **Two APIs** - Choose between functional or object-oriented style
- **Auto-loading** - Library loads automatically on first use
- **Automatic cleanup** - Objective API handles resource management
- **Symbol.dispose support** - Use `using` keyword for automatic cleanup
- **Lazy iteration** - Iterate over large query results without loading all into
  memory

## Testing

```bash
# Run all tests
deno test -A

# Run a single test file
deno test -A path/to/test.ts
```

## License

MIT
