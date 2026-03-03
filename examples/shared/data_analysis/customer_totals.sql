SELECT c.name, o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id
ORDER BY c.name, o.id;
