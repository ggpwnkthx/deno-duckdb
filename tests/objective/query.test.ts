/**
 * Objective API - QueryResult class tests
 */

import { assertEquals } from "@std/assert";
import { Database } from "@ggpwnkthx/duckdb/objective";

// Warm-up test to trigger library loading once for all tests
Deno.test({
  name: "warmup: load library",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const db = new Database();
    await db.open();
    db.close();
  },
});

// Helper to set up a fresh database with test data for each test
async function setupTestDb(): Promise<Database> {
  const db = new Database();
  await db.open();

  const conn = await db.connect();
  const createResult = conn.query(
    "CREATE TABLE test_data (id INTEGER, name TEXT, value DOUBLE)",
  );
  createResult.close();

  const insertResult = conn.query(
    "INSERT INTO test_data VALUES (1, 'one', 1.5), (2, 'two', 2.5), (3, 'three', 3.5)",
  );
  insertResult.close();

  conn.close();
  return db;
}

Deno.test({
  name: "query: manage query results",
  async fn(t) {
    // Step 1: fetch data
    await t.step({
      name: "fetch data",
      async fn() {
        // Returns row data
        const db = await setupTestDb();
        const conn = await db.connect();
        const result = conn.query("SELECT * FROM test_data ORDER BY id");
        const rows = result.fetchAll();

        assertEquals(rows.length, 3);
        assertEquals(rows[0][0], 1);
        assertEquals(rows[1][0], 2);
        assertEquals(rows[2][0], 3);

        result.close();
        conn.close();
        db.close();

        // Returns single row by index
        const db2 = await setupTestDb();
        const conn2 = await db2.connect();
        const result2 = conn2.query("SELECT * FROM test_data ORDER BY id");

        const row0 = result2.getRow(0);
        assertEquals(row0[0], 1);

        const row1 = result2.getRow(1);
        assertEquals(row1[0], 2);

        const row2 = result2.getRow(2);
        assertEquals(row2[0], 3);

        result2.close();
        conn2.close();
        db2.close();

        // Throws on out of bounds index
        const db3 = await setupTestDb();
        const conn3 = await db3.connect();
        const result3 = conn3.query("SELECT * FROM test_data");

        try {
          result3.getRow(100);
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Row index out of bounds");
        }

        result3.close();
        conn3.close();
        db3.close();

        // Throws on negative index
        const db4 = await setupTestDb();
        const conn4 = await db4.connect();
        const result4 = conn4.query("SELECT * FROM test_data");

        try {
          result4.getRow(-1);
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Row index out of bounds");
        }

        result4.close();
        conn4.close();
        db4.close();

        // Returns objects with column names
        const db5 = await setupTestDb();
        const conn5 = await db5.connect();
        const result5 = conn5.query("SELECT * FROM test_data ORDER BY id");

        const objects = result5.toArrayOfObjects();

        assertEquals(objects.length, 3);
        assertEquals(objects[0].id, 1);
        assertEquals(objects[0].name, "one");
        assertEquals(objects[0].value, 1.5);

        assertEquals(objects[1].id, 2);
        assertEquals(objects[1].name, "two");
        assertEquals(objects[1].value, 2.5);

        result5.close();
        conn5.close();
        db5.close();
      },
    });

    // Step 2: metadata
    await t.step({
      name: "metadata",
      async fn() {
        // Returns correct count
        const db = await setupTestDb();
        const conn = await db.connect();
        const result = conn.query("SELECT * FROM test_data");

        assertEquals(result.rowCount(), 3n);

        result.close();
        conn.close();
        db.close();

        // Returns column count
        const db2 = await setupTestDb();
        const conn2 = await db2.connect();
        const result2 = conn2.query("SELECT * FROM test_data");

        assertEquals(result2.columnCount(), 3n);

        result2.close();
        conn2.close();
        db2.close();

        // Returns column metadata
        const db3 = await setupTestDb();
        const conn3 = await db3.connect();
        const result3 = conn3.query("SELECT * FROM test_data");

        const infos = result3.getColumnInfos();

        assertEquals(infos.length, 3);
        assertEquals(infos[0].name, "id");
        assertEquals(infos[1].name, "name");
        assertEquals(infos[2].name, "value");

        result3.close();
        conn3.close();
        db3.close();

        // Returns query success
        const db4 = await setupTestDb();
        const conn4 = await db4.connect();
        const result4 = conn4.query("SELECT * FROM test_data");

        assertEquals(result4.isSuccess(), true);

        result4.close();
        conn4.close();
        db4.close();

        // Returns undefined for successful query
        const db5 = await setupTestDb();
        const conn5 = await db5.connect();
        const result5 = conn5.query("SELECT * FROM test_data");

        assertEquals(result5.getError(), undefined);

        result5.close();
        conn5.close();
        db5.close();
      },
    });

    // Step 3: resource management
    await t.step({
      name: "resource management",
      async fn() {
        // Releases memory
        const db = await setupTestDb();
        const conn = await db.connect();
        const result = conn.query("SELECT * FROM test_data");

        result.close();

        // After freeing, operations should throw
        try {
          await result.fetchAll();
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Result has been freed");
        }

        conn.close();
        db.close();

        // Is idempotent
        const db2 = await setupTestDb();
        const conn2 = await db2.connect();
        const result2 = conn2.query("SELECT * FROM test_data");

        result2.close();
        result2.close(); // Should not throw

        conn2.close();
        db2.close();

        // Throws after free (rowCount)
        const db3 = await setupTestDb();
        const conn3 = await db3.connect();
        const result3 = conn3.query("SELECT * FROM test_data");

        result3.close();

        try {
          result3.rowCount();
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Result has been freed");
        }

        conn3.close();
        db3.close();

        // Throws after free (columnCount)
        const db4 = await setupTestDb();
        const conn4 = await db4.connect();
        const result4 = conn4.query("SELECT * FROM test_data");

        result4.close();

        try {
          result4.columnCount();
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Result has been freed");
        }

        conn4.close();
        db4.close();

        // Throws after free (getColumnInfos)
        const db5 = await setupTestDb();
        const conn5 = await db5.connect();
        const result5 = conn5.query("SELECT * FROM test_data");

        result5.close();

        try {
          result5.getColumnInfos();
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Result has been freed");
        }

        conn5.close();
        db5.close();

        // Throws after free (toArrayOfObjects)
        const db6 = await setupTestDb();
        const conn6 = await db6.connect();
        const result6 = conn6.query("SELECT * FROM test_data");

        result6.close();

        try {
          result6.toArrayOfObjects();
          throw new Error("Should have thrown");
        } catch (e) {
          assertEquals((e as Error).message, "Result has been freed");
        }

        conn6.close();
        db6.close();
      },
    });

    // Step 4: edge cases
    await t.step({
      name: "edge cases",
      async fn() {
        // Handles empty result set
        const db = await setupTestDb();
        const conn = await db.connect();
        const result = conn.query("SELECT * FROM test_data WHERE id = 999");

        assertEquals(result.rowCount(), 0n);
        assertEquals((result.fetchAll()).length, 0);

        result.close();
        conn.close();
        db.close();
      },
    });
  },
});

