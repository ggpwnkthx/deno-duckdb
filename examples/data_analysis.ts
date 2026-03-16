/**
 * Example: Data analysis with the production-ready APIs.
 *
 * Demonstrates:
 * - explicit result management in the functional API
 * - higher-level row/object helpers in the objective API
 * - prepared statements with positional parameters
 * - exact decimal handling without SQL casts
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import { type Connection, Database } from "@ggpwnkthx/duckdb/objective";
import type { ObjectRow } from "@ggpwnkthx/duckdb";

import {
  ALL_ORDERS,
  CREATE_CUSTOMERS,
  CREATE_ORDERS,
  CREATE_PRODUCTS,
  CUSTOMER_TOTALS,
  ELECTRONICS_BY_PRICE,
  INSERT_CUSTOMERS,
  INSERT_ORDERS,
  INSERT_PRODUCTS,
  ORDER_DETAILS,
  ORDERS_BY_DATE_RANGE,
  PRODUCTS_BY_PRICE,
} from "./shared/data_analysis.ts";

function printSection(title: string): void {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
}

function printProductRows(rows: readonly ObjectRow[]): void {
  for (const row of rows) {
    console.log(`  ${row.name}: $${row.price} (${row.category})`);
  }
}

function printOrderRows(rows: readonly ObjectRow[]): void {
  for (const row of rows) {
    console.log(
      `  Order ${row.order_id}: ${row.customer_name} bought ${row.product_name} x${row.quantity} on ${row.order_date} ($${row.total})`,
    );
  }
}

function printCustomerTotals(rows: readonly ObjectRow[]): void {
  for (const row of rows) {
    const total = row.total_spent ?? "0";
    const count = row.order_count ?? 0;
    console.log(`  ${row.customer_name}: $${total} (${count} orders)`);
  }
}

function execFunctional(
  connection: Parameters<typeof functional.query>[0],
  sql: string,
): void {
  // Use cached query for DDL - returns null on success
  const result = functional.query(connection, sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql}`);
  }
}

function queryFunctionalObjects(
  connection: Parameters<typeof functional.query>[0],
  sql: string,
): ObjectRow[] {
  // Use queryObjects for object format - returns iterator, convert to array
  const result = functional.queryObjects(connection, sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql}`);
  }
  return [...result];
}

function queryObjectiveObjects(connection: Connection, sql: string): ObjectRow[] {
  // Use queryResult for QueryResult features
  const result = connection.execute(sql);
  const rows = [...result.objects()];
  result.close();
  return rows;
}

console.log("=== Functional API ===");

const functionalDb = await functional.open();
try {
  const functionalConn = await functional.create(functionalDb);

  try {
    for (
      const sql of [
        CREATE_PRODUCTS,
        CREATE_CUSTOMERS,
        CREATE_ORDERS,
        INSERT_PRODUCTS,
        INSERT_CUSTOMERS,
        INSERT_ORDERS,
      ]
    ) {
      execFunctional(functionalConn, sql);
    }

    console.log("\nTables created and data inserted");

    printSection("Products by price");
    printProductRows(queryFunctionalObjects(functionalConn, PRODUCTS_BY_PRICE));

    printSection("Order details");
    printOrderRows(queryFunctionalObjects(functionalConn, ORDER_DETAILS));

    printSection("Customer totals");
    printCustomerTotals(queryFunctionalObjects(functionalConn, CUSTOMER_TOTALS));

    printSection("Electronics by price");
    for (const row of queryFunctionalObjects(functionalConn, ELECTRONICS_BY_PRICE)) {
      console.log(`  ${row.name}: $${row.price}`);
    }

    printSection("Orders between 2024-01-01 and 2024-02-29");
    const rangeStatement = functional.prepare(functionalConn, ORDERS_BY_DATE_RANGE);
    try {
      functional.bind(rangeStatement, ["2024-01-01", "2024-02-29"]);
      const result = functional.executePrepared(rangeStatement);

      try {
        const reader = functional.createResultReader(result);
        for (const row of functional.iterateObjects(reader)) {
          console.log(
            `  Order ${row.id}: customer=${row.customer_id}, product=${row.product_id}, quantity=${row.quantity}, date=${row.order_date}`,
          );
        }
      } finally {
        functional.destroyResult(result);
      }
    } finally {
      functional.destroyPrepared(rangeStatement);
    }

    printSection("All orders");
    for (const row of queryFunctionalObjects(functionalConn, ALL_ORDERS)) {
      console.log(
        `  ${row.id}: customer=${row.customer_id}, product=${row.product_id}, quantity=${row.quantity}, date=${row.order_date}`,
      );
    }
  } finally {
    functional.closeConnection(functionalConn);
  }
} finally {
  functional.closeDatabase(functionalDb);
}

console.log("\n=== Objective API ===");

const objectiveDb = new Database();
try {
  const objectiveConn = await objectiveDb.connect();

  try {
    // DDL: use cached query (returns null on success)
    for (
      const sql of [
        CREATE_PRODUCTS,
        CREATE_CUSTOMERS,
        CREATE_ORDERS,
        INSERT_PRODUCTS,
        INSERT_CUSTOMERS,
        INSERT_ORDERS,
      ]
    ) {
      objectiveConn.query(sql);
    }

    console.log("\nTables created and data inserted");

    printSection("Products by price");
    printProductRows(queryObjectiveObjects(objectiveConn, PRODUCTS_BY_PRICE));

    printSection("Order details");
    printOrderRows(queryObjectiveObjects(objectiveConn, ORDER_DETAILS));

    printSection("Customer totals");
    printCustomerTotals(queryObjectiveObjects(objectiveConn, CUSTOMER_TOTALS));

    printSection("Orders between 2024-01-01 and 2024-02-29");
    const statement = objectiveConn.prepare(ORDERS_BY_DATE_RANGE);
    try {
      const result = statement
        .bind(["2024-01-01", "2024-02-29"])
        .execute();

      try {
        for (const row of result.objects()) {
          console.log(
            `  Order ${row.id}: customer=${row.customer_id}, product=${row.product_id}, quantity=${row.quantity}, date=${row.order_date}`,
          );
        }
      } finally {
        result.close();
      }
    } finally {
      statement.close();
    }
  } finally {
    objectiveConn.close();
  }
} finally {
  objectiveDb.close();
}

console.log("\nAll done!");
