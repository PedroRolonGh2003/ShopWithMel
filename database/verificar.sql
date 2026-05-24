-- Ejecuta después de schema.sql para comprobar que todo quedó bien

USE shop_with_mel;

SHOW TABLES;

SELECT id, email, display_name, is_active FROM users;

SELECT id, sku, name, price, stock, is_active FROM products;

SELECT id, name, phone, is_active FROM clients;

SELECT COUNT(*) AS total_ventas FROM sales;
