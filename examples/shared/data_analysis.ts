/**
 * Shared SQL for data analysis examples.
 *
 * Notes:
 * - Decimal values are returned as exact strings by the wrapper, so we no longer
 *   need to cast money-like values to DOUBLE in user SQL.
 * - Prepared statements in this wrapper use positional `?` placeholders.
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
SELECT
  name,
  price,
  category
FROM products
ORDER BY price DESC;
`;

export const ORDER_DETAILS = `
SELECT
  o.id AS order_id,
  c.name AS customer_name,
  p.name AS product_name,
  o.quantity,
  o.order_date,
  p.price * o.quantity AS total
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id
ORDER BY o.order_date, o.id;
`;

export const ELECTRONICS_BY_PRICE = `
SELECT
  name,
  price
FROM products
WHERE category = 'Electronics'
ORDER BY price DESC;
`;

export const ORDERS_BY_DATE_RANGE = `
SELECT *
FROM orders
WHERE order_date BETWEEN ? AND ?
ORDER BY order_date, id;
`;

export const CUSTOMER_TOTALS = `
SELECT
  c.name AS customer_name,
  SUM(p.price * o.quantity) AS total_spent,
  COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN products p ON o.product_id = p.id
GROUP BY c.id, c.name
ORDER BY total_spent DESC NULLS LAST, c.name;
`;

export const PRODUCTS_ABOVE_AVERAGE = `
SELECT
  name,
  price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price;
`;

export const ALL_ORDERS = `
SELECT *
FROM orders
ORDER BY id;
`;

// =============================================================================
// Advanced E-commerce Analytics Queries
// =============================================================================

/**
 * Generate large sample dataset using DuckDB's built-in generators.
 * Creates realistic e-commerce data with orders spanning 2 years.
 */
export const GENERATE_ECOMMERCE_DATA = `
CREATE TABLE order_events AS
SELECT
  -- Generate unique order ID
  i AS order_id,
  -- Random customer ID (1-1000)
  (RANDOM() * 999 + 1)::INTEGER AS customer_id,
  -- Random product ID (1-500)
  (RANDOM() * 499 + 1)::INTEGER AS product_id,
  -- Random quantity (1-10)
  (RANDOM() * 9 + 1)::INTEGER AS quantity,
  -- Random order date over the past 2 years
  DATE '2022-01-01' + (RANDOM() * 730)::INTEGER AS order_date,
  -- Random discount percentage (0-30%)
  (RANDOM() * 30)::DECIMAL(5,2) AS discount_pct,
  -- Random shipping method
  CASE (RANDOM() * 2)::INTEGER
    WHEN 0 THEN 'standard'
    WHEN 1 THEN 'express'
    ELSE 'overnight'
  END AS shipping_method
FROM generate_series(1, 10000) t(i);
`;

export const CREATE_PRODUCTS_LARGE = `
CREATE TABLE products_large (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  category VARCHAR,
  subcategory VARCHAR,
  price DECIMAL(10, 2),
  stock_quantity INTEGER,
  is_active BOOLEAN
);
`;

export const GENERATE_PRODUCTS_DATA = `
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
  CASE (i % 10)
    WHEN 0 THEN 'Accessories'
    WHEN 1 THEN 'Gadgets'
    WHEN 2 THEN 'Apparel'
    WHEN 3 THEN 'Footwear'
    WHEN 4 THEN 'Furniture'
    WHEN 5 THEN 'Decor'
    WHEN 6 THEN 'Equipment'
    WHEN 7 THEN 'Gear'
    WHEN 8 THEN 'Literature'
    ELSE 'Media'
  END AS subcategory,
  (RANDOM() * 500 + 10)::DECIMAL(10, 2) AS price,
  (RANDOM() * 1000)::INTEGER AS stock_quantity,
  RANDOM() > 0.1 AS is_active
FROM generate_series(1, 500) t(i);
`;

export const CREATE_CUSTOMERS_LARGE = `
CREATE TABLE customers_large (
  id INTEGER PRIMARY KEY,
  name VARCHAR,
  email VARCHAR,
  segment VARCHAR,
  join_date DATE,
  country VARCHAR
);
`;

export const GENERATE_CUSTOMERS_DATA = `
INSERT INTO customers_large
SELECT
  i AS id,
  'Customer-' || i AS name,
  'customer' || i || '@example.com' AS email,
  CASE (RANDOM() * 3)::INTEGER
    WHEN 0 THEN 'Premium'
    WHEN 1 THEN 'Regular'
    ELSE 'New'
  END AS segment,
  DATE '2020-01-01' + (RANDOM() * 1500)::INTEGER AS join_date,
  (ARRAY['USA', 'UK', 'Canada', 'Germany', 'France', 'Japan'])[(RANDOM() * 5)::INTEGER + 1] AS country
FROM generate_series(1, 1000) t(i);
`;

/**
 * Window Functions: Customer ranking by total spend.
 * Shows rank, dense_rank, and cumulative percentage.
 */
export const CUSTOMER_RANKING = `
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
  total_spent,
  order_count,
  RANK() OVER (ORDER BY total_spent DESC) AS spend_rank,
  DENSE_RANK() OVER (ORDER BY total_spent DESC) AS dense_rank,
  PERCENT_RANK() OVER (ORDER BY total_spent DESC) AS percentile_rank,
  ROUND(100.0 * total_spent / SUM(total_spent) OVER (), 2) AS pct_of_total
FROM customer_spend
ORDER BY total_spent DESC
LIMIT 20;
`;

/**
 * Window Functions: Running total and moving average of daily revenue.
 */
