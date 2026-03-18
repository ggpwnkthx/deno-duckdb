/**
 * Example: Parquet, Statistics, and Cohort Analysis
 *
 * This example demonstrates:
 * - Parquet file export and query
 * - Statistical functions (correlation, percentiles, stddev)
 * - Cohort analysis for customer retention
 * - Lazy iteration for on-demand row decoding
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

const CREATE_CUSTOMERS = `
CREATE TABLE customers_large (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  segment VARCHAR,
  join_date DATE
);
`;

const GENERATE_CUSTOMERS = `
INSERT INTO customers_large
SELECT
  i AS id,
  'Customer-' || i AS name,
  CASE (RANDOM() * 3)::INTEGER
    WHEN 0 THEN 'Premium'
    WHEN 1 THEN 'Regular'
    ELSE 'New'
  END AS segment,
  DATE '2020-01-01' + (RANDOM() * 1500)::INTEGER AS join_date
FROM generate_series(1, 1000) t(i);
`;

const CREATE_ORDERS = `
CREATE TABLE order_events (
  order_id INTEGER,
  customer_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  order_date DATE,
  discount_pct DECIMAL(5, 2),
  shipping_method VARCHAR
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
  (RANDOM() * 30)::DECIMAL(5, 2) AS discount_pct,
  CASE (RANDOM() * 2)::INTEGER
    WHEN 0 THEN 'standard'
    WHEN 1 THEN 'express'
    ELSE 'overnight'
  END AS shipping_method
FROM generate_series(1, 10000) t(i);
`;

// Statistical functions query

const ORDER_VALUE_STATISTICS = `
WITH order_values AS (
  SELECT
    order_id,
    customer_id,
    SUM(quantity * (SELECT price FROM products_large WHERE id = product_id) * (1 - discount_pct / 100)) AS order_value,
    SUM(quantity) AS total_items
  FROM order_events
  GROUP BY order_id, customer_id
)
SELECT
  -- Summary statistics
  COUNT(*) AS total_orders,
  ROUND(AVG(order_value), 2) AS avg_order_value,
  ROUND(MEDIAN(order_value), 2) AS median_order_value,
  ROUND(STDDEV_POP(order_value), 2) AS stddev_order_value,
  MIN(order_value) AS min_order_value,
  MAX(order_value) AS max_order_value,
  -- Percentiles
  ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY order_value), 2) AS p25_order_value,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY order_value), 2) AS p75_order_value,
  ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY order_value), 2) AS p90_order_value,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY order_value), 2) AS p95_order_value,
  -- Correlation between items and value
  ROUND(CORR(total_items, order_value), 4) AS correlation_items_value
FROM order_values;
`;

// Parquet operations

const EXPORT_TO_PARQUET = `
COPY (
  SELECT
    order_date,
    COUNT(*) AS order_count,
    SUM(quantity * (SELECT price FROM products_large WHERE id = product_id)) AS revenue
  FROM order_events
  GROUP BY order_date
  ORDER BY order_date
) TO 'monthly_summary.parquet' (FORMAT PARQUET);
`;

const QUERY_PARQUET = `
SELECT *
FROM read_parquet('monthly_summary.parquet')
WHERE order_date >= '2023-01-01'
ORDER BY order_date;
`;

// Lazy iteration query

const STREAM_ALL_ORDERS = `
SELECT
  o.order_id,
  o.customer_id,
  c.name AS customer_name,
  o.product_id,
  p.name AS product_name,
  o.quantity,
  o.order_date,
  o.discount_pct,
  o.shipping_method,
  o.quantity * p.price * (1 - o.discount_pct / 100) AS final_price
FROM order_events o
JOIN customers_large c ON o.customer_id = c.id
JOIN products_large p ON o.product_id = p.id
WHERE c.segment = 'Premium'
ORDER BY o.order_date DESC, o.order_id
LIMIT 1000;
`;

// Cohort analysis

const COHORT_ANALYSIS = `
WITH first_purchase AS (
  SELECT
    customer_id,
    DATE_TRUNC('month', MIN(order_date)) AS cohort_month
  FROM order_events
  GROUP BY customer_id
),
cohort_orders AS (
  SELECT
    f.customer_id,
    f.cohort_month,
    DATE_TRUNC('month', o.order_date) AS order_month,
    COUNT(DISTINCT o.order_id) AS orders
  FROM first_purchase f
  JOIN order_events o ON f.customer_id = o.customer_id
  GROUP BY f.customer_id, f.cohort_month, DATE_TRUNC('month', o.order_date)
),
cohort_size AS (
  SELECT
    cohort_month,
    COUNT(DISTINCT customer_id) AS cohort_size
  FROM first_purchase
  GROUP BY cohort_month
)
SELECT
  c.cohort_month,
  cs.cohort_size,
  COUNT(DISTINCT c.customer_id) AS retained_customers,
  ROUND(100.0 * COUNT(DISTINCT c.customer_id) / cs.cohort_size, 2) AS retention_pct,
  DATEDIFF('month', c.cohort_month, c.order_month) AS months_since_start
FROM cohort_orders c
JOIN cohort_size cs ON c.cohort_month = cs.cohort_month
GROUP BY c.cohort_month, cs.cohort_size, DATEDIFF('month', c.cohort_month, c.order_month)
HAVING DATEDIFF('month', c.cohort_month, c.order_month) <= 6
ORDER BY c.cohort_month, months_since_start;
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

printSection("DuckDB Analytics - Parquet, Statistics & Cohorts");

const db = new objective.Database();
try {
  const conn = await db.connect();

  // Setup: Generate sample data
  printSection("Step 1: Generating Sample Data");
  console.log("Creating e-commerce data...");

  execObjective(conn, CREATE_PRODUCTS);
  execObjective(conn, GENERATE_PRODUCTS);
  execObjective(conn, CREATE_CUSTOMERS);
  execObjective(conn, GENERATE_CUSTOMERS);
  execObjective(conn, CREATE_ORDERS);
  execObjective(conn, GENERATE_ORDERS);

  printSuccess("Generated 500 products");
  printSuccess("Generated 1,000 customers");
  printSuccess("Generated 10,000 order events");

  // Statistical Functions
  printSection("Step 2: Statistical Functions - Order Value Analysis");
  console.log(
    "Comprehensive statistics including correlation, percentiles, and stddev...",
  );

  const orderStats = queryObjectiveObjects(conn, ORDER_VALUE_STATISTICS);
  const stats = orderStats[0];
  console.log(`
  Summary Statistics:
    Total Orders:        ${stats.total_orders}
    Average Order Value: $${stats.avg_order_value}
    Median Order Value:  $${stats.median_order_value}
    Std Deviation:       $${stats.stddev_order_value}
    Min Order Value:     $${stats.min_order_value}
    Max Order Value:     $${stats.max_order_value}

  Percentiles:
    P25 (25th):         $${stats.p25_order_value}
    P75 (75th):         $${stats.p75_order_value}
    P90 (90th):         $${stats.p90_order_value}
    P95 (95th):         $${stats.p95_order_value}

  Correlation:
    Items-Value Corr:    ${stats.correlation_items_value}
  `);

  // Parquet Operations
  printSection("Step 3: Parquet File Operations");
  console.log("Exporting query results to Parquet and reading back...");

  execObjective(conn, EXPORT_TO_PARQUET);
  printSuccess("Exported monthly summary to 'monthly_summary.parquet'");

  const parquetData = queryObjectiveObjects(conn, QUERY_PARQUET);
  printSuccess(`Read ${parquetData.length} rows from Parquet file`);
  printTable(parquetData.slice(0, 5), { title: "Sample data from Parquet (2023+)" });

  // Lazy Iteration
  printSection("Step 4: Lazy Iteration - On-Demand Row Decoding");
  console.log(
    "Using lazy iteration to decode rows on-demand from in-memory result buffer...",
  );

  const result = conn.execute(STREAM_ALL_ORDERS);
  let count = 0;
  const sampleRows: ObjectRow[] = [];

  // Lazy iteration - only consumes what's needed
  for (const row of result.objects()) {
    count++;
    if (sampleRows.length < 5) {
      sampleRows.push(row);
    }
    if (count >= 5) break; // Only process first 5 for demo
  }
  result.close();

  printSuccess(`Processed ${count} rows (lazy decoding - stops after needed rows)`);
  printTable(sampleRows, { title: "First 5 Premium Customer Orders" });

  // Cohort Analysis
  printSection("Step 5: Cohort Analysis - Customer Retention");
  console.log("Tracking customer retention by cohort month...");

  const cohortData = queryObjectiveObjects(conn, COHORT_ANALYSIS);
  printTable(
    cohortData.filter((row) => {
      const months = Number(row.months_since_start);
      return !isNaN(months) && months <= 6;
    }),
    { title: "Retention by Cohort (first 6 months)" },
  );

  // Cleanup - delete the parquet file
  try {
    await Deno.remove("monthly_summary.parquet");
    printSuccess("Cleaned up temporary Parquet file");
  } catch {
    // File might not exist, that's ok
  }

  conn.close();
} finally {
  db.close();
}
