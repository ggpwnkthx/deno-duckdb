/**
 * Example: Comprehensive DuckDB E-commerce Analytics Showcase
 *
 * This example demonstrates DuckDB's analytical power with:
 * - Large sample data generation using DuckDB's built-in generators
 * - Window functions (rankings, running totals, moving averages)
 * - Time-series analysis (monthly trends, month-over-month growth)
 * - Statistical functions (correlation, percentiles, stddev)
 * - Complex CTEs (customer lifetime value, product performance)
 * - Parquet file operations (export and query)
 * - Lazy iteration for streaming large results
 * - Cohort analysis for customer retention
 */

import * as functional from "@ggpwnkthx/duckdb/functional";
import * as objective from "@ggpwnkthx/duckdb/objective";
import type { ObjectRow } from "@ggpwnkthx/duckdb";

import {
  // Basic queries
  ALL_ORDERS,
  // Advanced analytics
  COHORT_ANALYSIS,
  CREATE_CUSTOMERS,
  CREATE_CUSTOMERS_LARGE,
  CREATE_ORDERS,
  CREATE_PRODUCTS,
  CREATE_PRODUCTS_LARGE,
  CUSTOMER_LIFETIME_VALUE,
  CUSTOMER_RANKING,
  CUSTOMER_TOTALS,
  DAILY_REVENUE_TRENDS,
  ELECTRONICS_BY_PRICE,
  EXPORT_TO_PARQUET,
  GENERATE_CUSTOMERS_DATA,
  GENERATE_ECOMMERCE_DATA,
  GENERATE_PRODUCTS_DATA,
  INSERT_CUSTOMERS,
  INSERT_ORDERS,
  INSERT_PRODUCTS,
  MONTHLY_REVENUE_ANALYSIS,
  ORDER_DETAILS,
  ORDER_VALUE_STATISTICS,
  ORDERS_BY_DATE_RANGE,
  PRODUCT_PERFORMANCE,
  PRODUCTS_BY_PRICE,
  QUERY_PARQUET,
  STREAM_ALL_ORDERS,
} from "./shared/data_analysis.ts";

function printSection(title: string): void {
  console.log(`\n--- ${title} ---`);
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
  const result = functional.query(connection, sql);
  if (result === null) {
    throw new Error(`Query failed: ${sql.substring(0, 50)}...`);
  }
}