export const DAILY_REVENUE_TRENDS = `
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
  daily_revenue,
  order_count,
  SUM(daily_revenue) OVER (ORDER BY order_date) AS running_total_revenue,
  ROUND(AVG(daily_revenue) OVER (
    ORDER BY order_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 2) AS moving_avg_7day,
  LAG(daily_revenue, 1) OVER (ORDER BY order_date) AS prev_day_revenue,
  ROUND(
    (daily_revenue - LAG(daily_revenue, 1) OVER (ORDER BY order_date)) /
    NULLIF(LAG(daily_revenue, 1) OVER (ORDER BY order_date), 0) * 100,
    2
  ) AS pct_change_vs_prev_day
FROM daily_revenue
ORDER BY order_date
LIMIT 30;
`;

/**
 * Time-Series: Monthly revenue with month-over-month growth.
 */
export const MONTHLY_REVENUE_ANALYSIS = `
WITH monthly_data AS (
  SELECT
    DATE_TRUNC('month', order_date) AS month,
    SUM(quantity * (SELECT price FROM products_large WHERE id = product_id) * (1 - discount_pct / 100)) AS revenue,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(*) AS total_orders
  FROM order_events
  GROUP BY DATE_TRUNC('month', order_date)
)
SELECT
  month,
  ROUND(revenue, 2) AS revenue,
  unique_customers,
  total_orders,
  ROUND(revenue / total_orders, 2) AS avg_order_value,
  LAG(revenue, 1) OVER (ORDER BY month) AS prev_month_revenue,
  ROUND(
    (revenue - LAG(revenue, 1) OVER (ORDER BY month)) /
    NULLIF(LAG(revenue, 1) OVER (ORDER BY month), 0) * 100,
    2
  ) AS mom_growth_pct
FROM monthly_data
ORDER BY month;
`;

/**
 * Statistical Functions: Correlation, percentiles, standard deviation.
 */
export const ORDER_VALUE_STATISTICS = `
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

/**
 * Complex CTE: Customer Lifetime Value (CLV) calculation.
 */
export const CUSTOMER_LIFETIME_VALUE = `
WITH customer_orders AS (
  SELECT
    c.id AS customer_id,
    c.name,
    c.segment,
    c.join_date,
    COUNT(o.order_id) AS total_orders,
    SUM(o.quantity * (SELECT price FROM products_large WHERE id = o.product_id) * (1 - o.discount_pct / 100)) AS lifetime_value,
    MIN(o.order_date) AS first_order_date,
    MAX(o.order_date) AS last_order_date,
    MAX(o.order_date) - MIN(o.order_date) AS customer_tenure_days
  FROM customers_large c
  LEFT JOIN order_events o ON c.id = o.customer_id
  WHERE o.order_id IS NOT NULL
  GROUP BY c.id, c.name, c.segment, c.join_date
),
customer_metrics AS (
  SELECT
    customer_id,
    name,
    segment,
    lifetime_value,
    total_orders,
    customer_tenure_days,
    CASE
      WHEN customer_tenure_days > 0 THEN lifetime_value / (customer_tenure_days / 30.0)
      ELSE lifetime_value
    END AS monthly_clv_approx,
    CASE
      WHEN total_orders > 0 THEN lifetime_value / total_orders
      ELSE 0
    END AS avg_order_value
  FROM customer_orders
)
SELECT
  customer_id,
  name,
  segment,
  ROUND(lifetime_value, 2) AS lifetime_value,
  total_orders,
  customer_tenure_days,
  ROUND(monthly_clv_approx, 2) AS monthly_clv_approx,
  ROUND(avg_order_value, 2) AS avg_order_value,
  RANK() OVER (PARTITION BY segment ORDER BY lifetime_value DESC) AS segment_rank
FROM customer_metrics
ORDER BY lifetime_value DESC
LIMIT 25;
`;

/**
 * Complex CTE: Product Performance Metrics.
 */
export const PRODUCT_PERFORMANCE = `
WITH product_stats AS (
  SELECT
    p.id AS product_id,
    p.name,
    p.category,
    p.subcategory,
    p.price,
    p.stock_quantity,
    COUNT(o.order_id) AS times_ordered,
    SUM(o.quantity) AS units_sold,
    SUM(o.quantity * p.price * (1 - o.discount_pct / 100)) AS total_revenue,
    COUNT(DISTINCT o.customer_id) AS unique_buyers
  FROM products_large p
  LEFT JOIN order_events o ON p.id = o.product_id
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.category, p.subcategory, p.price, p.stock_quantity
),
product_ranks AS (
  SELECT
    *,
    RANK() OVER (PARTITION BY category ORDER BY total_revenue DESC NULLS LAST) AS category_rank,
    RANK() OVER (ORDER BY total_revenue DESC NULLS LAST) AS overall_rank
  FROM product_stats
  WHERE times_ordered > 0
)
SELECT
  product_id,
  name,
  category,
  subcategory,
  price,
  stock_quantity,
  times_ordered,
  units_sold,
  ROUND(total_revenue, 2) AS total_revenue,
  unique_buyers,
  category_rank,
  overall_rank,
  ROUND(total_revenue / NULLIF(units_sold, 0), 2) AS avg_unit_price
FROM product_ranks
ORDER BY overall_rank
LIMIT 30;
`;

/**
 * Export query results to Parquet file.
 */
export const EXPORT_TO_PARQUET = `
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

/**
 * Query Parquet file directly.
 */
export const QUERY_PARQUET = `
SELECT *
FROM read_parquet('monthly_summary.parquet')
WHERE order_date >= '2023-01-01'
ORDER BY order_date;
`;

/**
 * Lazy iteration: Large result set processing.
 */
export const STREAM_ALL_ORDERS = `
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

/**
 * Cohort Analysis: Customer retention by month.
 */
export const COHORT_ANALYSIS = `
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
