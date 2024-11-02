# DuckDB CAPI Wrapper for Deno
A TypeScript library to enable interaction with [DuckDB](https://duckdb.org/), optimized for [Deno 2.0](https://deno.com/) and built with a functional programming approach. This project provides an interface to DuckDB through a low-level, synchronous API, supporting fundamental operations for embedding SQL-based analytical processing directly within your Deno application.

## Features
- **Low-Level C API Access**: Enables high-performance, synchronous operations directly with DuckDB.
- **Cross-platform Support**: Automated fetching and loading of DuckDB libraries based on OS and architecture.
- **Functional Programming**: Built with functional patterns to maintain readability and performance.
- **Streamlined Query Processing**: Easily handle large query results through chunked data retrieval with the `DuckDB.rows` generator.

## Getting Started

### Installation
To use Deno DuckDB, import it directly from this repository:
```typescript
import DuckDB from "https://raw.githubusercontent.com/ggpwnkthx/deno-duckdb/main/mod.ts";
```

### Permissions
This module requires the following permissions to operate:
- `--allow-net` for fetching DuckDB binary.
- `--allow-write` for saving the DuckDB binary.
- `--allow-read` for reading local DuckDB files.
- `--allow-ffi` for using the Foreign Function Interface.
Run your application as follows:
```bash
deno run --allow-net --allow-write --allow-read --allow-ffi your_script.ts
```

### Example Usage
The following example demonstrates connecting to DuckDB, executing a query, and processing the results.
```typescript
import DuckDB from "https://raw.githubusercontent.com/ggpwnkthx/deno-duckdb/main/mod.ts";

const db = DuckDB.open()
const conn = DuckDB.connect(db);
const result = DuckDB.query(conn, `SELECT 42 AS answer`)

console.log(DuckDB.rows(result).toArray());

DuckDB.destroy_result(result);
DuckDB.disconnect(conn);
DuckDB.close(db);
```

### Advanced Configuration
The `DuckDB.open` function allows setting DuckDB configuration options, for example memory allocation and threading:
```typescript
const db = DuckDB.open("path/to/duck.db", {
  max_memory: "1GB",
  threads: "4",
});
```
To see available configuration options, use:
```typescript
console.debug(get_config_flags());
```

## API Reference
- `DuckDB.open(path, {config})`: Opens a new DuckDB instance, optionally accepting a path to a DuckDB file and configuration options.
- `DuckDB.connect(db)`: Establishes a connection to a specified DuckDB instance.
- `DuckDB.query(conn, query)`: Executes a SQL query.
- `DuckDB.rows(result)`: A generator function to iterate through rows in a result set.
- `DuckDB.destroy_result(result)`: Cleans up memory used to store query result.
- `DuckDB.disconnect(conn)`: Closes the connection to the DuckDB instance.
- `DuckDB.close(db)`: Closes the DuckDB instance.
For a complete list of functions and configuration options, refer to the `src/index.ts` file.

## Development
This project is structured with modularity in mind, allowing contributions focused on isolated components. The project includes a DevContainer configuration for a consistent development environment. It installs necessary dependencies

## Contributions
You can contribute by adding new functionality, improving the API, or optimizing the DuckDB integration.
1. Fork the repository
2. Create your feature branch `git checkout -b feature/AmazingFeature`
3. Commit your changes `git commit -m 'Add some AmazingFeature'`
4. Push to the branch `git push origin feature/AmazingFeature`
5. Open a Pull Request

## License
Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgments
Thanks to the Deno and DuckDB communities for their ongoing support and contributions to open-source technologies.