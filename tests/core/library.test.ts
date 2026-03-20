import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { DuckDBError } from "../../src/errors.ts";
import { getLibrary, getLibraryFast, getLibrarySync } from "../../src/core/library.ts";
import * as functional from "@ggpwnkthx/duckdb/functional";

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
  },
});

Deno.test({
  name: "core: library loaded explicitly can be used by the functional API",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await getLibrary();

    const database = await functional.open();
    const connection = await functional.connect(database);

    const stmt = functional.prepare(connection, "SELECT 1 AS value");
    const result = functional.executePrepared(stmt);

    try {
      const reader = functional.createResultReader(result);
      const rows = [...functional.iterateRows(reader)];
      assertEquals(rows, [[1]]);
    } finally {
      functional.destroy(result);
      functional.destroyPrepared(stmt);
      functional.closeConnection(connection);
      functional.closeDatabase(database);
    }
  },
});

Deno.test({
  name: "core: getLibraryFast throws when library not pre-loaded",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await getLibrary();

    const error = assertThrows(
      () => getLibraryFast("/nonexistent/path"),
      DuckDBError,
      "DuckDB library has not been loaded yet",
    );

    assertEquals(error.code, "LIBRARY_LOAD_FAILED");
  },
});

Deno.test({
  name: "core: getLibrarySync returns null when library not pre-loaded",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await getLibrary();

    const result = getLibrarySync("/nonexistent/path");
    assertEquals(result, null);
  },
});

Deno.test({
  name: "core: libraryKey normalizes paths with trim",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await getLibrary();

    const library = getLibrary();
    const libraryWithSpaces = getLibrary("  ");

    assertEquals(await library, await libraryWithSpaces);
  },
});
