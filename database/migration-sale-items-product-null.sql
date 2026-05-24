-- Permite borrar productos agotados sin perder historial de ventas
-- sale_items conserva product_name, product_id puede quedar NULL

ALTER TABLE sale_items
  DROP FOREIGN KEY fk_sale_items_product;

ALTER TABLE sale_items
  MODIFY product_id INT UNSIGNED NULL;

ALTER TABLE sale_items
  ADD CONSTRAINT fk_sale_items_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE SET NULL ON UPDATE CASCADE;
