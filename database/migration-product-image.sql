-- Añade imagen a productos (ejecutar una vez en tu BD)
-- Local: shop_with_mel  |  Aiven: defaultdb

ALTER TABLE products
  ADD COLUMN image_url MEDIUMTEXT NULL AFTER description;
