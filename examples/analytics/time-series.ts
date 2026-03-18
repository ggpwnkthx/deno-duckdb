/**
 * Example: Time-Series Analysis - Monthly trends and MoM growth
 *
 * This example demonstrates DuckDB's time-series capabilities:
 * - DATE_TRUNC for aggregating by time periods
 * - LAG for calculating period-over-period growth
 * - Multiple aggregations (revenue, customers, orders)
 */

import * as objective from "@ggpwnkthx/duckdb/objective";
import type { ObjectRow } from "@ggpwnkthx/duckdb";

import { printSection, printSuccess, printTable } from "../shared/console.ts";

// =============================================================================
// SQL Statements
// =============================================================================

const CREATE_PRODUCTS = `
CREATE TABLE products_large (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  category VARCHAR,
  price DECIMAL(10, 2)
);
`;

const GENERATE_PRODUCTS = `
INSERT INTO products_large
SELECT
  i AS id,
  'Product-' || i AS name,
  CASE (i % 5)
    WHEN 0 THEN 'Electronics'
    WHEN 1 THEN 'Clothing'
    WHEN 2 THEN 'Home & Garden'
    WHEN 3 THEN 'Sports'
    ELSE 'Books'
  END AS category,
  (RANDOM() * 500 + 10)::DECIMAL(10, 2) AS price
FROM generate_series(1, 500) t(i);
`;

const CREATE_ORDERS = `
CREATE TABLE order_events (
  order_id INTEGER,
  customer_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  order_date DATE,
  discount_pct DECIMAL(5, 2)
);
`;

const GENERATE_ORDERS = `
INSERT INTO order_events
SELECT
  i AS order_id,
  (RANDOM() * 999 + 1)::INTEGER AS customer_id,
  (RANDOM() * 499 + 1)::INTEGER AS product_id,
  (RANDOM() * 9 + 1)::INTEGER AS quantity,
  DATE '2022-01-01' + (RANDOM() * 730)::INTEGER AS order_date,
  (RANDOM() * 30)::DECIMAL(5, 2) AS discount_pct
FROM generate_series(1, 10000) t(i);
`;

// Time-series queries

const MONTHLY_REVENUE_ANALYSIS = `
WITH monthly_data AS (
  SELECT
    DATE_TRUNC('month', order_date) AS month,
    SUM(quantity * (SELECT price FROM products_large WHERE id = product_id) * (1 - discount_pct / 100)) AS revenue,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(*) AS total_orders
  FROM order_events
  GROUP BY DATE_TRUNC('month', order_date)
)
SELECT
  month,
  ROUND(revenue, 2) AS revenue,
  unique_customers,
  total_orders,
  ROUND(revenue / total_orders, 2) AS avg_order_value,
  LAG(revenue, 1) OVER (ORDER BY month) AS prev_month_revenue,
  ROUND(
    (revenue - LAG(revenue, 1) OVER (ORDER BY month)) /
    NULLIF(LAG(revenue, 1) OVER (ORDER BY month), 0) * 100,
    2
  ) AS mom_growth_pct
FROM monthly_data
ORDER BY month;
`;

// =============================================================================
// Helper Functions
// =============================================================================

function execObjective(connection: objective.Connection, sql: string): void {
  const result = connection.query(sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql.substring(0, 50)}...`);
  }
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

printSection("DuckDB Time-Series Analysis Example");

const db = new objective.Database();
try {
  const conn = await db.connect();

  // Setup: Generate sample data
  printSection("Step 1: Generating Sample Data");
  console.log("Creating e-commerce data using DuckDB's generators...");

  execObjective(conn, CREATE_PRODUCTS);
  execObjective(conn, GENERATE_PRODUCTS);
  execObjective(conn, CREATE_ORDERS);
  execObjective(conn, GENERATE_ORDERS);

  printSuccess("Generated 500 products");
  printSuccess("Generated 10,000 order events");

  // Monthly Revenue Analysis
  printSection("Step 2: Monthly Revenue with Month-over-Month Growth");
  console.log("Monthly aggregated revenue with MoM growth percentages...");

  const monthlyRevenue = queryObjectiveObjects(conn, MONTHLY_REVENUE_ANALYSIS);
  printTable(monthlyRevenue, { title: "Monthly Revenue Trend" });

  // Show some insights
  console.log("\n  Key Metrics:");
  console.log("  - revenue: Total monthly revenue after discounts");
  console.log("  - unique_customers: Distinct customers who placed orders");
  console.log("  - total_orders: Number of orders in the month");
  console.log("  - avg_order_value: Average revenue per order");
  console.log("  - mom_growth_pct: Month-over-month growth percentage");

  conn.close();
} finally {
  db.close();
}
