/**
 * Shared SQL for data analysis examples
 */

export const CREATE_PRODUCTS = `
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  category VARCHAR,
  price DECIMAL(10, 2)
);
`;

export const CREATE_CUSTOMERS = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  email VARCHAR
);
`;

export const CREATE_ORDERS = `
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

export const INSERT_PRODUCTS = `
INSERT INTO products VALUES
  (1, 'Laptop', 'Electronics', 999.99),
  (2, 'Mouse', 'Electronics', 29.99),
  (3, 'Keyboard', 'Electronics', 79.99),
  (4, 'Desk', 'Furniture', 299.99),
  (5, 'Chair', 'Furniture', 199.99);
`;

export const INSERT_CUSTOMERS = `
INSERT INTO customers VALUES
  (1, 'Alice', 'alice@example.com'),
  (2, 'Bob', 'bob@example.com'),
  (3, 'Charlie', 'charlie@example.com');
`;

export const INSERT_ORDERS = `
INSERT INTO orders VALUES
  (1, 1, 1, 1, '2024-01-15'),
  (2, 1, 2, 2, '2024-01-15'),
  (3, 2, 1, 1, '2024-02-20'),
  (4, 2, 4, 1, '2024-02-20'),
  (5, 3, 3, 1, '2024-03-10');
`;

export const PRODUCTS_BY_PRICE = `
SELECT name, price, category
FROM products
ORDER BY price DESC;
`;

export const ORDER_DETAILS = `
SELECT
  o.id as order_id,
  c.name as customer_name,
  p.name as product_name,
  o.quantity,
  o.order_date,
  p.price * o.quantity as total
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id
ORDER BY o.order_date;
`;

export const ELECTRONICS_BY_PRICE = `
SELECT name, price
FROM products
WHERE category = 'Electronics'
ORDER BY price DESC;
`;

export const ORDERS_BY_DATE_RANGE = `
SELECT *
FROM orders
WHERE order_date BETWEEN :start_date AND :end_date;
`;

export const CUSTOMER_TOTALS = `
SELECT
  c.name as customer_name,
  SUM(p.price * o.quantity) as total_spent,
  COUNT(o.id) as order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN products p ON o.product_id = p.id
GROUP BY c.id, c.name
ORDER BY total_spent DESC;
`;

export const PRODUCTS_ABOVE_AVERAGE = `
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price;
`;

export const ALL_ORDERS = `
SELECT * FROM orders ORDER BY id;
`;
