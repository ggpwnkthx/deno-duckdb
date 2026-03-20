import { assertEquals, assertThrows } from "@std/assert";
import * as functional from "@ggpwnkthx/duckdb/functional";
import { createTable, test, withFunctionalConnection } from "../utils.ts";

test("isNull returns true for NULL values", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(connection, "SELECT NULL, 'hello'");
    try {
      const reader = result.reader();
      assertEquals(functional.isNull(reader, 0, 0), true);
      assertEquals(functional.isNull(reader, 0, 1), false);
    } finally {
      result.close();
    }
  }));

test("isNull works with LazyResult directly", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(connection, "SELECT NULL, 42, 'text'");
    try {
      assertEquals(functional.isNull(result, 0, 0), true);
      assertEquals(functional.isNull(result, 0, 1), false);
      assertEquals(functional.isNull(result, 0, 2), false);
    } finally {
      result.close();
    }
  }));

test("isNull rejects invalid indices", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(connection, "SELECT 1, 2");
    try {
      const reader = result.reader();
      assertThrows(() => functional.isNull(reader, 1, 0), Error, "Row index");
      assertThrows(() => functional.isNull(reader, 0, 5), Error, "Column index");
    } finally {
      result.close();
    }
  }));

test("getValue returns raw values", () =>
  withFunctionalConnection((connection) => {
    createTable(connection, {
      name: "value_test",
      schema: "id INTEGER, name TEXT",
      rows: [[1, "first"], [2, "second"]],
    });
    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM value_test ORDER BY id",
    );
    try {
      const reader = result.reader();
      assertEquals(functional.getValue(reader, 0, 0), 1);
      assertEquals(functional.getValue(reader, 0, 1), "first");
      assertEquals(functional.getValue(reader, 1, 0), 2);
      assertEquals(functional.getValue(reader, 1, 1), "second");
    } finally {
      result.close();
    }
  }));

test("getValue returns null for NULL", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT NULL::INTEGER, NULL::TEXT",
    );
    try {
      const reader = result.reader();
      assertEquals(functional.getValue(reader, 0, 0), null);
      assertEquals(functional.getValue(reader, 0, 1), null);
    } finally {
      result.close();
    }
  }));

test("getValue rejects invalid row index", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(connection, "SELECT 1");
    try {
      const reader = result.reader();
      assertThrows(() => functional.getValue(reader, 5, 0), Error, "Row index");
    } finally {
      result.close();
    }
  }));

for (
  const [name, sql, expected] of [
    [
      "Int32 truncates floats",
      "SELECT 42::INTEGER, 42.1::INTEGER, 1234567890::INTEGER",
      [42, 42, 1234567890],
    ],
    ["Int64 extracts bigint", "SELECT 42::BIGINT, 1234567890123456789::BIGINT", [
      42n,
      1234567890123456789n,
    ]],
    ["Double extracts", "SELECT 3.14::DOUBLE, 42::DOUBLE", [3.14, 42.0]],
    ["String extracts", "SELECT 'hello', 'world', 42::TEXT", ["hello", "world", "42"]],
  ] as [string, string, unknown[]][]
) {
  test(`get${name}`, () =>
    withFunctionalConnection((connection) => {
      const result = functional.executeSqlResult(connection, sql);
      try {
        const reader = result.reader();
        for (let i = 0; i < expected.length; i++) {
          assertEquals(functional.getValue(reader, 0, i), expected[i]);
        }
      } finally {
        result.close();
      }
    }));
}

for (
  const [name, sql, extractor, expected] of [
    [
      "Int64 returns null for non-bigint",
      "SELECT 42::INTEGER, 'text'",
      functional.getInt64,
      null,
    ],
    [
      "Double returns null for non-number",
      "SELECT 'text', 'hello'",
      functional.getDouble,
      null,
    ],
    [
      "String returns null for non-string",
      "SELECT 42::INTEGER, 3.14::DOUBLE",
      functional.getString,
      null,
    ],
  ] as [
    string,
    string,
    (r: functional.ResultReader, row: number, col: number) => unknown,
    unknown,
  ][]
) {
  test(`get${name}`, () =>
    withFunctionalConnection((connection) => {
      const result = functional.executeSqlResult(connection, sql);
      try {
        const reader = result.reader();
        assertEquals(extractor(reader, 0, 0), expected);
        assertEquals(extractor(reader, 0, 1), expected);
      } finally {
        result.close();
      }
    }));
}

