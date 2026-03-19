/**
 * Benchmark type decoding performance for each DuckDB data type.
 *
 * Tests:
 * - Integer types: TINYINT, SMALLINT, INTEGER, BIGINT
 * - Floating point: FLOAT, DOUBLE
 * - VARCHAR (short strings)
 * - Date/Time: DATE, TIME, TIMESTAMP
 * - Special: INTERVAL, BLOB
 * - Null handling
 */

import * as functional from "@ggpwnkthx/duckdb/functional";

const ROW_COUNT = 100_000;

function checksumValues(rows: Array<Array<unknown>>): bigint {
  let checksum = 0n;
  for (const row of rows) {
    const val = row[0];
    if (val !== null) {
      if (typeof val === "bigint") {
        checksum += val;
      } else if (typeof val === "number" && Number.isSafeInteger(val)) {
        checksum += BigInt(val);
      }
    }
  }
  return checksum;
}

// Pre-setup database and connection
const dbHandle = await functional.open();
const connHandle = await functional.connectToDatabase(dbHandle);

// Integer types
Deno.bench("Type: TINYINT (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT (i % 128)::TINYINT as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  const sum = checksumValues(rows);
  if (sum === undefined) throw new Error("Checksum failed");
  result.close();
});

Deno.bench("Type: SMALLINT (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT (i % 32768)::SMALLINT as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  const sum = checksumValues(rows);
  if (sum === undefined) throw new Error("Checksum failed");
  result.close();
});

Deno.bench("Type: INTEGER (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT i::INTEGER as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  const sum = checksumValues(rows);
  if (sum === undefined) throw new Error("Checksum failed");
  result.close();
});

Deno.bench("Type: BIGINT (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT i::BIGINT as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  const sum = checksumValues(rows);
  if (sum === undefined) throw new Error("Checksum failed");
  result.close();
});

// Floating point types
Deno.bench("Type: FLOAT (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT i::FLOAT as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let sum = 0;
  for (const row of rows) {
    if (row[0] !== null) sum += row[0] as number;
  }
  if (!Number.isFinite(sum)) throw new Error("Sum failed");
  result.close();
});

Deno.bench("Type: DOUBLE (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT i::DOUBLE as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let sum = 0;
  for (const row of rows) {
    if (row[0] !== null) sum += row[0] as number;
  }
  if (!Number.isFinite(sum)) throw new Error("Sum failed");
  result.close();
});

// VARCHAR - short strings
Deno.bench("Type: VARCHAR short (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT 'item_' || i::VARCHAR as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalLen = 0;
  for (const row of rows) {
    if (row[0] !== null) totalLen += (row[0] as string).length;
  }
  if (totalLen === 0) throw new Error("Length check failed");
  result.close();
});

// Date/Time types
Deno.bench("Type: DATE (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT DATE '2020-01-01' + INTERVAL (i) DAY as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let validCount = 0;
  for (const row of rows) {
    if (row[0] !== null) validCount++;
  }
  if (validCount === 0) throw new Error("Check failed");
  result.close();
});

Deno.bench("Type: TIME (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT TIME '00:00:00' + (i % 86400) * INTERVAL '1 second' as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let validCount = 0;
  for (const row of rows) {
    if (row[0] !== null) validCount++;
  }
  if (validCount === 0) throw new Error("Check failed");
  result.close();
});

Deno.bench("Type: TIMESTAMP (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT TIMESTAMP '2020-01-01 00:00:00' + (i % 31536000) * INTERVAL '1 second' as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let validCount = 0;
  for (const row of rows) {
    if (row[0] !== null) validCount++;
  }
  if (validCount === 0) throw new Error("Check failed");
  result.close();
});

// INTERVAL type
Deno.bench("Type: INTERVAL (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT INTERVAL (i) DAYS + INTERVAL (i % 24) HOURS as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalDays = 0;
  for (const row of rows) {
    const val = row[0] as { months: number; days: number; micros: bigint } | null;
    if (val !== null) totalDays += val.days;
  }
  if (totalDays === 0) throw new Error("Check failed");
  result.close();
});

// BLOB type
Deno.bench("Type: BLOB (100K rows)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT blob from (select hex(generate_series)::BLOB as blob from generate_series(1, ${ROW_COUNT}) s(generate_series))`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let totalLen = 0;
  for (const row of rows) {
    if (row[0] !== null) totalLen += (row[0] as Uint8Array).length;
  }
  if (totalLen === 0) throw new Error("Length check failed");
  result.close();
});

// Null handling
Deno.bench("Type: NULLs (100K rows, 50% null)", () => {
  const result = functional.executeSqlResult(
    connHandle,
    `SELECT CASE WHEN i % 2 = 0 THEN NULL ELSE i END as val FROM generate_series(1, ${ROW_COUNT}) s(i)`,
  );
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  let nullCount = 0;
  for (const row of rows) {
    if (row[0] === null) nullCount++;
  }
  if (nullCount === 0) throw new Error("Null check failed");
  result.close();
});

addEventListener("unload", () => {
  try {
    functional.closeConnection(connHandle);
  } catch {
    // ignore
  }
  try {
    functional.closeDatabase(dbHandle);
  } catch {
    // ignore
  }
});
