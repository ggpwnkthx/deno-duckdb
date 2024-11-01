import { rows } from "./src/helpers.ts";
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
   result_statement_type,
   get_config_flags,
} from "./src/index.ts";

console.debug(`DuckDB Library Version: ${ library_version()}`);

// Complete list of configuration options:
// console.debug(get_config_flags())

// Open a connection to the database with configuration options
const db =  open("duck.db", {
  "max_memory": "1GB",
  "threads": "4"
});

// Connect to the database
const conn =  connect(db);

// Execute a query
const result = query(conn, `
  SELECT
    IF (j % 2, TRUE, FALSE) AS bool,                      -- BOOLEAN
    CONCAT(i, ' this is a string') AS string,             -- VARCHAR (string)
    i::TINYINT AS tiny_int,                               -- TINYINT
    j::SMALLINT AS small_int,                             -- SMALLINT
    (hash(i * 10 + j) % 9223372036854775807) AS big_int,                  -- BIGINT
    (i / NULLIF(j, 0))::FLOAT AS float_val,               -- FLOAT
    (i / NULLIF(j, 0))::DOUBLE AS double_val,             -- DOUBLE
    DATE '2024-01-01' + (j * INTERVAL '1 day') AS date,   -- DATE
    TIME '12:34:56' + (i * INTERVAL '1 second') AS time,  -- TIME
    TIMESTAMP '2024-01-01 12:00:00' + (j * INTERVAL '1 second') AS timestamp, -- TIMESTAMP
    to_hex(hash(i * j)) AS blob_val,                          -- BLOB (hexadecimal string representation)
    INTERVAL '1 day' * j AS interval_val                      -- INTERVAL
  FROM generate_series(1, 100) s(i)
  CROSS JOIN generate_series(1, 5) t(j)
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
