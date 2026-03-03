/**
 * Functional prepared statement operations tests
 */
import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { functional as duckdb } from "@ggpwnkthx/duckdb";

let dbHandle: Awaited<ReturnType<typeof duckdb.open>>;
let connHandle: Awaited<ReturnType<typeof duckdb.create>>;

Deno.test({
  name: "setup: open database, create connection",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    dbHandle = await duckdb.open();
    connHandle = await duckdb.create(dbHandle);
  },
});

Deno.test({
  name: "prepare: prepares SELECT statement",
  async fn() {
    // First create a table
    await duckdb.execute(
      connHandle,
      "CREATE TABLE prepare_test(id INTEGER, name VARCHAR)",
    );
    await duckdb.execute(
      connHandle,
      "INSERT INTO prepare_test VALUES (1, 'test')",
    );

    const handle = await duckdb.prepare(
      connHandle,
      "SELECT * FROM prepare_test WHERE id = ?",
    );
    assertExists(handle);

    await duckdb.destroyPrepared(handle);
  },
});

Deno.test({
  name: "prepare: throws for invalid SQL",
  async fn() {
    await assertRejects(
      async () =>
        await duckdb.prepare(
          connHandle,
          "SELECT * FROM nonexistent_table WHERE ?",
        ),
      Error,
    );
  },
});

Deno.test({
  name: "executePrepared: executes prepared statement",
  async fn() {
    const prepHandle = await duckdb.prepare(connHandle, "SELECT 1 as num");

    const execHandle = await duckdb.executePrepared(prepHandle);
    assertExists(execHandle);

    await duckdb.destroyPrepared(prepHandle);
    await duckdb.destroyResult(execHandle);
  },
});

Deno.test({
  name: "preparedColumnCount: returns column count",
  async fn() {
    const prepHandle = await duckdb.prepare(
      connHandle,
      "SELECT 1 as a, 2 as b, 3 as c",
    );

    const count = await duckdb.preparedColumnCount(prepHandle);
    assertEquals(count, 3n);

    await duckdb.destroyPrepared(prepHandle);
  },
});

Deno.test({
  name: "destroyPrepared: frees prepared statement",
  async fn() {
    const handle = await duckdb.prepare(connHandle, "SELECT 1");

    // Should not throw
    await duckdb.destroyPrepared(handle);

    // Destroying again should be safe
    await duckdb.destroyPrepared(handle);
  },
});

Deno.test({
  name: "full workflow: prepare, execute, and fetch results",
  async fn() {
    // Create and populate table
    await duckdb.execute(
      connHandle,
      "CREATE TABLE workflow_test(id INTEGER, value TEXT)",
    );
    await duckdb.execute(
      connHandle,
      "INSERT INTO workflow_test VALUES (1, 'a'), (2, 'b'), (3, 'c')",
    );

    // Prepare statement - no parameter
    const prepHandle = await duckdb.prepare(
      connHandle,
      "SELECT * FROM workflow_test WHERE id > 0",
    );

    // Execute
    const execHandle = await duckdb.executePrepared(prepHandle);

    // Verify results
    const rowCount = await duckdb.rowCount(execHandle);
    assertEquals(rowCount, 3n);

    // Cleanup
    await duckdb.destroyPrepared(prepHandle);
    await duckdb.destroyResult(execHandle);
  },
});

Deno.test({
  name: "cleanup: close connection and database",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await duckdb.closeConnection(connHandle);
    await duckdb.closeDatabase(dbHandle);
  },
});