for (
  const [name, sql, expected] of [
    ["iterateRows yields row arrays", "SELECT * FROM iter_test ORDER BY id", [
      [1, "a"],
      [2, "b"],
      [3, "c"],
    ]],
    ["iterateRows works with ResultReader", "SELECT * FROM iter_test2 ORDER BY id", [
      [10],
      [20],
      [30],
    ]],
  ] as [string, string, unknown[][]][]
) {
  test(name, () =>
    withFunctionalConnection((connection) => {
      createTable(connection, {
        name: "iter_test",
        schema: "id INTEGER, name TEXT",
        rows: [[1, "a"], [2, "b"], [3, "c"]],
      });
      createTable(connection, {
        name: "iter_test2",
        schema: "id INTEGER",
        rows: [[10], [20], [30]],
      });
      const result = functional.executeSqlResult(connection, sql);
      try {
        const actual = [...functional.iterateRows(result)];
        assertEquals(actual, expected);
      } finally {
        result.close();
      }
    }));
}

for (
  const [name, sql, expected] of [
    ["iterateObjects yields row objects", "SELECT * FROM obj_test ORDER BY id", [{
      id: 1,
      name: "first",
    }, { id: 2, name: "second" }]],
    ["iterateObjects works with ResultReader", "SELECT * FROM obj_test2", [{
      a: 1,
      b: "x",
    }]],
  ] as [string, string, unknown[]][]
) {
  test(name, () =>
    withFunctionalConnection((connection) => {
      createTable(connection, {
        name: "obj_test",
        schema: "id INTEGER, name TEXT",
        rows: [[1, "first"], [2, "second"]],
      });
      createTable(connection, {
        name: "obj_test2",
        schema: "a INTEGER, b TEXT",
        rows: [[1, "x"]],
      });
      const result = functional.executeSqlResult(connection, sql);
      try {
        const actual = [...functional.iterateObjects(result)];
        assertEquals(actual, expected);
      } finally {
        result.close();
      }
    }));
}

for (
  const [name, sql, expected] of [
    ["iterateRows on empty result yields nothing", "SELECT 1 WHERE 1 = 0", []],
    ["iterateObjects on empty result yields nothing", "SELECT 1 AS x WHERE 1 = 0", []],
  ] as [string, string, unknown[]][]
) {
  test(name, () =>
    withFunctionalConnection((connection) => {
      const result = functional.executeSqlResult(connection, sql);
      try {
        const rows = name.startsWith("iterateRows")
          ? [...functional.iterateRows(result)]
          : [...functional.iterateObjects(result)];
        assertEquals(rows, expected);
      } finally {
        result.close();
      }
    }));
}

// ============================================
// Type Decoding (consolidated from api.test.ts)
// ============================================

test("integer and temporal types decode correctly", () =>
  withFunctionalConnection((connection) => {
    const rows = [
      ...functional.query(
        connection,
        `
      SELECT
        42::TINYINT AS tiny,
        1000::SMALLINT AS small,
        42::INTEGER AS int,
        42::BIGINT AS big,
        42::UTINYINT AS utiny,
        1000::USMALLINT AS usmall,
        42::UINTEGER AS uint,
        42::UBIGINT AS ubig,
        3.14::FLOAT AS flt,
        3.14159::DOUBLE AS dbl,
        '12:34:56'::TIME AS t,
        '2024-01-15 12:34:56.123456'::TIMESTAMP AS ts,
        INTERVAL '1 year 2 days 3 hours' AS span
    `,
      )!,
    ];

    assertEquals(rows[0][0], 42);
    assertEquals(rows[0][1], 1000);
    assertEquals(rows[0][2], 42);
    assertEquals(rows[0][3], 42n);
    assertEquals(rows[0][4], 42);
    assertEquals(rows[0][5], 1000);
    assertEquals(rows[0][6], 42);
    assertEquals(rows[0][7], 42n);
    assertEquals(rows[0][8], 3.140000104904175);
    assertEquals(rows[0][9], 3.14159);
    assertEquals(rows[0][10], "12:34:56");
    assertEquals(rows[0][11], "2024-01-15 12:34:56.123456");
    assertEquals(rows[0][12], { months: 12, days: 2, micros: 10800000000n });
  }));

