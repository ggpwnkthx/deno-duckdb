/**
 * Example: Window Functions - Rankings, running totals, and moving averages
 *
 * This example demonstrates DuckDB's window functions with:
 * - RANK, DENSE_RANK, PERCENT_RANK for customer rankings
 * - SUM OVER for running totals
 * - AVG OVER for moving averages
 * - LAG for comparing with previous periods
 */

import * as objective from "@ggpwnkthx/duckdb/objective";
import type { ObjectRow } from "@ggpwnkthx/duckdb";

import { printSection, printSuccess, printTable } from "../shared/console.ts";

// =============================================================================
// SQL Statements
// =============================================================================

const CREATE_PRODUCTS_LARGE = `
CREATE TABLE products_large (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  category VARCHAR,
  price DECIMAL(10, 2)
);
`;

const GENERATE_PRODUCTS_DATA = `
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

const GENERATE_ORDER_DATA = `
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

// Window function queries

const CUSTOMER_RANKING = `
WITH customer_spend AS (
  SELECT
    customer_id,
    SUM(quantity * (SELECT price FROM products_large WHERE id = product_id)) AS total_spent,
    COUNT(*) AS order_count
  FROM order_events
  GROUP BY customer_id
)
SELECT
  customer_id,
  ROUND(total_spent, 2) AS total_spent,
  order_count,
  RANK() OVER (ORDER BY total_spent DESC) AS spend_rank,
  DENSE_RANK() OVER (ORDER BY total_spent DESC) AS dense_rank,
  ROUND(PERCENT_RANK() OVER (ORDER BY total_spent DESC), 3) AS percentile_rank,
  ROUND(100.0 * total_spent / SUM(total_spent) OVER (), 2) AS pct_of_total
FROM customer_spend
ORDER BY total_spent DESC
LIMIT 20;
`;

const DAILY_REVENUE_TRENDS = `
WITH daily_revenue AS (
  SELECT
    order_date,
    SUM(quantity * (SELECT price FROM products_large WHERE id = product_id) * (1 - discount_pct / 100)) AS daily_revenue,
    COUNT(*) AS order_count
  FROM order_events
  GROUP BY order_date
)
SELECT
  order_date,
  ROUND(daily_revenue, 2) AS daily_revenue,
  order_count,
  ROUND(SUM(daily_revenue) OVER (ORDER BY order_date), 2) AS running_total_revenue,
  ROUND(AVG(daily_revenue) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 2) AS moving_avg_7day,
  ROUND(LAG(daily_revenue, 1) OVER (ORDER BY order_date), 2) AS prev_day_revenue,
  ROUND(
    (daily_revenue - LAG(daily_revenue, 1) OVER (ORDER BY order_date)) /
    NULLIF(LAG(daily_revenue, 1) OVER (ORDER BY order_date), 0) * 100,
    2
  ) AS pct_change_vs_prev_day
FROM daily_revenue
ORDER BY order_date
LIMIT 30;
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

printSection("DuckDB Window Functions Example");

const db = new objective.Database();
try {
  const conn = await db.connect();

  // Setup: Generate sample data
  printSection("Step 1: Generating Sample Data");
  console.log("Creating e-commerce data using DuckDB's generators...");

  execObjective(conn, CREATE_PRODUCTS_LARGE);
  execObjective(conn, GENERATE_PRODUCTS_DATA);
  execObjective(conn, CREATE_ORDERS);
  execObjective(conn, GENERATE_ORDER_DATA);

  printSuccess("Generated 500 products");
  printSuccess("Generated 10,000 order events");

  // Window Functions - Customer Ranking
  printSection("Step 2: Window Functions - Customer Rankings");
  console.log("Ranking customers by total spend with percentile rankings...");

  const customerRanking = queryObjectiveObjects(conn, CUSTOMER_RANKING);
  printTable(customerRanking.slice(0, 10), { title: "Top 10 Customers by Spend" });

  // Window Functions - Running Totals and Moving Averages
  printSection("Step 3: Time-Series - Running Totals & Moving Averages");
  console.log("Daily revenue with running totals and 7-day moving average...");

  const dailyTrends = queryObjectiveObjects(conn, DAILY_REVENUE_TRENDS);
  printTable(dailyTrends.slice(0, 10), { title: "First 10 Days" });

  // Show some insights
  console.log("\n  Insights:");
  console.log("  - running_total_revenue: Cumulative sum of daily revenue");
  console.log("  - moving_avg_7day: Average of current + 6 previous days");
  console.log("  - pct_change_vs_prev_day: Day-over-day percentage change");

  conn.close();
} finally {
  db.close();
}
