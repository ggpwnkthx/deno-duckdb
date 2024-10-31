import { DuckDBConfigurationKeys, rows } from "./src/helpers.ts";
import {
   close,
   connect,
   destroy_result,
   disconnect,
   library_version,
   open,
   query,
   column_count,
   column_name,
   column_type,
   result_return_type,
   result_statement_type
} from "./src/index.ts";

console.debug(`DuckDB Library Version: ${ library_version()}`);

// Open a connection to the database with configuration options
// Run console.debug(DuckDBConfigurationKeys) for all config keys
const db =  open("duck.db", {
  "max_memory": "1GB",
  "threads": "4"
});

// Connect to the database
const conn =  connect(db);

// Execute a query
const result =  query(conn, `
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
  statement_type:  result_statement_type(result),
  result_type:  result_return_type(result),
  columns: Array.from({ length: Number( column_count(result)) }, (_, i) => ({
    name:  column_name(result, i),
    type:  column_type(result, i)
  }))
}
console.debug({ metadata })

// Extract and display the data from the result
const data = rows(result).toArray();
console.debug({ data });

// Clean up resources
destroy_result(result);
disconnect(conn);
close(db);
