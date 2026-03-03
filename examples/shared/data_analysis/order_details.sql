SELECT o.id, c.name as customer, p.name as product, o.quantity, o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id
ORDER BY o.id;
