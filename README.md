# @ggpwnkthx/duckdb

Type-safe DuckDB FFI bindings for Deno with both functional and object-oriented APIs.

## What changed in this refactor

This production pass fixes the biggest correctness and API issues in the earlier version:

- exact decimal values are surfaced as strings instead of requiring `CAST(... AS DOUBLE)` in user SQL
- `BLOB` values are decoded as `Uint8Array`
- string/blob decoding now respects DuckDB's `duckdb_string_t` layout instead of assuming C strings
- `queryTyped()` no longer uses an unsafe generic cast
- integer binding rejects unsafe JavaScript integers instead of silently losing precision
- library caching is keyed by `libPath` instead of using one global singleton for every path
- the public package entry point now uses relative exports instead of self-importing through its own JSR name

## Installation

```ts
import * as functional from "jsr:@ggpwnkthx/duckdb@2.0.0/functional";
import { Database } from "jsr:@ggpwnkthx/duckdb@2.0.0/objective";
```

## Permissions

Typical dev/test usage requires:

- `--allow-ffi`
- `--allow-read`
- `--allow-env`

If the native DuckDB library is not already present, the low-level loader may auto-download it. In that case you may also need:

- `--allow-net`
- `--allow-write`

## Quick start

```ts
import * as functional from "jsr:@ggpwnkthx/duckdb@2.0.0/functional";

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

## Value model

The wrapper returns the following JavaScript value types:

- booleans, numbers, bigints, strings, `null`
- `Uint8Array` for `BLOB`
- `{ months, days, micros }` for `INTERVAL`

Notes:

- `DECIMAL`, `ENUM`, `UUID`, `BIT`, and other complex/legacy-awkward values are returned as exact text through DuckDB's legacy value conversion helpers.
- This avoids silent precision loss while keeping the public API simple and serializable.

## Development

```sh
deno task check
deno task test
deno task ci
```
