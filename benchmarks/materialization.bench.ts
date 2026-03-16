/**
 * Benchmark script comparing query performance across the APIs.
 *
 * Modes:
 * - execution-only: execute query/statement, verify row count, destroy result
 * - execution+materialize: execute, fetch rows, force full decoding via checksum
 */

import { functional, objective } from "@ggpwnkthx/duckdb";

const QUERY = "select i, i as a from generate_series(1, 100000) s(i)";
const PREP_QUERY = "select i, i as a from generate_series(1, ?) s(i)";

const EXPECTED_ROWS = 100_000;
const EXPECTED_CHECKSUM = 100_000n * (100_000n + 1n);

type CellValue = unknown;
type RowLike = ArrayLike<CellValue>;
type RowsLike = ArrayLike<RowLike>;

function asBigIntCell(value: unknown, label: string): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return BigInt(value);
  }

  throw new TypeError(`${label} must be bigint or a safe integer number`);
}

function assertRowCount(actual: number): void {
  if (actual !== EXPECTED_ROWS) {
    throw new Error(`Expected ${EXPECTED_ROWS} rows, got ${actual}`);
  }
}

function checksumRows(rows: RowsLike): bigint {
  let checksum = 0n;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    if (row.length < 2) {
      throw new Error(`Row ${rowIndex} has fewer than 2 columns`);
    }

    checksum += asBigIntCell(row[0], `rows[${rowIndex}][0]`);
    checksum += asBigIntCell(row[1], `rows[${rowIndex}][1]`);
  }

  return checksum;
}

function assertMaterializedRows(rows: RowsLike): void {
  if (rows.length !== EXPECTED_ROWS) {
    throw new Error(`Expected ${EXPECTED_ROWS} rows, got ${rows.length}`);
  }

  const checksum = checksumRows(rows);

  if (checksum !== EXPECTED_CHECKSUM) {
    throw new Error(
      `Expected checksum ${EXPECTED_CHECKSUM}, got ${checksum}`,
    );
  }
}

const dbHandleFunc = await functional.open();
const connHandleFunc = await functional.create(dbHandleFunc);

const dbObj = new objective.Database();
const connObj = await dbObj.connect();

const preparedHandleFunc = functional.prepare(connHandleFunc, PREP_QUERY);
const preparedObj = connObj.prepare(PREP_QUERY);

// Standard Query: Uses functional.executeSqlResult which returns LazyResult
Deno.bench("Standard Query: Functional API (execution-only)", () => {
  const result = functional.executeSqlResult(connHandleFunc, QUERY);

  if (result === null) {
    throw new Error("Query returned null");
  }
  assertRowCount(result.rowCount);
  result.close();
});

Deno.bench(
  "Standard Query: Functional API (execution + materialization)",
  () => {
    const result = functional.executeSqlResult(connHandleFunc, QUERY);

    if (result === null) {
      throw new Error("Query returned null");
    }
    const rows = result.toArray();
    assertMaterializedRows(rows);
    result.close();
  },
);

Deno.bench("Standard Query: Objective API (execution-only)", () => {
  const result = connObj.execute(QUERY);

  if (result === null) {
    throw new Error("Query returned null");
  }
  assertRowCount(Number(result.rowCount()));
  result.close();
});

Deno.bench(
  "Standard Query: Objective API (execution + materialization)",
  () => {
    const result = connObj.execute(QUERY);

    if (result === null) {
      throw new Error("Query returned null");
    }
    const rows = result.fetchAll();
    assertMaterializedRows(rows);
    result.close();
  },
);

// Prepared Statement: Uses executePrepared which returns LazyResult
Deno.bench(
  "Prepared Statement: Functional API (prepared once, execution-only)",
  () => {
    functional.bind(preparedHandleFunc, [EXPECTED_ROWS]);

    const result = functional.executePreparedResult(preparedHandleFunc);

    try {
      const rowCount = result.rowCount;
      assertRowCount(rowCount);
    } finally {
      result.close();
    }
  },
);

Deno.bench(
  "Prepared Statement: Functional API (prepared once, execution + materialization)",
  () => {
    functional.bind(preparedHandleFunc, [EXPECTED_ROWS]);

    const result = functional.executePreparedResult(preparedHandleFunc);

    try {
      const rows = result.toArray();
      assertMaterializedRows(rows);
    } finally {
      result.close();
    }
  },
);

Deno.bench(
  "Prepared Statement: Objective API (prepared once, execution-only)",
  () => {
    preparedObj.bind([EXPECTED_ROWS]);
    const result = preparedObj.execute();

    try {
      const rowCount = Number(result.rowCount());
      assertRowCount(rowCount);
    } finally {
      result.close();
    }
  },
);

Deno.bench(
  "Prepared Statement: Objective API (prepared once, execution + materialization)",
  () => {
    preparedObj.bind([EXPECTED_ROWS]);
    const result = preparedObj.execute();

    try {
      const rows = result.fetchAll();
      assertMaterializedRows(rows);
    } finally {
      result.close();
    }
  },
);

Deno.bench(
  "Prepared Statement: Full cycle (Functional, execution-only)",
  () => {
    const stmtHandle = functional.prepare(connHandleFunc, PREP_QUERY);

    try {
      functional.bind(stmtHandle, [EXPECTED_ROWS]);

      const result = functional.executePreparedResult(stmtHandle);

      try {
        const rowCount = result.rowCount;
        assertRowCount(rowCount);
      } finally {
        result.close();
      }
    } finally {
      functional.destroyPrepared(stmtHandle);
    }
  },
);

Deno.bench(
  "Prepared Statement: Full cycle (Functional, execution + materialization)",
  () => {
    const stmtHandle = functional.prepare(connHandleFunc, PREP_QUERY);

    try {
      functional.bind(stmtHandle, [EXPECTED_ROWS]);

      const result = functional.executePreparedResult(stmtHandle);

      try {
        const rows = result.toArray();
        assertMaterializedRows(rows);
      } finally {
        result.close();
      }
    } finally {
      functional.destroyPrepared(stmtHandle);
    }
  },
);

Deno.bench(
  "Prepared Statement: Full cycle (Objective, execution-only)",
  () => {
    const stmt = connObj.prepare(PREP_QUERY);

    try {
      stmt.bind([EXPECTED_ROWS]);
      const result = stmt.execute();

      try {
        const rowCount = Number(result.rowCount());
        assertRowCount(rowCount);
      } finally {
        result.close();
      }
    } finally {
      stmt.close();
    }
  },
);

Deno.bench(
  "Prepared Statement: Full cycle (Objective, execution + materialization)",
  () => {
    const stmt = connObj.prepare(PREP_QUERY);

    try {
      stmt.bind([EXPECTED_ROWS]);
      const result = stmt.execute();

      try {
        const rows = result.fetchAll();
        assertMaterializedRows(rows);
      } finally {
        result.close();
      }
    } finally {
      stmt.close();
    }
  },
);

addEventListener("unload", () => {
  try {
    functional.destroyPrepared(preparedHandleFunc);
  } catch {
    // ignore shutdown cleanup errors
  }

  try {
    preparedObj.close();
  } catch {
    // ignore shutdown cleanup errors
  }

  try {
    connObj.close();
  } catch {
    // ignore shutdown cleanup errors
  }

  try {
    dbObj.close();
  } catch {
    // ignore shutdown cleanup cleanup errors
  }

  try {
    functional.closeConnection(connHandleFunc);
  } catch {
    // ignore shutdown cleanup errors
  }

  try {
    functional.closeDatabase(dbHandleFunc);
  } catch {
    // ignore shutdown cleanup errors
  }
});
