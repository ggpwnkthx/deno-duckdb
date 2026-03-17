/**
 * Shared SQL for datatypes examples.
 */

export const CREATE_DATATYPES_TABLE = `
CREATE TABLE datatypes (
  id INTEGER,
  -- Integer types
  tiny_col TINYINT,
  small_col SMALLINT,
  int_col INTEGER,
  big_col BIGINT,
  huge_col HUGEINT,
  utiny_col UTINYINT,
  usmall_col USMALLINT,
  uint_col UINTEGER,
  ubig_col UBIGINT,
  uhuge_col UHUGEINT,
  -- Floating point
  float_col FLOAT,
  double_col DOUBLE,
  -- Temporal types
  date_col DATE,
  time_col TIME,
  ts_col TIMESTAMP,
  interval_col INTERVAL,
  -- Binary (stored as hex string due to BLOB reading limitations)
  blob_hex_col VARCHAR,
  -- Special types
  bool_col BOOLEAN,
  varchar_col VARCHAR
);
`;

export const INSERT_SAMPLE_DATA =
  "INSERT INTO datatypes VALUES (1, 127, 32767, 2147483647, 9223372036854775807, '170141183460469231731687303715884105727', 255, 65535, 4294967295, '18446744073709551615', '340282366920938463463374607431768211455', 3.14159, 3.141592653589793, '2024-03-15', '14:30:45', '2024-03-15 14:30:45.123456', INTERVAL '2 years 3 months 15 days 12:30:45', 'DEADBEEF', true, 'Sample text with special chars: hello world!')";

export const QUERY_ALL = "SELECT * FROM datatypes ORDER BY id";
