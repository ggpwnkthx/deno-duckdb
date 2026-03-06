/**
 * Regression tests for previously fixed issues
 */

import { assertEquals, assertThrows } from "@std/assert";
import { functional as duckdb } from "@ggpwnkthx/duckdb";
import { functional } from "@ggpwnkthx/duckdb";
import { QueryError } from "../src/errors.ts";
import { getPointer } from "../src/helpers.ts";
import { exec, query, withConn } from "./_util.ts";

// Warm-up test to trigger library loading once for all tests
Deno.test({
  name: "warmup: load library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = await duckdb.open();
    const conn = await duckdb.create(db);
    duckdb.closeConnection(conn);
    duckdb.closeDatabase(db);
  },
});

Deno.test({
  name: "regression: fix previously identified issues",
  async fn(t) {
    // Step 1: nullmask handling
    await t.step({
      name: "nullmask handling",
      async fn() {
        // fetchAll handles NULL in first row
        await withConn((conn) => {
          // Create table and insert row with NULL string value as first row
          exec(conn, "CREATE TABLE nullmask_test(id INTEGER, val TEXT)");
          exec(conn, "INSERT INTO nullmask_test VALUES (1, NULL)");

          // Verify using fetchAll()
          const rows = query(conn, "SELECT * FROM nullmask_test");

          // fetchAll should return null for NULL value
          assertEquals(rows[0][1], null, "First row should have NULL");
        });
      },
    });

    // Step 2: error handling
    await t.step({
      name: "error handling",
      async fn() {
        // QueryError correctness - empty SQL
        await withConn((conn) => {
          assertThrows(
            () => duckdb.execute(conn, ""),
            QueryError,
          );
        });

        // QueryError correctness - invalid SQL
        await withConn((conn) => {
          try {
            duckdb.execute(conn, "SELCT 1");
            throw new Error("Should have thrown");
          } catch (e) {
            assertEquals(e instanceof QueryError, true, "Should be QueryError");
            assertEquals((e as QueryError).query, "SELCT 1");
            assertEquals((e as QueryError).message.includes("SELCT"), true);
          }
        });
      },
    });

    // Step 3: string extraction
    await t.step({
      name: "string extraction",
      async fn() {
        // Empty string
        await withConn((conn) => {
          exec(conn, "CREATE TABLE str_test(val TEXT)");
          exec(conn, "INSERT INTO str_test VALUES ('')");
          const rows = query(conn, "SELECT * FROM str_test");
          assertEquals(rows[0][0], "");
        });

        // Non-ASCII
        await withConn((conn) => {
          exec(conn, "CREATE TABLE str_test(val TEXT)");
          exec(conn, "INSERT INTO str_test VALUES ('café')");
          const rows = query(conn, "SELECT * FROM str_test");
          assertEquals(rows[0][0], "café");
        });

        // Emoji
        await withConn((conn) => {
          exec(conn, "CREATE TABLE str_test(val TEXT)");
          exec(conn, "INSERT INTO str_test VALUES ('😀')");
          const rows = query(conn, "SELECT * FROM str_test");
          assertEquals(rows[0][0], "😀");
        });

        // Long string
        await withConn((conn) => {
          exec(conn, "CREATE TABLE str_test(val TEXT)");
          // Create a string >= 250 characters
          const longStr = "a".repeat(300);
          exec(conn, `INSERT INTO str_test VALUES ('${longStr}')`);
          const rows = query(conn, "SELECT * FROM str_test");
          assertEquals(rows[0][0], longStr);
        });

        // NULL
        await withConn((conn) => {
          exec(conn, "CREATE TABLE str_test(val TEXT)");
          exec(conn, "INSERT INTO str_test VALUES (NULL)");
          const rows = query(conn, "SELECT * FROM str_test");
          assertEquals(rows[0][0], null);
        });

        // String extraction via stream
        await withConn((conn) => {
          exec(conn, "CREATE TABLE str_test(val TEXT)");
          exec(
            conn,
            "INSERT INTO str_test VALUES ('hello'), (''), ('café'), ('😀')",
          );
          const rows: unknown[][] = [];
          for (
            const row of functional.stream(conn, "SELECT * FROM str_test")
          ) {
            rows.push(row);
          }

          assertEquals(rows.length, 4);
          assertEquals(rows[0][0], "hello");
          assertEquals(rows[1][0], "");
          assertEquals(rows[2][0], "café");
          assertEquals(rows[3][0], "😀");
        });
      },
    });

    // Step 4: pointer handling
    await t.step({
      name: "pointer handling",
      fn() {
        // getPointer respects byteOffset
        // Create a buffer with data at a specific offset
        const buffer = new Uint8Array(24);
        // Write a pointer value at bytes 8-15 (simulating column data)
        const expectedPtr = 0x123456789ABCDEF0n;
        const view = new DataView(buffer.buffer, 8, 8);
        view.setBigUint64(0, expectedPtr, true);

        // Now use getPointer which should read from the start of the buffer
        // In our use case, we pass buffer.subarray(8) to skip the first 8 bytes
        const slicedBuffer = buffer.subarray(8);
        const result = getPointer(slicedBuffer);
        assertEquals(result, expectedPtr);
      },
    });
  },
});
