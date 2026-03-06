/**
 * Data Analysis Example - Objective API
 *
 * This example demonstrates practical DuckDB data analysis workflows using
 * the object-oriented API with automatic resource management:
 * 1. Creating tables and inserting data
 * 2. Running queries with JOINs, WHERE, ORDER BY
 * 3. Using the streaming API to process large datasets
 * 4. Using subqueries for analysis
 *
 * Note: DECIMAL type has a known bug in this library (causes segfault).
 * This example uses DOUBLE instead.
 *
 * Key differences from Functional API:
 * - Uses Database, Connection, QueryResult classes
 * - Resources are managed via .close() methods
 * - No need to manually destroy results
 */

import { Database } from "@ggpwnkthx/duckdb/objective";
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

console.log("=== Data Analysis Example (Objective API) ===\n");

// Step 1: Open database and create connection
// Using Database class with automatic handle management
console.log("Opening database...");
const db = new Database();
await db.open();
console.log("Database opened\n");

const conn = await db.connect();
console.log("Connection created\n");

// Step 2: Create tables for sales data
console.log("--- Creating Tables ---\n");

let result = conn.query(CREATE_PRODUCTS);
result.close();
console.log("Created 'products' table");

result = conn.query(CREATE_CUSTOMERS);
result.close();
console.log("Created 'customers' table");

result = conn.query(CREATE_ORDERS);
result.close();
console.log("Created 'orders' table\n");

// Step 3: Insert sample data
console.log("--- Inserting Sample Data ---\n");

result = conn.query(INSERT_PRODUCTS);
result.close();
console.log("Inserted 10 products");

result = conn.query(INSERT_CUSTOMERS);
result.close();
console.log("Inserted 5 customers");

result = conn.query(INSERT_ORDERS);
result.close();
console.log("Inserted 15 orders\n");

// Step 4: Run queries
console.log("--- Running Queries ---\n");

// Query 1: Products sorted by price
result = conn.query(PRODUCTS_BY_PRICE);
const products = result.fetchAll();
result.close();
console.log("Products (sorted by price, descending):");
for (const [name, category, price] of products) {
  console.log(`  ${name}: $${price} (${category})`);
}

// Query 2: Orders with customer and product info (JOIN)
result = conn.query(ORDER_DETAILS);
const orderDetails = result.fetchAll();
result.close();
console.log("\nOrder Details:");
for (const [id, customer, product, qty, total] of orderDetails.slice(0, 5)) {
  console.log(
    `  Order #${id}: ${customer} bought ${product} x${qty} = $${total}`,
  );
}

// Query 3: Filter by category
result = conn.query(ELECTRONICS_BY_PRICE);
const electronics = result.fetchAll();
result.close();
console.log("\nElectronics (sorted by price):");
for (const [name, price] of electronics) {
  console.log(`  ${name}: $${price}`);
}

// Query 4: Date range filtering
result = conn.query(ORDERS_BY_DATE_RANGE);
const dateRangeOrders = result.fetchAll();
result.close();
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
result = conn.query(CUSTOMER_TOTALS);
const customerTotals = result.fetchAll();
result.close();

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
result = conn.query(PRODUCTS_ABOVE_AVERAGE);
const aboveAvg = result.fetchAll();
result.close();
console.log("\nProducts with above-average price:");
for (const [name, price] of aboveAvg) {
  console.log(`  ${name}: $${price}`);
}

// Step 5: Demonstrate streaming API
// Using conn.stream() for lazy row streaming (async generator)
console.log("\n--- Using Stream API ---\n");

console.log("Streaming all orders (lazy evaluation):");
let orderCount = 0;
let totalQty = 0;

for await (
  const row of conn.stream(ALL_ORDERS)
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

// Clean up - close in reverse order of creation
conn.close();
db.close();

console.log("\n=== Analysis Complete ===");
console.log("All resources cleaned up");