test("decimal, blob, and bit decode correctly", () =>
  withFunctionalConnection((connection) => {
    const rows = [
      ...functional.query(
        connection,
        "SELECT 12.34::DECIMAL(10,2) AS amount, unhex('C0FFEE') AS payload, '10101'::BIT::VARCHAR AS bits",
      )!,
    ];

    assertEquals(rows, [
      ["12.34", new Uint8Array([0xC0, 0xFF, 0xEE]), "10101"],
    ]);
  }));

test("HUGEINT and UHUGEINT decode correctly", () =>
  withFunctionalConnection((connection) => {
    const rows = [
      ...functional.query(
        connection,
        `SELECT
          9223372036854775807::HUGEINT AS max_s64,
          -9223372036854775808::HUGEINT AS min_s64,
          9223372036854775808::UHUGEINT AS just_over_s64_max,
          18446744073709551615::UHUGEINT AS max_u64
        `,
      )!,
    ];

    assertEquals(rows[0][0], 9223372036854775807n);
    assertEquals(rows[0][1], -9223372036854775808n);
    assertEquals(rows[0][2], 9223372036854775808n);
    assertEquals(rows[0][3], 18446744073709551615n);
  }));

test("iterateRows works directly with LazyResult (not ResultReader)", () =>
  withFunctionalConnection((connection) => {
    createTable(connection, {
      name: "lazy_iter_test",
      schema: "id INTEGER, name TEXT",
      rows: [[1, "first"], [2, "second"]],
    });
    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM lazy_iter_test ORDER BY id",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows, [[1, "first"], [2, "second"]]);
    } finally {
      result.close();
    }
  }));

test("iterateObjects works directly with LazyResult (not ResultReader)", () =>
  withFunctionalConnection((connection) => {
    createTable(connection, {
      name: "lazy_obj_test",
      schema: "id INTEGER, name TEXT",
      rows: [[1, "one"], [2, "two"]],
    });
    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM lazy_obj_test ORDER BY id",
    );
    try {
      const objects = [...functional.iterateObjects(result)];
      assertEquals(objects, [{ id: 1, name: "one" }, { id: 2, name: "two" }]);
    } finally {
      result.close();
    }
  }));

test("getInt32 returns truncated integer", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT 42.9::DOUBLE, -42.9::DOUBLE",
    );
    try {
      const reader = result.reader();
      assertEquals(functional.getInt32(reader, 0, 0), 42);
      assertEquals(functional.getInt32(reader, 0, 1), -42);
    } finally {
      result.close();
    }
  }));

test("empty result set yields zero rows from iterator", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT 1 AS x WHERE 1 = 0",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows, []);
    } finally {
      result.close();
    }
  }));

test("BLOB decode with valid hex string", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT unhex('DEADBEEF') AS blob_data",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows[0][0], new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]));
    } finally {
      result.close();
    }
  }));

test("UUID type decodes (tests UUID branch coverage)", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows.length, 1);
    } finally {
      result.close();
    }
  }));

test("BIT type decodes as string", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT '101010'::BIT::VARCHAR",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows[0][0], "101010");
    } finally {
      result.close();
    }
  }));

test("DATE type decodes correctly", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT '2024-12-25'::DATE",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows[0][0], "2024-12-25");
    } finally {
      result.close();
    }
  }));

test("TIME type with microseconds decodes correctly", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT '12:34:56.123456'::TIME",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows[0][0], "12:34:56.123456");
    } finally {
      result.close();
    }
  }));

test("TIME type without microseconds omits decimal part", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT '12:34:56'::TIME",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows[0][0], "12:34:56");
    } finally {
      result.close();
    }
  }));

test("TIMESTAMP_NS type decodes (testing coverage of NS branch)", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT '2024-01-15 12:34:56.123456'::TIMESTAMP_NS",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows.length, 1);
    } finally {
      result.close();
    }
  }));

