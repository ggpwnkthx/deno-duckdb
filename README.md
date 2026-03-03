# deno-duckdb
[![JSR](https://jsr.io/badges/@ggpwnkthx/duckdb)](https://jsr.io/@ggpwnkthx/duckdb)

Type-safe DuckDB FFI bindings for Deno. Wraps [`@ggpwnkthx/libduckdb`](https://jsr.io/@ggpwnkthx/libduckdb) with two
distinct APIs for working with DuckDB databases.

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
- [![DuckDB](https://img.shields.io/badge/DuckDB-1.4.4-fff?style=flat&logo=duckdb)](https://www.duckdb.org/)

## Quick Start

### Functional API

Pure functional style with explicit state passing:

```typescript
import {
  closeDatabase,
  closeConnection,
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
await result.close();
await conn.close();
await db.close();
```

## API Overview

This library provides two parallel APIs that wrap the same underlying DuckDB FFI
calls:

### Functional API (`jsr:@ggpwnkthx/duckdb/functional`)

Pure functional style with explicit state management. Functions return result
objects containing handles that must be manually managed and destroyed.

**Entry point:** `src/functional/mod.ts`

**Exports:**

- `open` - Open a database (auto-loads library)
- `closeDatabase` - Close a database
- `create` - Create a connection
- `closeConnection` - Close a connection
- `execute` - Execute a query
- `prepare` - Prepare a statement
- `executePrepared` - Execute a prepared statement
- `fetchAll` - Fetch all rows from a result
- `destroyResult` - Destroy a result handle

### Objective API (`jsr:@ggpwnkthx/duckdb/objective`)

Object-oriented API with classes that encapsulate DuckDB handles and provide
automatic resource management.

**Entry point:** `src/objective/mod.ts`

**Classes:**

- `Database` - Represents a DuckDB database
- `Connection` - Represents a database connection
- `QueryResult` - Represents a query result set
- `PreparedStatement` - Represents a prepared SQL statement

## Key Features

- **Type-safe** - Full TypeScript type definitions
- **Two APIs** - Choose between functional or object-oriented style
- **Auto-loading** - Library loads automatically on first use
- **Automatic cleanup** - Objective API handles resource management
- **DuckDB 1.4.4** - Latest stable DuckDB support

## Testing

```bash
# Run all tests
deno test -A

# Run a single test file
deno test -A path/to/test.ts
```

## License

MIT
