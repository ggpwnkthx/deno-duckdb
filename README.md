# @ggpwnkthx/duckdb

Type-safe DuckDB FFI binding library for Deno.

## Version Compatibility

> **Important:** This library is tightly coupled to specific DuckDB and Deno versions.
> It is **not guaranteed to work** with other versions.

| Dependency           | Version    | Notes                                     |
| -------------------- | ---------- | ----------------------------------------- |
| DuckDB               | **1.5.5**  | ABI/layout assumptions in result decoding |
| Deno                 | **2.0+**   | Requires FFI support                      |
| @ggpwnkthx/libduckdb | **1.0.17** | Pinned in `deno.jsonc`                    |

The library uses direct memory access for high-performance result decoding and makes assumptions about DuckDB's internal memory layout. These assumptions are **only guaranteed for the versions above**. Do not upgrade DuckDB or `@ggpwnkthx/libduckdb` without thorough testing.

## Installation

```ts
import * as functional from "jsr:@ggpwnkthx/duckdb/functional";
import { Database } from "jsr:@ggpwnkthx/duckdb/objective";
```

Or via `deno.json` import map:

```jsonc
{
  "imports": {
    "@ggpwnkthx/duckdb/functional": "jsr:@ggpwnkthx/duckdb@1.2.0/functional",
    "@ggpwnkthx/duckdb/objective": "jsr:@ggpwnkthx/duckdb@1.2.0/objective"
  }
}
```

## Quick Start — Functional API

Pure functions; handles are managed manually.

```ts
import * as functional from "jsr:@ggpwnkthx/duckdb/functional";

const db = await functional.open();
const conn = await functional.connectToDatabase(db);
try {
  const rows = functional.queryObjects(conn, "SELECT 42 AS answer");
  console.log(rows);
} finally {
  functional.closeConnection(conn);
  functional.closeDatabase(db);
}
```

## Quick Start — Objective API

Classes with `Symbol.dispose` for automatic cleanup.

```ts
import { Database } from "jsr:@ggpwnkthx/duckdb/objective";

using db = await Database.open();
using conn = await db.connect();
const rows = conn.queryObjects("SELECT 42 AS answer");
console.log(rows);
```

## Value Model

DuckDB values surface as the following JavaScript types:

| DuckDB type                                  | JS value                                           |
| -------------------------------------------- | -------------------------------------------------- |
| `BOOLEAN`                                    | `boolean`                                          |
| `TINYINT..DOUBLE`                            | `number`                                           |
| `HUGEINT`, `UBIGINT`                         | `bigint`                                           |
| `VARCHAR`                                    | `string`                                           |
| `BLOB`                                       | `Uint8Array`                                       |
| `DATE`                                       | `string` (`YYYY-MM-DD`)                            |
| `TIME`                                       | `string` (`HH:MM:SS[.ffffff]`)                     |
| `TIMESTAMP[*]`                               | `string` (ISO with µs precision)                   |
| `INTERVAL`                                   | `{ months: number, days: number, micros: bigint }` |
| `UUID`, `BIT`, `ENUM`, `DECIMAL`, extensions | `string` (DuckDB legacy text conversion)           |
| `NULL`                                       | `null`                                             |

`DECIMAL`/`ENUM`/`UUID`/`BIT` and other complex types are returned as exact text
via DuckDB's legacy value conversion helpers. This avoids silent precision loss
while keeping the public API simple and serializable.

## Error Hierarchy

All errors extend `DuckDBError` (which extends `Error`) and carry a `code`:

| Class                  | `code`             | When                                                                     |
| ---------------------- | ------------------ | ------------------------------------------------------------------------ |
| `DuckDBError`          | (varies)           | Base class. `LIBRARY_LOAD_FAILED` is used for FFI load failures.         |
| `DatabaseError`        | `DATABASE_ERROR`   | Database / connection / prepared-statement lifecycle.                    |
| `QueryError`           | `QUERY_ERROR`      | Query text or execution failure (incl. `SET` failures from `setConfig`). |
| `InvalidResourceError` | `INVALID_RESOURCE` | Access to a closed / invalid resource.                                   |
| `ValidationError`      | `VALIDATION_ERROR` | Invalid input (unknown config keys, empty SQL, etc.).                    |

## Permissions

Typical dev/test usage requires `--allow-ffi`, `--allow-read`, `--allow-env`.
If the native library must be auto-downloaded, also `--allow-net` and
`--allow-write`.

## Links

- [GitHub repo](https://github.com/ggpwnkthx/deno-duckdb)
- [JSR package](https://jsr.io/@ggpwnkthx/duckdb)
- [Wiki — full API reference, configuration catalog, value-decoding details, examples index](https://github.com/ggpwnkthx/deno-duckdb/wiki)
- [Examples](./examples/) — getting-started, configuration, analytics, data-types, cloud
- [Benchmarks](./benchmarks/) — run with `deno task bench`
- [CHANGELOG.md](./CHANGELOG.md)
- [LICENSE](./LICENSE) (MIT)
