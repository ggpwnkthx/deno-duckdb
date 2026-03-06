/**
 * Functional database operations tests
 */

import { assertEquals, assertExists } from "@std/assert";
import type { DatabaseHandle } from "@ggpwnkthx/duckdb";
import * as duckdb from "@ggpwnkthx/duckdb/functional";

Deno.test({
  name: "database: manage database lifecycle",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Step 1: open database
    await t.step({
      name: "open database",
      async fn() {
        // Opens in-memory database
        const handle = await duckdb.open();
        assertExists(handle);
        duckdb.closeDatabase(handle);

        // Opens with custom path config
        const handle2 = await duckdb.open({ path: ":memory:" });
        assertExists(handle2);
        duckdb.closeDatabase(handle2);
      },
    });

    // Step 2: validate database
    await t.step({
      name: "validate database",
      async fn() {
        // Returns true for valid handle
        const handle = await duckdb.open();
        assertEquals(duckdb.isValidDatabase(handle), true);
        duckdb.closeDatabase(handle);

        // Returns false for invalid handle
        const invalidHandle = new Uint8Array(8) as unknown as DatabaseHandle;
        assertEquals(duckdb.isValidDatabase(invalidHandle), false);
      },
    });

    // Step 3: get pointer value
    await t.step({
      name: "get pointer value",
      async fn() {
        const handle = await duckdb.open();
        const pointer = duckdb.getPointerValue(handle);
        assertExists(pointer);
        assertEquals(typeof pointer, "bigint");
        duckdb.closeDatabase(handle);
      },
    });
  },
});
