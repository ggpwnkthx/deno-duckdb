import { assertEquals } from "@std/assert";
import * as functional from "@ggpwnkthx/duckdb/functional";
import {
  materializeResultObjects,
  materializeResultRows,
  queryCachedObjects,
  test,
  withFunctionalConnection,
} from "./utils.ts";

test("queryCachedObjects returns object rows", () =>
  withFunctionalConnection((connection) => {
    const objects = queryCachedObjects(
      connection,
      "SELECT 1 AS id, 'alpha' AS name UNION ALL SELECT 2, 'beta' ORDER BY id",
    );

    assertEquals(objects, [
      { id: 1, name: "alpha" },
      { id: 2, name: "beta" },
    ]);
  }));

test("materializeResultRows returns row arrays", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT 1 AS id, 'first' AS value UNION ALL SELECT 2, 'second' ORDER BY id",
    );
    try {
      const rows = materializeResultRows(result.reader());
      assertEquals(rows, [
        [1, "first"],
        [2, "second"],
      ]);
    } finally {
      result.close();
    }
  }));

test("materializeResultObjects returns object rows", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT 1 AS id, 'x' AS name UNION ALL SELECT 2, 'y' ORDER BY id",
    );
    try {
      const objects = materializeResultObjects(result.reader());
      assertEquals(objects, [
        { id: 1, name: "x" },
        { id: 2, name: "y" },
      ]);
    } finally {
      result.close();
    }
  }));

test("materializeResultObjects handles BLOBs correctly", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT unhex('C0FFEE') AS blob_data",
    );
    try {
      const objects = materializeResultObjects(result.reader());
      assertEquals(objects[0].blob_data, new Uint8Array([0xC0, 0xFF, 0xEE]));
    } finally {
      result.close();
    }
  }));
