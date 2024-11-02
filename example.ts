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
    TRUE AS bool_col,                                                                 -- BOOLEAN
    'Sample Text' AS varchar_col,                                                     -- VARCHAR
    42::TINYINT AS tinyint_col,                                                       -- TINYINT
    1000::SMALLINT AS smallint_col,                                                   -- SMALLINT
    123456::INTEGER AS integer_col,                                                   -- INTEGER
    9223372036854775807::BIGINT AS bigint_col,                                        -- BIGINT
    3.1415926535897932384626433832795028841971::FLOAT AS float_col,                   -- FLOAT
    3.1415926535897932384626433832795028841971::DOUBLE AS double_col,                 -- DOUBLE
    3.1415926535897932384626433832795028841971::DECIMAL(4, 3) AS small_decimal_col,   -- DECIMAL
    3.1415926535897932384626433832795028841971::DECIMAL(9, 8) AS decimal_col,         -- DECIMAL
    3.1415926535897932384626433832795028841971::DECIMAL(16, 15) AS big_decimal_col,   -- DECIMAL
    -3.1415926535897932384626433832795028841971::DECIMAL(38, 37) AS huge_decimal_col, -- DECIMAL
    DATE '2010-10-01' AS date_col,                                                    -- DATE
    TIME '12:34:56' AS time_col,                                                      -- TIME
    TIMESTAMP '2024-01-01 12:00:00' AS timestamp_col,                                 -- TIMESTAMP
    INTERVAL '2 days' AS interval_col,                                                -- INTERVAL
    uuid() AS uuid_col,                                                               -- UUID
    --to_hex(hash(12345)) AS blob_col,                                                  -- BLOB
    --ARRAY[1, 2, 3] AS list_col,                                                       -- LIST
    --MAP(['key1', 'key2'], ['value1', 'value2']) AS map_col,                           -- MAP
    --'Simple Enum'::ENUM('Simple Enum', 'Another Enum') AS enum_col                    -- ENUM
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