test("INTERVAL with zero micros omits decimal", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT INTERVAL '1 year 2 days'",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows[0][0], { months: 12, days: 2, micros: 0n });
    } finally {
      result.close();
    }
  }));

test("TIMESTAMP_S type decodes (testing coverage of S branch)", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT '2024-01-15 12:34:56'::TIMESTAMP_S",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows.length, 1);
    } finally {
      result.close();
    }
  }));

test("TIMESTAMP_MS type decodes (testing coverage of MS branch)", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT '2024-01-15 12:34:56.123'::TIMESTAMP_MS",
    );
    try {
      const rows = [...functional.iterateRows(result)];
      assertEquals(rows.length, 1);
    } finally {
      result.close();
    }
  }));

test("getValue rejects invalid column index", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(connection, "SELECT 1, 2, 3");
    try {
      const reader = result.reader();
      assertThrows(
        () => functional.getValue(reader, 0, 5),
        Error,
        "Column index",
      );
    } finally {
      result.close();
    }
  }));

test("ResultReader.rowCount returns correct count", () =>
  withFunctionalConnection((connection) => {
    createTable(connection, {
      name: "count_test",
      schema: "id INTEGER",
      rows: [[1], [2], [3], [4], [5]],
    });
    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM count_test",
    );
    try {
      const reader = result.reader();
      assertEquals(reader.rowCount, 5n);
    } finally {
      result.close();
    }
  }));

test("ResultReader.columnCount returns correct count", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT 1 AS a, 2 AS b, 3 AS c",
    );
    try {
      const reader = result.reader();
      assertEquals(reader.columnCount, 3);
    } finally {
      result.close();
    }
  }));

test("ResultReader.columns returns column metadata", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT 1 AS id, 'hello' AS name",
    );
    try {
      const reader = result.reader();
      const columns = reader.columns;
      assertEquals(columns.length, 2);
      assertEquals(columns[0].name, "id");
      assertEquals(columns[1].name, "name");
    } finally {
      result.close();
    }
  }));

test("getRow returns array of values for a row", () =>
  withFunctionalConnection((connection) => {
    createTable(connection, {
      name: "row_test",
      schema: "a INTEGER, b TEXT",
      rows: [[1, "hello"]],
    });
    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM row_test",
    );
    try {
      const reader = result.reader();
      const row = reader.getRow(0);
      assertEquals(row, [1, "hello"]);
    } finally {
      result.close();
    }
  }));

test("getObjectRow returns object for a row", () =>
  withFunctionalConnection((connection) => {
    createTable(connection, {
      name: "obj_row_test",
      schema: "x INTEGER, y TEXT",
      rows: [[42, "answer"]],
    });
    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM obj_row_test",
    );
    try {
      const reader = result.reader();
      const row = reader.getObjectRow(0);
      assertEquals(row, { x: 42, y: "answer" });
    } finally {
      result.close();
    }
  }));

test("toArray returns array of arrays", () =>
  withFunctionalConnection((connection) => {
    createTable(connection, {
      name: "to_array_test",
      schema: "id INTEGER",
      rows: [[1], [2], [3]],
    });
    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM to_array_test",
    );
    try {
      const reader = result.reader();
      const arr = reader.toArray();
      assertEquals(arr, [[1], [2], [3]]);
    } finally {
      result.close();
    }
  }));

test("toObjectArray returns array of objects", () =>
  withFunctionalConnection((connection) => {
    createTable(connection, {
      name: "to_obj_array_test",
      schema: "id INTEGER, name TEXT",
      rows: [[1, "one"], [2, "two"]],
    });
    const result = functional.executeSqlResult(
      connection,
      "SELECT * FROM to_obj_array_test ORDER BY id",
    );
    try {
      const reader = result.reader();
      const arr = reader.toObjectArray();
      assertEquals(arr, [{ id: 1, name: "one" }, { id: 2, name: "two" }]);
    } finally {
      result.close();
    }
  }));

test("getValue returns INVALID type as null", () =>
  withFunctionalConnection((connection) => {
    const result = functional.executeSqlResult(
      connection,
      "SELECT NULL::INTEGER",
    );
    try {
      const reader = result.reader();
      assertEquals(functional.getValue(reader, 0, 0), null);
    } finally {
      result.close();
    }
  }));
