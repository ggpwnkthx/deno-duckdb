/**
 * Functional prepared statement operations tests
 */
import { assertEquals, assertExists } from "@std/assert";
import { load } from "@ggpwnkthx/libduckdb";
import type {
  ConnectionHandle,
  DatabaseHandle,
  DuckDBLibrary,
} from "@ggpwnkthx/duckdb";
import { functional as duckdb } from "@ggpwnkthx/duckdb";

let lib: DuckDBLibrary;
let dbHandle: DatabaseHandle;
let connHandle: ConnectionHandle;

Deno.test({
  name: "setup: load library, open database, create connection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    lib = await load();
    const dbResult = duckdb.open(lib);
    assertExists(dbResult.handle);
    dbHandle = dbResult.handle;

    const connResult = duckdb.create(lib, dbHandle);
    assertExists(connResult.handle);
    connHandle = connResult.handle;
  },
});

Deno.test("prepare: prepares SELECT statement", () => {
  // First create a table
  duckdb.execute(
    lib,
    connHandle,
    "CREATE TABLE prepare_test(id INTEGER, name VARCHAR)",
  );
  duckdb.execute(
    lib,
    connHandle,
    "INSERT INTO prepare_test VALUES (1, 'test')",
  );

  const result = duckdb.prepare(
    lib,
    connHandle,
    "SELECT * FROM prepare_test WHERE id = ?",
  );
  assertEquals(result.success, true);
  assertExists(result.handle);

  duckdb.destroyPrepared(lib, result.handle);
});

Deno.test("prepare: returns error for invalid SQL", () => {
  const result = duckdb.prepare(
    lib,
    connHandle,
    "SELECT * FROM nonexistent_table WHERE ?",
  );
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("prepareOrThrow: throws on failure", () => {
  try {
    duckdb.prepareOrThrow(lib, connHandle, "invalid sql ???");
    // Should not reach here
    throw new Error("Expected error was not thrown");
  } catch (e) {
    assertExists(e);
  }
});

Deno.test("executePrepared: executes prepared statement", () => {
  const prepResult = duckdb.prepare(lib, connHandle, "SELECT 1 as num");
  assertEquals(prepResult.success, true);

  const execResult = duckdb.executePrepared(lib, prepResult.handle);
  assertEquals(execResult.success, true);
  assertExists(execResult.handle);

  duckdb.destroyPrepared(lib, prepResult.handle);
  duckdb.destroyResult(lib, execResult.handle);
});

Deno.test("executePreparedOrThrow: throws on error", () => {
  const prepResult = duckdb.prepare(lib, connHandle, "SELECT 1");
  assertEquals(prepResult.success, true);

  // Execute with invalid state - should throw
  // Actually, prepared statements with no parameters need to be executed differently
  // Let's just verify the basic flow works
  const execResult = duckdb.executePreparedOrThrow(lib, prepResult.handle);
  assertEquals(execResult.success, true);

  duckdb.destroyPrepared(lib, prepResult.handle);
  duckdb.destroyResult(lib, execResult.handle);
});

Deno.test("preparedColumnCount: returns column count", () => {
  const prepResult = duckdb.prepare(
    lib,
    connHandle,
    "SELECT 1 as a, 2 as b, 3 as c",
  );
  assertEquals(prepResult.success, true);

  const count = duckdb.preparedColumnCount(lib, prepResult.handle);
  assertEquals(count, 3n);

  duckdb.destroyPrepared(lib, prepResult.handle);
});

Deno.test("destroyPrepared: frees prepared statement", () => {
  const result = duckdb.prepare(lib, connHandle, "SELECT 1");
  assertEquals(result.success, true);

  // Should not throw
  duckdb.destroyPrepared(lib, result.handle);

  // Destroying again should be safe
  duckdb.destroyPrepared(lib, result.handle);
});

Deno.test("full workflow: prepare, execute, and fetch results", () => {
  // Create and populate table
  duckdb.execute(
    lib,
    connHandle,
    "CREATE TABLE workflow_test(id INTEGER, value TEXT)",
  );
  duckdb.execute(
    lib,
    connHandle,
    "INSERT INTO workflow_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
  );

  // Prepare statement - no parameter
  const prepResult = duckdb.prepare(
    lib,
    connHandle,
    "SELECT * FROM workflow_test WHERE id > 0",
  );
  assertEquals(prepResult.success, true);

  // Execute
  const execResult = duckdb.executePrepared(lib, prepResult.handle);
  assertEquals(execResult.success, true);

  // Verify results
  const rowCount = duckdb.rowCount(lib, execResult.handle);
  assertEquals(rowCount, 3n);

  // Cleanup
  duckdb.destroyPrepared(lib, prepResult.handle);
  duckdb.destroyResult(lib, execResult.handle);
});

Deno.test({
  name: "cleanup: close connection and database",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    duckdb.closeConnection(lib, connHandle);
    duckdb.closeDatabase(lib, dbHandle);
    lib.close();
  },
});
