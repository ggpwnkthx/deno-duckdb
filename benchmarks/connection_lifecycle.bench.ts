/**
 * Benchmark connection lifecycle performance.
 *
 * Tests:
 * - Database open/close
 * - Connection create/close
 * - DDL/INSERT queries
 */

import * as functional from "@ggpwnkthx/duckdb/functional";

// Database lifecycle - each bench creates its own resources
Deno.bench("Lifecycle: open in-memory database", async () => {
  const db = await functional.open();
  await functional.closeDatabase(db);
});

Deno.bench("Lifecycle: create connection (in-memory)", async () => {
  const db = await functional.open();
  const conn = await functional.connectToDatabase(db);
  await functional.closeConnection(conn);
  await functional.closeDatabase(db);
});

Deno.bench("Lifecycle: create and close 5 connections", async () => {
  const db = await functional.open();
  const conn1 = await functional.connectToDatabase(db);
  const conn2 = await functional.connectToDatabase(db);
  const conn3 = await functional.connectToDatabase(db);
  const conn4 = await functional.connectToDatabase(db);
  const conn5 = await functional.connectToDatabase(db);

  await functional.closeConnection(conn1);
  await functional.closeConnection(conn2);
  await functional.closeConnection(conn3);
  await functional.closeConnection(conn4);
  await functional.closeConnection(conn5);
  await functional.closeDatabase(db);
});

// Query types - DDL
Deno.bench("Query: CREATE TABLE (DDL)", async () => {
  const db = await functional.open();
  const conn = await functional.connectToDatabase(db);

  const result = await functional.executeSqlResult(
    conn,
    "CREATE TABLE bench_test (id INTEGER, name VARCHAR, value DOUBLE)",
  );
  if (!result) throw new Error("Query failed");
  result.close();

  await functional.closeConnection(conn);
  await functional.closeDatabase(db);
});

Deno.bench("Query: DROP TABLE (DDL)", async () => {
  const db = await functional.open();
  const conn = await functional.connectToDatabase(db);

  // Setup
  await functional.executeSqlResult(conn, "CREATE TABLE bench_test (id INTEGER)");
  const result = await functional.executeSqlResult(conn, "DROP TABLE bench_test");
  if (!result) throw new Error("Query failed");
  result.close();

  await functional.closeConnection(conn);
  await functional.closeDatabase(db);
});

// Query types - INSERT
Deno.bench("Query: INSERT single row", async () => {
  const db = await functional.open();
  const conn = await functional.connectToDatabase(db);

  // Setup
  await functional.executeSqlResult(
    conn,
    "CREATE TABLE bench_test (id INTEGER, name VARCHAR)",
  );

  const result = await functional.executeSqlResult(
    conn,
    "INSERT INTO bench_test VALUES (1, 'test')",
  );
  if (!result) throw new Error("Query failed");
  result.close();

  await functional.executeSqlResult(conn, "DROP TABLE bench_test");
  await functional.closeConnection(conn);
  await functional.closeDatabase(db);
});

Deno.bench("Query: INSERT 1000 rows (batch)", async () => {
  const db = await functional.open();
  const conn = await functional.connectToDatabase(db);

  // Setup
  await functional.executeSqlResult(conn, "CREATE TABLE bench_test (id INTEGER)");

  const result = await functional.executeSqlResult(
    conn,
    "INSERT INTO bench_test SELECT i FROM generate_series(1, 1000) s(i)",
  );
  if (!result) throw new Error("Query failed");
  result.close();

  await functional.executeSqlResult(conn, "DROP TABLE bench_test");
  await functional.closeConnection(conn);
  await functional.closeDatabase(db);
});

// Prepared statement lifecycle
Deno.bench("Prepared: prepare + execute + destroy (100 iterations)", async () => {
  const db = await functional.open();
  const conn = await functional.connectToDatabase(db);

  for (let i = 0; i < 100; i++) {
    const stmt = await functional.prepare(conn, "SELECT ?");
    await functional.bind(stmt, [i]);
    const result = await functional.executePreparedResult(stmt);
    if (!result) throw new Error("Query failed");
    result.close();
    await functional.destroyPrepared(stmt);
  }

  await functional.closeConnection(conn);
  await functional.closeDatabase(db);
});

// Reusing prepared statement
Deno.bench("Prepared: reuse (100 iterations)", async () => {
  const db = await functional.open();
  const conn = await functional.connectToDatabase(db);

  const stmt = await functional.prepare(conn, "SELECT ? + 1");
  for (let i = 0; i < 100; i++) {
    await functional.bind(stmt, [i]);
    const result = await functional.executePreparedResult(stmt);
    if (!result) throw new Error("Query failed");
    result.close();
  }
  await functional.destroyPrepared(stmt);

  await functional.closeConnection(conn);
  await functional.closeDatabase(db);
});

// Transaction handling
Deno.bench("Transaction: COMMIT (auto-commit)", async () => {
  const db = await functional.open();
  const conn = await functional.connectToDatabase(db);

  const result = await functional.executeSqlResult(
    conn,
    "SELECT 1",
  );
  if (!result) throw new Error("Query failed");
  result.close();

  await functional.closeConnection(conn);
  await functional.closeDatabase(db);
});

Deno.bench("Transaction: explicit COMMIT", async () => {
  const db = await functional.open();
  const conn = await functional.connectToDatabase(db);

  await functional.executeSqlResult(conn, "BEGIN TRANSACTION");
  const result = await functional.executeSqlResult(conn, "COMMIT");
  if (result) result.close();

  await functional.closeConnection(conn);
  await functional.closeDatabase(db);
});

addEventListener("unload", () => {
  // Cleanup any leftover resources
  (async () => {
    try {
      const db = await functional.open();
      await functional.closeDatabase(db);
    } catch {
      // ignore
    }
  })();
});