function execObjective(connection: objective.Connection, sql: string): void {
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

console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║     DuckDB E-commerce Analytics Showcase                              ║
║     Demonstrating DuckDB's Analytical Power                            ║
╚══════════════════════════════════════════════════════════════════════╝
`);

// First, show the basic example (from original data_analysis.ts)
console.log(">>> PART 1: Basic Data Analysis (Original Example)");

console.log("\n=== Functional API ===");

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

// =============================================================================
// ADVANCED ANALYTICS SECTION
// =============================================================================

console.log("\n\n>>> PART 2: Advanced E-commerce Analytics");

// Use in-memory database for advanced analytics
const analyticsDb = new objective.Database();
try {
  const conn = await analyticsDb.connect();

  // Step 1: Generate large sample data
  printSection("Step 1: Generating Large Sample Data");
  console.log("Creating sample e-commerce data using DuckDB's generators...");

  execObjective(conn, CREATE_PRODUCTS_LARGE);
  execObjective(conn, CREATE_CUSTOMERS_LARGE);
  execObjective(conn, GENERATE_PRODUCTS_DATA);
  execObjective(conn, GENERATE_CUSTOMERS_DATA);
  execObjective(conn, GENERATE_ECOMMERCE_DATA);

  console.log("  ✓ Generated 500 products");
  console.log("  ✓ Generated 1,000 customers");
  console.log("  ✓ Generated 10,000 order events");

  // Step 2: Window Functions - Customer Ranking
  printSection("Step 2: Window Functions - Customer Rankings");
  console.log("Ranking customers by total spend with percentile rankings...");

  const customerRanking = queryObjectiveObjects(conn, CUSTOMER_RANKING);
  console.log("\nTop 10 Customers by Spend:");
  console.log(
    "  Rank | Customer ID | Total Spent   | Orders | % of Total",
  );
  console.log("  " + "-".repeat(55));
  for (const row of customerRanking.slice(0, 10)) {
    console.log(
      `  ${String(row.spend_rank).padStart(4)} | ${
        String(row.customer_id).padStart(11)
      } | ${String(row.total_spent).padStart(13)} | ${
        String(row.order_count).padStart(6)
      } | ${row.pct_of_total}%`,
    );
  }

  // Step 3: Time-Series Analysis - Daily Revenue Trends
  printSection("Step 3: Time-Series Analysis - Daily Revenue");
  console.log("Daily revenue with running totals and 7-day moving average...");

  const dailyTrends = queryObjectiveObjects(conn, DAILY_REVENUE_TRENDS);
  console.log("\nFirst 10 Days:");
  console.log(
    "  Date       | Revenue    | Running Total | 7-Day Avg  | % Change",
  );
  console.log("  " + "-".repeat(60));
  for (const row of dailyTrends.slice(0, 10)) {
    const pctChange = row.pct_change_vs_prev_day ?? "N/A";
    console.log(
      `  ${row.order_date} | ${String(row.daily_revenue).padStart(9)} | ${
        String(Math.round(Number(row.running_total_revenue))).padStart(13)
      } | ${String(row.moving_avg_7day).padStart(10)} | ${pctChange}%`,
    );
  }

  // Step 4: Monthly Revenue Analysis
  printSection("Step 4: Monthly Revenue with Month-over-Month Growth");
  console.log("Monthly aggregated revenue with MoM growth percentages...");

  const monthlyRevenue = queryObjectiveObjects(conn, MONTHLY_REVENUE_ANALYSIS);
  console.log("\nMonthly Revenue Trend:");
  console.log(
    "  Month     | Revenue     | Customers | Orders | Avg Order | MoM Growth",
  );
  console.log("  " + "-".repeat(65));
  for (const row of monthlyRevenue) {
    const momGrowth = row.mom_growth_pct ?? "N/A";
    console.log(
      `  ${row.month} | ${String(row.revenue).padStart(10)} | ${
        String(row.unique_customers).padStart(9)
      } | ${String(row.total_orders).padStart(6)} | ${
        String(row.avg_order_value).padStart(9)
      } | ${momGrowth}%`,
    );
  }

  // Step 5: Statistical Functions
  printSection("Step 5: Statistical Functions - Order Value Analysis");
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

  // Step 6: Complex CTEs - Customer Lifetime Value
  printSection("Step 6: Complex CTE - Customer Lifetime Value (CLV)");
  console.log("Calculating CLV with segment-based rankings...");

  const clvData = queryObjectiveObjects(conn, CUSTOMER_LIFETIME_VALUE);
  console.log("\nTop 10 Customers by Lifetime Value:");
  console.log(
    "  Customer ID | Name         | Segment | Lifetime Value | Orders | Avg Order",
  );
  console.log("  " + "-".repeat(70));
  for (const row of clvData.slice(0, 10)) {
    console.log(
      `  ${String(row.customer_id).padStart(11)} | ${String(row.name).padStart(11)} | ${
        String(row.segment).padStart(7)
      } | ${String(row.lifetime_value).padStart(14)} | ${
        String(row.total_orders).padStart(6)
      } | $${row.avg_order_value}`,
    );
  }

  // Step 7: Product Performance Metrics
  printSection("Step 7: Complex CTE - Product Performance Metrics");
  console.log("Ranking products by revenue within categories...");

  const productPerf = queryObjectiveObjects(conn, PRODUCT_PERFORMANCE);
  console.log("\nTop 10 Products by Revenue:");
  console.log(
    "  Product ID | Name        | Category        | Revenue    | Units | Rank",
  );
  console.log("  " + "-".repeat(65));
  for (const row of productPerf.slice(0, 10)) {
    console.log(
      `  ${String(row.product_id).padStart(10)} | ${String(row.name).padStart(10)} | ${
        String(row.category).padStart(15)
      } | ${String(row.total_revenue).padStart(10)} | ${
        String(row.units_sold).padStart(5)
      } | ${row.overall_rank}`,
    );
  }

  // Step 8: Parquet Operations
  printSection("Step 8: Parquet File Operations");
  console.log("Exporting query results to Parquet and reading back...");

  execObjective(conn, EXPORT_TO_PARQUET);
  console.log("  ✓ Exported monthly summary to 'monthly_summary.parquet'");

  const parquetData = queryObjectiveObjects(conn, QUERY_PARQUET);
  console.log(`  ✓ Read ${parquetData.length} rows from Parquet file`);
  console.log("\n  Sample data from Parquet (2023+):");
  console.log("  Date       | Orders | Revenue");
  console.log("  " + "-".repeat(30));
  for (const row of parquetData.slice(0, 5)) {
    console.log(
      `  ${row.order_date} | ${String(row.order_count).padStart(6)} | ${row.revenue}`,
    );
  }

  // Step 9: Lazy Iteration
  printSection("Step 9: Lazy Iteration - Streaming Large Results");
  console.log(
    "Using lazy iteration to stream results without loading all into memory...",
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

  console.log(`  Processed ${count} rows (lazy iteration - only what we needed)`);
  console.log("\n  First 5 Premium Customer Orders:");
  console.log(
    "  Order ID | Customer    | Product      | Qty | Date       | Final Price",
  );
  console.log("  " + "-".repeat(65));
  for (const row of sampleRows) {
    console.log(
      `  ${String(row.order_id).padStart(8)} | ${
        String(row.customer_name).padStart(10)
      } | ${String(row.product_name).padStart(11)} | ${
        String(row.quantity).padStart(3)
      } | ${row.order_date} | $${Number(row.final_price).toFixed(2)}`,
    );
  }

  // Step 10: Cohort Analysis
  printSection("Step 10: Cohort Analysis - Customer Retention");
  console.log("Tracking customer retention by cohort month...");

  const cohortData = queryObjectiveObjects(conn, COHORT_ANALYSIS);
  console.log("\nRetention by Cohort (first 6 months):");
  console.log(
    "  Cohort     | Cohort Size | Retained | Retention % | Months",
  );
  console.log("  " + "-".repeat(55));
  for (const row of cohortData) {
    const months = Number(row.months_since_start);
    if (!isNaN(months) && months <= 6) {
      console.log(
        `  ${row.cohort_month} | ${String(row.cohort_size).padStart(11)} | ${
          String(row.retained_customers).padStart(9)
        } | ${String(row.retention_pct).padStart(12)}% | ${months}`,
      );
    }
  }

  // Cleanup - delete the parquet file
  try {
    await Deno.remove("monthly_summary.parquet");
    console.log("\n  ✓ Cleaned up temporary Parquet file");
  } catch {
    // File might not exist, that's ok
  }

  conn.close();
} finally {
  analyticsDb.close();
}

console.log(`
\n${"=".repeat(60)}
  ✓ All analytics queries completed successfully!
  ✓ Demonstrated DuckDB's analytical capabilities:
    - Large-scale data generation
    - Window functions (rankings, running totals, moving averages)
    - Time-series analysis with MoM growth
    - Statistical functions (correlation, percentiles, stddev)
    - Complex CTEs for business metrics
    - Parquet file export/import
    - Lazy iteration for streaming results
    - Cohort analysis for customer retention
${"=".repeat(60)}
`);

console.log("\nAll done!");