Deno.test({
  name: "query: caching behavior tests",
  async fn(t) {
    // Helper to set up a fresh database with test data
    async function setupTestDbForCache(): Promise<Database> {
      const db = new Database();
      await db.open();

      const conn = await db.connect();
      const createResult = conn.query(
        "CREATE TABLE cache_data (id INTEGER, name TEXT, value DOUBLE)",
      );
      createResult.close();

      const insertResult = conn.query(
        "INSERT INTO cache_data VALUES (1, 'one', 1.5), (2, 'two', 2.5), (3, 'three', 3.5)",
      );
      insertResult.close();

      conn.close();
      return db;
    }

    await t.step({
      name: "fetchAll returns cached rows on second call",
      async fn() {
        const db = await setupTestDbForCache();
        const conn = await db.connect();
        const result = conn.query("SELECT * FROM cache_data ORDER BY id");

        const firstCall = result.fetchAll();
        const secondCall = result.fetchAll();

        // Should be the same array reference (cached)
        assertEquals(firstCall === secondCall, true);
        assertEquals(firstCall.length, 3);

        result.close();
        conn.close();
        db.close();
      },
    });

    await t.step({
      name: "caching works up to 10K rows",
      async fn() {
        const db = new Database();
        await db.open();
        const conn = await db.connect();

        // Create a table with 100 rows
        const createResult = conn.query(
          "CREATE TABLE cache_test (id INTEGER)",
        );
        createResult.close();

        // Insert 100 rows
        const insertParts = [];
        for (let i = 1; i <= 100; i++) {
          insertParts.push(`(${i})`);
        }
        const insertResult = conn.query(
          `INSERT INTO cache_test VALUES ${insertParts.join(", ")}`,
        );
        insertResult.close();

        const result = conn.query("SELECT * FROM cache_test ORDER BY id");
        const firstFetch = result.fetchAll();
        const secondFetch = result.fetchAll();

        // Should be cached
        assertEquals(firstFetch === secondFetch, true);
        assertEquals(firstFetch.length, 100);

        result.close();
        conn.close();
        db.close();
      },
    });

    await t.step({
      name: "large results over 10K not cached",
      async fn() {
        const db = new Database();
        await db.open();
        const conn = await db.connect();

        const createResult = conn.query(
          "CREATE TABLE large_test (id INTEGER)",
        );
        createResult.close();

        // Insert 10001 rows (just over the cache limit)
        const insertParts = [];
        for (let i = 1; i <= 10001; i++) {
          insertParts.push(`(${i})`);
        }
        const insertResult = conn.query(
          `INSERT INTO large_test VALUES ${insertParts.join(", ")}`,
        );
        insertResult.close();

        const result = conn.query("SELECT * FROM large_test ORDER BY id");
        const firstLarge = result.fetchAll();
        const secondLarge = result.fetchAll();

        // Should NOT be cached (over limit)
        assertEquals(firstLarge === secondLarge, false);
        assertEquals(firstLarge.length, 10001);

        result.close();
        conn.close();
        db.close();
      },
    });
  },
});
