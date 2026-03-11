/**
 * Functional database operations tests
 */

import { assertEquals } from "@std/assert";
import type { DatabaseHandle } from "@ggpwnkthx/duckdb";
import * as duckdb from "@ggpwnkthx/duckdb/functional";
import { exec } from "./utils.ts";

Deno.test({
  name: "database: manage database lifecycle",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Step 1: open database
    await t.step({
      name: "open database (in-memory)",
      async fn() {
        // Opens in-memory database (does not test persistence)
        const handle = await duckdb.open();
        assertEquals(duckdb.isValidDatabase(handle), true);
        duckdb.closeDatabase(handle);

        // Opens with explicit :memory: path
        const handle2 = await duckdb.open({ path: ":memory:" });
        assertEquals(duckdb.isValidDatabase(handle2), true);
        duckdb.closeDatabase(handle2);
      },
    });

    // Step 1b: file-backed persistence test
    await t.step({
      name: "open database (file-backed persistence)",
      async fn() {
        // Use a temp directory for persistence test
        const tempDir = await Deno.makeTempDir();
        const testDbPath = tempDir + "/test_persistence.duck.db";

        try {
          // Open, create table, insert data
          const db1 = await duckdb.open({ path: testDbPath });
          const conn1 = await duckdb.create(db1);
          exec(conn1, "CREATE TABLE test (id INTEGER, name TEXT)");
          exec(conn1, "INSERT INTO test VALUES (1, 'hello')");
          duckdb.closeConnection(conn1);
          duckdb.closeDatabase(db1);

          // Reopen and verify data persisted
          const db2 = await duckdb.open({ path: testDbPath });
          const conn2 = await duckdb.create(db2);
          const result = duckdb.query(conn2, "SELECT * FROM test");
          const rows = duckdb.fetchAll(result);
          duckdb.destroyResult(result);
          assertEquals(rows.length, 1);
          assertEquals(rows[0][0], 1); // id
          assertEquals(rows[0][1], "hello"); // name
          duckdb.closeConnection(conn2);
          duckdb.closeDatabase(db2);
        } finally {
          // Clean up temp directory
          try {
            await Deno.remove(tempDir, { recursive: true });
          } catch {
            // Directory may not exist
          }
        }
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
        // Verify handle is valid (non-zero pointer)
        assertEquals(duckdb.isValidDatabase(handle), true);
        const pointer = duckdb.getPointerValue(handle);
        // Pointer should be non-zero for valid handle
        assertEquals(pointer !== 0n, true);
        assertEquals(typeof pointer, "bigint");
        duckdb.closeDatabase(handle);

        // Invalid handle - just verify it returns a bigint, don't assert specific value
        const invalidHandle = new Uint8Array(8) as unknown as DatabaseHandle;
        const invalidPointer = duckdb.getPointerValue(invalidHandle);
        assertEquals(typeof invalidPointer, "bigint");
      },
    });

    // Step 4: extended config options
    await t.step({
      name: "open database with extended config",
      async fn() {
        // Test 1: Valid non-path config key (e.g., threads)
        const db1 = await duckdb.open({ path: ":memory:", threads: "2" });
        assertEquals(duckdb.isValidDatabase(db1), true);
        duckdb.closeDatabase(db1);

        // Test 2: accessMode -> access_mode mapping with read_write (read_only doesn't work with :memory:)
        const db2 = await duckdb.open({
          path: ":memory:",
          accessMode: "read_write",
        });
        assertEquals(duckdb.isValidDatabase(db2), true);
        duckdb.closeDatabase(db2);

        // Test 3: Invalid config key - should throw DatabaseError
        let threw = false;
        try {
          await duckdb.open({ path: ":memory:", invalid_key_xyz: "value" });
        } catch (e) {
          threw = true;
          const err = e as Error;
          assertEquals(e instanceof duckdb.DatabaseError, true);
          // Error should mention config or open failure
          assertEquals(
            err.message.includes("config") || err.message.includes("open"),
            true,
          );
        }
        assertEquals(threw, true);

        // Test 4: Invalid config value - should throw DatabaseError
        threw = false;
        try {
          // access_mode doesn't accept "invalid_value" as valid
          await duckdb.open({ path: ":memory:", access_mode: "invalid_value" });
        } catch (e) {
          threw = true;
          assertEquals(e instanceof duckdb.DatabaseError, true);
        }
        assertEquals(threw, true);

        // Test 5: File-backed with config
        const tempDir = await Deno.makeTempDir();
        const testDbPath = tempDir + "/test_config.duck.db";
        try {
          const db5 = await duckdb.open({ path: testDbPath, threads: "1" });
          assertEquals(duckdb.isValidDatabase(db5), true);
          duckdb.closeDatabase(db5);
        } finally {
          await Deno.remove(tempDir, { recursive: true });
        }

        // Test 6: File-backed with read_only access mode (requires existing file)
        const tempDir2 = await Deno.makeTempDir();
        const testDbPath2 = tempDir2 + "/test_readonly.duck.db";
        try {
          // First create the file
          const dbCreate = await duckdb.open({ path: testDbPath2 });
          const connCreate = await duckdb.create(dbCreate);
          exec(connCreate, "CREATE TABLE test (id INTEGER)");
          duckdb.closeConnection(connCreate);
          duckdb.closeDatabase(dbCreate);

          // Now open with read_only
          const db6 = await duckdb.open({
            path: testDbPath2,
            accessMode: "read_only",
          });
          assertEquals(duckdb.isValidDatabase(db6), true);
          duckdb.closeDatabase(db6);
        } finally {
          await Deno.remove(tempDir2, { recursive: true });
        }
      },
    });
  },
});
