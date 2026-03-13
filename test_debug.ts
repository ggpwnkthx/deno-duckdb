import * as functional from "@ggpwnkthx/duckdb/functional";

const db = await functional.open();
const conn = await functional.create(db);

// Create table and insert data like in data_analysis.ts
functional.query(
  conn,
  "CREATE TABLE products (id INTEGER PRIMARY KEY, name VARCHAR, category VARCHAR, price DECIMAL(10, 2))",
);
functional.query(
  conn,
  "INSERT INTO products VALUES (1, 'Laptop', 'Electronics', 999.99)",
);

// Now query it
const result = functional.query(
  conn,
  "SELECT name, price, category FROM products ORDER BY price DESC",
);
console.log("Row count:", functional.rowCount(result));
console.log("Column count:", functional.columnCount(result));
console.log("Column 0 name:", functional.columnName(result, 0));
console.log("Column 0 type:", functional.columnType(result, 0));
console.log("Column 1 name:", functional.columnName(result, 1));
console.log("Column 1 type:", functional.columnType(result, 1));
console.log("Column 2 name:", functional.columnName(result, 2));
console.log("Column 2 type:", functional.columnType(result, 2));

try {
  console.log("Fetch objects...");
  const rows = functional.fetchObjects(result);
  console.log("Rows:", rows);
} catch (e) {
  console.error("Error:", e);
}

functional.destroyResult(result);
functional.closeConnection(conn);
functional.closeDatabase(db);
