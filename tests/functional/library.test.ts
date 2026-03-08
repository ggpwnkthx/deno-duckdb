/**
 * Library loader state transition tests
 */
import { assertEquals, assertExists, assertThrows } from "@std/assert";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { DatabaseError } from "@ggpwnkthx/duckdb";
import {
  getLibrary,
  getLibraryFast,
  getLibrarySync,
  isLibraryLoaded,
  resetLibrary,
} from "../../src/lib.ts";

Deno.test({
  name: "library: initial unloaded state",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    // Reset library to start fresh
    resetLibrary();

    // Verify unloaded state
    assertEquals(isLibraryLoaded(), false);
    assertEquals(getLibrarySync(), null);
  },
});

Deno.test({
  name: "library: getLibraryFast throws before load",
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    // Reset library to start fresh
    resetLibrary();

    // getLibraryFast should throw if library not loaded
    assertThrows(
      () => getLibraryFast(),
      DatabaseError,
      "Library not loaded",
    );
  },
});

Deno.test({
  name: "library: getLibrary loads and caches library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Reset library to start fresh
    resetLibrary();

    // getLibrary should load the library
    const lib = await getLibrary();
    assertExists(lib);

    // isLibraryLoaded should now return true
    assertEquals(isLibraryLoaded(), true);

    // getLibrarySync should now return the library
    assertEquals(getLibrarySync(), lib);

    // getLibraryFast should now return the library without throwing
    assertEquals(getLibraryFast(), lib);

    // Multiple calls should return the same cached library
    const lib2 = await getLibrary();
    assertEquals(lib, lib2);
  },
});

Deno.test({
  name: "library: resetLibrary restores unloaded state",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Reset library to start fresh
    resetLibrary();

    // Load the library
    await getLibrary();
    assertEquals(isLibraryLoaded(), true);

    // Reset the library
    resetLibrary();

    // Verify unloaded state
    assertEquals(isLibraryLoaded(), false);
    assertEquals(getLibrarySync(), null);

    // getLibraryFast should throw again
    assertThrows(
      () => getLibraryFast(),
      DatabaseError,
      "Library not loaded",
    );
  },
});

Deno.test({
  name: "library: operations work after library load",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Reset library to start fresh
    resetLibrary();

    // Load the library via getLibrary
    await getLibrary();

    // Now use the duckdb functions - they should work
    const db = await duckdb.open();
    assertExists(db);

    const conn = await duckdb.create(db);
    assertExists(conn);

    const result = duckdb.execute(conn, "SELECT 1 as num");
    assertExists(result);

    const rows = duckdb.fetchAll(result);
    assertEquals(rows.length, 1);
    assertEquals(rows[0][0], 1);

    duckdb.destroyResult(result);
    duckdb.closeConnection(conn);
    duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "library: concurrent getLibrary calls return same promise",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Reset library to start fresh
    resetLibrary();

    // Call getLibrary multiple times concurrently
    const promise1 = getLibrary();
    const promise2 = getLibrary();
    const promise3 = getLibrary();

    // All promises should resolve to the same library
    const lib1 = await promise1;
    const lib2 = await promise2;
    const lib3 = await promise3;

    assertEquals(lib1, lib2);
    assertEquals(lib2, lib3);
  },
});
