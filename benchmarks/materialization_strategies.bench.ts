import * as functional from "@ggpwnkthx/duckdb/functional";

const ROW_COUNT = 100_000;

function asBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  throw new TypeError("Invalid value");
}

function checksumRows(rows: Array<Array<unknown>>): bigint {
  let checksum = 0n;
  for (let i = 0; i < rows.length; i++) {
    checksum += asBigInt(rows[i][0]);
    checksum += asBigInt(rows[i][1]);
  }
  return checksum;
}

function checksumRowsFromObjects(rows: Array<Record<string, unknown>>): bigint {
  let checksum = 0n;
  for (let i = 0; i < rows.length; i++) {
    checksum += asBigInt(rows[i].a);
    checksum += asBigInt(rows[i].b);
  }
  return checksum;
}

// Pre-setup
const dbHandle = await functional.open();
const connHandle = await functional.create(dbHandle);

const QUERY = `SELECT i as a, i + 1 as b FROM generate_series(1, ${ROW_COUNT}) s(i)`;

// toArray() vs rows() iteration
Deno.bench("Materialization: toArray()", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  const sum = checksumRows(rows);
  if (sum === undefined) throw new Error("Checksum failed");
  result.close();
});

Deno.bench("Materialization: rows() iterator with for...of", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  let sum = 0n;
  for (const row of result.rows()) {
    sum += asBigInt(row[0]);
    sum += asBigInt(row[1]);
  }
  result.close();
});

Deno.bench("Materialization: rows() iterator with manual next()", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  const iter = result.rows();
  let sum = 0n;
  let next = iter.next();
  while (!next.done) {
    sum += asBigInt(next.value[0]);
    sum += asBigInt(next.value[1]);
    next = iter.next();
  }
  result.close();
});

// Array vs Object rows
Deno.bench("Materialization: toArray() - array rows", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  const rows = result.toArray();
  const sum = checksumRows(rows);
  if (sum === undefined) throw new Error("Checksum failed");
  result.close();
});

Deno.bench("Materialization: toObjectArray() - object rows", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  const rows = result.toObjectArray();
  const sum = checksumRowsFromObjects(rows);
  if (sum === undefined) throw new Error("Checksum failed");
  result.close();
});

Deno.bench("Materialization: rows() iterator - array rows", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  let sum = 0n;
  for (const row of result.rows()) {
    sum += asBigInt(row[0]);
    sum += asBigInt(row[1]);
  }
  result.close();
});

Deno.bench("Materialization: objects() iterator - object rows", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  let sum = 0n;
  for (const row of result.objects()) {
    sum += asBigInt(row.a);
    sum += asBigInt(row.b);
  }
  result.close();
});

// Single cell access
Deno.bench("Materialization: getRow() - full row", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  // Get a subset of rows
  let sum = 0n;
  for (let i = 0; i < 1000; i++) {
    const row = result.getRow(i);
    sum += asBigInt(row[0]);
    sum += asBigInt(row[1]);
  }
  if (sum === undefined) throw new Error("Checksum failed");
  result.close();
});

Deno.bench("Materialization: getValue() - single cell", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  // Get a subset of cells using functional.getValue
  let sum = 0n;
  for (let i = 0; i < 1000; i++) {
    sum += asBigInt(functional.getValue(result, i, 0));
    sum += asBigInt(functional.getValue(result, i, 1));
  }
  if (sum === undefined) throw new Error("Checksum failed");
  result.close();
});

// Execution-only (no materialization)
Deno.bench("Execution-only: row count only", () => {
  const result = functional.executeSqlResult(connHandle, QUERY);
  if (!result) throw new Error("Query failed");
  const count = result.rowCount;
  if (count !== ROW_COUNT) throw new Error("Count mismatch");
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
