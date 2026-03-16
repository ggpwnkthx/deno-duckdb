import { assertEquals, assertExists } from "@std/assert";
import * as functional from "@ggpwnkthx/duckdb/functional";
import {
  getLibrary,
  getLibraryFast,
  getLibrarySync,
  isLibraryLoaded,
} from "../src/core/library.ts";

Deno.test({
  name: "core: getLibrary caches the loaded dynamic library per path",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const library1 = await getLibrary();
    const library2 = await getLibrary();

    assertExists(library1);
    assertEquals(library1, library2);
    assertEquals(getLibraryFast(), library1);
    assertEquals(getLibrarySync(), library1);
    assertEquals(isLibraryLoaded(), true);
  },
});

Deno.test({
  name: "core: library loaded explicitly can be used by the functional API",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await getLibrary();

    const database = await functional.open();
    const connection = await functional.create(database);

    // Use a prepared statement to get a ResultHandle for testing
    const stmt = functional.prepare(connection, "SELECT 1 AS value");
    const result = functional.executePrepared(stmt);

    try {
      const reader = functional.createResultReader(result);
      const rows = [...functional.iterateRows(reader)];
      assertEquals(rows, [[1]]);
    } finally {
      functional.destroyResult(result);
      functional.destroyPrepared(stmt);
      functional.closeConnection(connection);
      functional.closeDatabase(database);
    }
  },
});
