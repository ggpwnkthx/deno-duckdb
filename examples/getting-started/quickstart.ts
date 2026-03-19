/**
 * Example: Quickstart - Basic queries, joins, and aggregations
 *
 * This example demonstrates:
 * - Creating tables and inserting data
 * - Basic SELECT queries with sorting
 * - JOINs between multiple tables
 * - GROUP BY aggregations
 * - Prepared statements for parameterized queries
 * - Both Functional and Objective APIs
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import type { ObjectRow } from "@ggpwnkthx/duckdb";

import { printList, printSection } from "../shared/console.ts";

// =============================================================================
// SQL Statements
// =============================================================================

const CREATE_PRODUCTS = `
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  category VARCHAR,
  price DECIMAL(10, 2)
);
`;

const CREATE_CUSTOMERS = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  email VARCHAR
);
`;

const CREATE_ORDERS = `
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  order_date DATE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`;

const INSERT_PRODUCTS = `
INSERT INTO products VALUES
  (1, 'Laptop', 'Electronics', 999.99),
  (2, 'Mouse', 'Electronics', 29.99),
  (3, 'Keyboard', 'Electronics', 79.99),
  (4, 'Desk', 'Furniture', 299.99),
  (5, 'Chair', 'Furniture', 199.99);
`;

const INSERT_CUSTOMERS = `
INSERT INTO customers VALUES
  (1, 'Alice', 'alice@example.com'),
  (2, 'Bob', 'bob@example.com'),
  (3, 'Charlie', 'charlie@example.com');
`;

const INSERT_ORDERS = `
INSERT INTO orders VALUES
  (1, 1, 1, 1, '2024-01-15'),
  (2, 1, 2, 2, '2024-01-15'),
  (3, 2, 1, 1, '2024-02-20'),
  (4, 2, 4, 1, '2024-02-20'),
  (5, 3, 3, 1, '2024-03-10');
`;

// =============================================================================
// Query Statements
// =============================================================================

const PRODUCTS_BY_PRICE = `
SELECT
  name,
  price,
  category
FROM products
ORDER BY price DESC;
`;

const ORDER_DETAILS = `
SELECT
  o.id AS order_id,
  c.name AS customer_name,
  p.name AS product_name,
  o.quantity,
  o.order_date,
  p.price * o.quantity AS total
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id
ORDER BY o.order_date, o.id;
`;

const CUSTOMER_TOTALS = `
SELECT
  c.name AS customer_name,
  SUM(p.price * o.quantity) AS total_spent,
  COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN products p ON o.product_id = p.id
GROUP BY c.id, c.name
ORDER BY total_spent DESC NULLS LAST, c.name;
`;

const ELECTRONICS_BY_PRICE = `
SELECT
  name,
  price
FROM products
WHERE category = 'Electronics'
ORDER BY price DESC;
`;

const ORDERS_BY_DATE_RANGE = `
SELECT *
FROM orders
WHERE order_date BETWEEN ? AND ?
ORDER BY order_date, id;
`;

// =============================================================================
// Helper Functions
// =============================================================================

function execFunctional(
  connection: Parameters<typeof functional.query>[0],
  sql: string,
): void {
  const result = functional.query(connection, sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql.substring(0, 50)}...`);
  }
}

function _execObjective(connection: objective.Connection, sql: string): void {
  const result = connection.query(sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql.substring(0, 50)}...`);
  }
}

function queryFunctionalObjects(
  connection: Parameters<typeof functional.query>[0],
  sql: string,
): ObjectRow[] {
  const result = functional.queryObjects(connection, sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql.substring(0, 50)}...`);
  }
  return [...result];
}

function queryObjectiveObjects(
  connection: objective.Connection,
  sql: string,
): ObjectRow[] {
  const result = connection.execute(sql);
  const rows = [...result.objects()];
  result.close();
  return rows;
}

// =============================================================================
// Main Example
// =============================================================================

printSection("DuckDB Quickstart - Basic Queries");

// =============================================================================
// Functional API Example
// =============================================================================

console.log("\n=== Functional API ===");

const functionalDb = await functional.open();
try {
  const functionalConn = await functional.connectToDatabase(functionalDb);

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

    console.log("Tables created and data inserted");

    printSection("Products by price");
    printList(
      queryFunctionalObjects(functionalConn, PRODUCTS_BY_PRICE),
      (row) => `  ${row.name}: $${row.price} (${row.category})`,
    );

    printSection("Order details (JOIN example)");
    printList(
      queryFunctionalObjects(functionalConn, ORDER_DETAILS),
      (row) =>
        `  Order ${row.order_id}: ${row.customer_name} bought ${row.product_name} x${row.quantity} on ${row.order_date} ($${row.total})`,
    );

    printSection("Customer totals (GROUP BY example)");
    printList(
      queryFunctionalObjects(functionalConn, CUSTOMER_TOTALS),
      (row) => {
        const total = row.total_spent ?? "0";
        const count = row.order_count ?? 0;
        return `  ${row.customer_name}: $${total} (${count} orders)`;
      },
    );

    printSection("Electronics by price (WHERE clause)");
    printList(
      queryFunctionalObjects(functionalConn, ELECTRONICS_BY_PRICE),
      (row) => `  ${row.name}: $${row.price}`,
    );

    printSection("Orders between 2024-01-01 and 2024-02-29 (Prepared Statement)");
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
        functional.destroy(result);
      }
    } finally {
      functional.destroyPrepared(rangeStatement);
    }
  } finally {
    functional.closeConnection(functionalConn);
  }
} finally {
  functional.closeDatabase(functionalDb);
}

// =============================================================================
// Objective API Example
// =============================================================================

console.log("\n=== Objective API ===");

const objectiveDb = new objective.Database();
try {
  const objectiveConn = await objectiveDb.connect();

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
      objectiveConn.query(sql);
    }

    console.log("Tables created and data inserted");

    printSection("Products by price");
    printList(
      queryObjectiveObjects(objectiveConn, PRODUCTS_BY_PRICE),
      (row) => `  ${row.name}: $${row.price} (${row.category})`,
    );

    printSection("Order details (JOIN example)");
    printList(
      queryObjectiveObjects(objectiveConn, ORDER_DETAILS),
      (row) =>
        `  Order ${row.order_id}: ${row.customer_name} bought ${row.product_name} x${row.quantity} on ${row.order_date} ($${row.total})`,
    );

    printSection("Customer totals (GROUP BY example)");
    printList(
      queryObjectiveObjects(objectiveConn, CUSTOMER_TOTALS),
      (row) => {
        const total = row.total_spent ?? "0";
        const count = row.order_count ?? 0;
        return `  ${row.customer_name}: $${total} (${count} orders)`;
      },
    );

    printSection("Electronics by price (WHERE clause)");
    printList(
      queryObjectiveObjects(objectiveConn, ELECTRONICS_BY_PRICE),
      (row) => `  ${row.name}: $${row.price}`,
    );

    printSection("Orders between 2024-01-01 and 2024-02-29 (Prepared Statement)");
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
