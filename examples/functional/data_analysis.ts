/**
 * Data Analysis Example - Functional API
 *
 * This example demonstrates practical DuckDB data analysis workflows:
 * 1. Creating tables and inserting data
 * 2. Running queries with JOINs, WHERE, ORDER BY
 * 3. Using the streaming API to process large datasets
 * 4. Using subqueries for analysis
 *
 * Note: DECIMAL type has a known bug in this library (causes segfault).
 * This example uses DOUBLE instead.
 */

import {
  closeConnection,
  closeDatabase,
  create,
  destroyResult,
  execute,
  fetchAll,
  open,
  stream,
} from "@ggpwnkthx/duckdb/functional";
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
  PRODUCTS_ABOVE_AVERAGE,
  PRODUCTS_BY_PRICE,
} from "../shared/data_analysis/mod.ts";

console.log("=== Data Analysis Example ===\n");

// Step 1: Open database and create connection
console.log("Opening database...");
const db = await open();
console.log("Database opened\n");

const conn = await create(db);
console.log("Connection created\n");

// Step 2: Create tables for sales data
console.log("--- Creating Tables ---\n");

let result = execute(conn, CREATE_PRODUCTS);
destroyResult(result);
console.log("Created 'products' table");

result = execute(conn, CREATE_CUSTOMERS);
destroyResult(result);
console.log("Created 'customers' table");

result = execute(conn, CREATE_ORDERS);
destroyResult(result);
console.log("Created 'orders' table\n");

// Step 3: Insert sample data
console.log("--- Inserting Sample Data ---\n");

result = execute(conn, INSERT_PRODUCTS);
destroyResult(result);
console.log("Inserted 10 products");

result = execute(conn, INSERT_CUSTOMERS);
destroyResult(result);
console.log("Inserted 5 customers");

result = execute(conn, INSERT_ORDERS);
destroyResult(result);
console.log("Inserted 15 orders\n");

// Step 4: Run queries
console.log("--- Running Queries ---\n");

// Query 1: Products sorted by price
result = execute(conn, PRODUCTS_BY_PRICE);
const products = fetchAll(result);
destroyResult(result);
console.log("Products (sorted by price, descending):");
for (const [name, category, price] of products) {
  console.log(`  ${name}: $${price} (${category})`);
}

// Query 2: Orders with customer and product info (JOIN)
result = execute(conn, ORDER_DETAILS);
const orderDetails = fetchAll(result);
destroyResult(result);
console.log("\nOrder Details:");
for (const [id, customer, product, qty, total] of orderDetails.slice(0, 5)) {
  console.log(
    `  Order #${id}: ${customer} bought ${product} x${qty} = $${total}`,
  );
}

// Query 3: Filter by category
result = execute(conn, ELECTRONICS_BY_PRICE);
const electronics = fetchAll(result);
destroyResult(result);
console.log("\nElectronics (sorted by price):");
for (const [name, price] of electronics) {
  console.log(`  ${name}: $${price}`);
}

// Query 4: Date range filtering
result = execute(conn, ORDERS_BY_DATE_RANGE);
const dateRangeOrders = fetchAll(result);
destroyResult(result);
console.log("\nOrders from Jan 18-21, 2024:");
for (const row of dateRangeOrders) {
  console.log(
    `  Order #${row[0]}: Customer ${row[1]}, Product ${row[2]}, Qty ${
      row[3]
    }, Date ${row[4]}, Total $${row[5]}`,
  );
}

// Query 5: Customer totals (calculated in JavaScript)
console.log("\nCustomer Analysis (calculated via streaming):");
result = execute(conn, CUSTOMER_TOTALS);
const customerTotals = fetchAll(result);
destroyResult(result);

// Calculate totals per customer
const customerMap = new Map<string, number>();
for (const [name, total] of customerTotals) {
  const current = customerMap.get(name as string) || 0;
  customerMap.set(name as string, current + (total as number));
}
const sortedCustomers = [...customerMap.entries()].sort((a, b) => b[1] - a[1]);
for (const [name, total] of sortedCustomers) {
  console.log(`  ${name}: $${total.toFixed(2)} total`);
}

// Query 6: Using subquery - products above average price
result = execute(conn, PRODUCTS_ABOVE_AVERAGE);
const aboveAvg = fetchAll(result);
destroyResult(result);
console.log("\nProducts with above-average price:");
for (const [name, price] of aboveAvg) {
  console.log(`  ${name}: $${price}`);
}

// Step 5: Demonstrate streaming API
console.log("\n--- Using Stream API ---\n");

console.log("Streaming all orders (lazy evaluation):");
let orderCount = 0;
let totalQty = 0;

for await (
  const row of stream(conn, ALL_ORDERS)
) {
  orderCount++;
  totalQty += row[3] as number;
  if (orderCount <= 5) {
    console.log(
      `  Order #${row[0]}: Customer ${row[1]}, Product ${row[2]}, Qty ${
        row[3]
      }, Total $${row[5]}`,
    );
  }
}
console.log(`  ... and ${orderCount - 5} more orders`);
console.log(`  Total quantity across all orders: ${totalQty}`);

// Clean up
closeConnection(conn);
closeDatabase(db);

console.log("\n=== Analysis Complete ===");
console.log("All resources cleaned up");
