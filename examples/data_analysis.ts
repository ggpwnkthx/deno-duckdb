/**
 * Example: Data Analysis
 *
 * Demonstrates common data analysis workflows with the functional API.
 * Uses name-based column access for cleaner, more readable code.
 */

import {
  closeConnection,
  closeDatabase,
  create,
  destroyResult,
  fetchAll,
  open,
  query,
} from "@ggpwnkthx/duckdb/functional";
import { asRow } from "@ggpwnkthx/duckdb";

import {
  CREATE_CUSTOMERS,
  CREATE_ORDERS,
  CREATE_PRODUCTS,
  CUSTOMER_TOTALS,
  INSERT_CUSTOMERS,
  INSERT_ORDERS,
  INSERT_PRODUCTS,
  ORDER_DETAILS,
  PRODUCTS_BY_PRICE,
} from "./shared/data_analysis.ts";

console.log("=== Functional API ===\n");

// Functional API
const db1 = await open();
const conn1 = await create(db1);

// Create tables and insert data
query(conn1, CREATE_PRODUCTS);
query(conn1, CREATE_CUSTOMERS);
query(conn1, CREATE_ORDERS);
query(conn1, INSERT_PRODUCTS);
query(conn1, INSERT_CUSTOMERS);
query(conn1, INSERT_ORDERS);

console.log("Tables created and data inserted\n");

// Query: Products by price
let result = query(conn1, PRODUCTS_BY_PRICE);
let rows = fetchAll(result);

console.log("Products by price (functional):");
for (const row of rows) {
  const r = asRow<{ name: string; price: number; category: string }>(row);
  console.log(`  ${r.name}: $${r.price} (${r.category})`);
}
destroyResult(result);

// Query: Order details with joins
result = query(conn1, ORDER_DETAILS);
rows = fetchAll(result);

console.log("\nOrder details (functional):");
for (const row of rows) {
  const r = asRow<{
    order_id: number;
    customer_name: string;
    product_name: string;
    quantity: number;
    order_date: Date;
    total: number;
  }>(row);
  console.log(
    `  Order ${r.order_id}: ${r.customer_name} bought ${r.product_name} x${r.quantity} on ${r.order_date} ($${r.total})`,
  );
}
destroyResult(result);

// Query: Customer totals
result = query(conn1, CUSTOMER_TOTALS);
rows = fetchAll(result);

console.log("\nCustomer totals (functional):");
for (const row of rows) {
  const r = asRow<{
    customer_name: string;
    total_spent: number;
    order_count: number;
  }>(row);
  console.log(
    `  ${r.customer_name}: $${r.total_spent ?? 0} (${
      r.order_count ?? 0
    } orders)`,
  );
}
destroyResult(result);

closeConnection(conn1);
closeDatabase(db1);

console.log("\nAll done!");
