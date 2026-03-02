# deno-duckdb

Type-safe DuckDB FFI bindings for Deno. Wraps `@ggpwnkthx/libduckdb` with two distinct APIs for working with DuckDB databases.

[![Deno](https://img.shields.io/badge/deno-1.4+-ffffff?style=flat&logo=deno)](https://deno.land)
[![DuckDB](https://img.shields.io/badge/DuckDB-1.4.4-fff?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNGN0UwMCI+PHBhdGggZD0iTTEwIDJoMTJ2MTBIMTBWMlpNMTIgNEg4djJoNHYyaDR2NEgxMnYtMmg0VjRoOHYzSDI0djEyaC04VjZoOHYyaC00VjhoOHYtMmg4VjR6Ii8+PC9zdmc+)

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

- Deno 1.40+
- DuckDB 1.4.4

## Quick Start

### Functional API

Pure functional style with explicit state passing:

```typescript
import { load } from "jsr:@ggpwnkthx/libduckdb";
import { open, close, create, close as closeConn, execute, destroy, fetchAll } from "jsr:@ggpwnkthx/duckdb/functional";

const lib = await load();
const { handle: db } = open(lib);
const { handle: conn } = create(lib, db);
const result = execute(lib, conn, "SELECT * FROM t");
const rows = fetchAll(lib, result.handle);
destroy(lib, result.handle);
closeConn(lib, conn);
close(lib, db);
```

### Objective API

Classes with encapsulated handles and automatic resource management:

```typescript
import { load } from "jsr:@ggpwnkthx/libduckdb";
import { Database } from "jsr:@ggpwnkthx/duckdb/objective";

const lib = await load();
const db = new Database(lib);
const conn = db.connect();
const result = conn.query("SELECT * FROM t");
const rows = result.fetchAll();
result.free();
conn.close();
db.close();
```

## API Overview

This library provides two parallel APIs that wrap the same underlying DuckDB FFI calls:

### Functional API (`jsr:@ggpwnkthx/duckdb/functional`)

Pure functional style with explicit state management. Functions return result objects containing handles that must be manually managed and destroyed.

**Entry point:** `src/functional/mod.ts`

**Exports:**
- `open` - Open a database
- `close` - Close a database
- `create` - Create a connection
- `close` (aliased) - Close a connection
- `execute` - Execute a query
- `prepare` - Prepare a statement
- `executePrepared` - Execute a prepared statement
- `fetchAll` - Fetch all rows from a result
- `fetchRow` - Fetch a single row
- `destroy` - Destroy a result handle

### Objective API (`jsr:@ggpwnkthx/duckdb/objective`)

Object-oriented API with classes that encapsulate DuckDB handles and provide automatic resource management.

**Entry point:** `src/objective/mod.ts`

**Classes:**
- `Database` - Represents a DuckDB database
- `Connection` - Represents a database connection
- `QueryResult` - Represents a query result set
- `PreparedStatement` - Represents a prepared SQL statement

## Key Features

- **Type-safe** - Full TypeScript type definitions
- **Two APIs** - Choose between functional or object-oriented style
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
