/**
 * Example: Data Analysis
 *
 * Demonstrates common data analysis workflows with both APIs.
 */

import {
  closeConnection,
  closeDatabase,
  create,
  destroyResult,
  query,
  fetchAll,
  open,
} from "@ggpwnkthx/duckdb/functional";

import { Database } from "@ggpwnkthx/duckdb/objective";

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
destroyResult(result);

console.log("Products by price (functional):");
for (const row of rows) {
  console.log(`  ${row[0]}: $${row[1]} (${row[2]})`);
}

// Query: Order details with joins
result = query(conn1, ORDER_DETAILS);
rows = fetchAll(result);
destroyResult(result);

console.log("\nOrder details (functional):");
for (const row of rows) {
  console.log(
    `  Order ${row[0]}: ${row[1]} bought ${row[2]} x${row[3]} on ${row[4]} ($${
      row[5]
    })`,
  );
}

// Query: Customer totals
result = query(conn1, CUSTOMER_TOTALS);
rows = fetchAll(result);
destroyResult(result);

console.log("\nCustomer totals (functional):");
for (const row of rows) {
  console.log(`  ${row[0]}: $${row[1] ?? 0} (${row[2] ?? 0} orders)`);
}

closeConnection(conn1);
closeDatabase(db1);

console.log("\n=== Objective API ===\n");

// Objective API
const db2 = new Database();
await db2.open();
const conn2 = await db2.connect();

// Create tables and insert data
conn2.query(CREATE_PRODUCTS);
conn2.query(CREATE_CUSTOMERS);
conn2.query(CREATE_ORDERS);
conn2.query(INSERT_PRODUCTS);
conn2.query(INSERT_CUSTOMERS);
conn2.query(INSERT_ORDERS);

console.log("Tables created and data inserted\n");

// Query: Products by price
let result2 = conn2.query(PRODUCTS_BY_PRICE);
let rows2 = result2.fetchAll();
result2.close();

console.log("Products by price (objective):");
for (const row of rows2) {
  console.log(`  ${row[0]}: $${row[1]} (${row[2]})`);
}

// Query: Order details with joins
result2 = conn2.query(ORDER_DETAILS);
rows2 = result2.fetchAll();
result2.close();

console.log("\nOrder details (objective):");
for (const row of rows2) {
  console.log(
    `  Order ${row[0]}: ${row[1]} bought ${row[2]} x${row[3]} on ${row[4]} ($${
      row[5]
    })`,
  );
}

// Query: Customer totals
result2 = conn2.query(CUSTOMER_TOTALS);
rows2 = result2.fetchAll();
result2.close();

console.log("\nCustomer totals (objective):");
for (const row of rows2) {
  console.log(`  ${row[0]}: $${row[1] ?? 0} (${row[2] ?? 0} orders)`);
}

conn2.close();
db2.close();

console.log("\n=== Using Prepared Statements ===\n");

// Prepared statements example (Objective API)
const db3 = new Database();
await db3.open();
const conn3 = await db3.connect();

conn3.query(CREATE_PRODUCTS);
conn3.query(INSERT_PRODUCTS);

// Prepare and query with parameters
const stmt = conn3.prepare(
  "SELECT name, price FROM products WHERE category = ?",
);
stmt.bind(["Electronics"]);

console.log("Electronics products (prepared statement):");
const stmtResult = stmt.execute();
const stmtRows = stmtResult.fetchAll();
for (const row of stmtRows) {
  console.log(`  ${row[0]}: $${row[1]}`);
}
stmtResult.close();
stmt.close();

conn3.close();
db3.close();

console.log("\nAll done!");
