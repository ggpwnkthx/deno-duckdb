CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  order_date VARCHAR(20),
  total DOUBLE
);
