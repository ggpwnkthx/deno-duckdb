import { DuckDBConfigurationKeys, rows } from "./src/helpers.ts";
import {
  duckdb_close,
  duckdb_connect,
  duckdb_destroy_result,
  duckdb_disconnect,
  duckdb_library_version,
  duckdb_open,
  duckdb_query,
  duckdb_column_count,
  duckdb_column_name,
  duckdb_column_type,
  duckdb_result_return_type,
  duckdb_result_statement_type
} from "./src/index.ts";

console.debug(`DuckDB Library Version: ${duckdb_library_version()}`);

// Open a connection to the database with configuration options
// Run console.debug(DuckDBConfigurationKeys) for all config keys
const db = duckdb_open("duck.db", {
  "max_memory": "1GB",
  "threads": "4"
});

// Connect to the database
const conn = duckdb_connect(db);

// Execute a query
const result = duckdb_query(conn, `
  SELECT
    hash(i * 10 + j) AS id1,
    IF (j % 2, true, false) AS bool,
    CONCAT(i, ' this is a string') AS short_string,
    hash(j * 10 + i) AS id2
  FROM generate_series(1, 10000) s(i)
  CROSS JOIN generate_series(1, 10) t(j)
  ORDER BY id1
`);

// Get meta data from the results
const metadata = {
  statement_type: duckdb_result_statement_type(result),
  result_type: duckdb_result_return_type(result),
  columns: Array.from({ length: Number(duckdb_column_count(result)) }, (_, i) => ({
    name: duckdb_column_name(result, i),
    type: duckdb_column_type(result, i)
  }))
}
console.debug({ metadata })

// Extract and display the data from the result
const data = rows(result).toArray();
console.debug({ data });

// Clean up resources
duckdb_destroy_result(result);
duckdb_disconnect(conn);
duckdb_close(db);
