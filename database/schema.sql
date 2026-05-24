-- =============================================================================
-- Shop With Mel — Esquema MySQL 8+
-- =============================================================================
--
-- USO EN MYSQL WORKBENCH (local):
--   1. Abre este archivo: File → Open SQL Script
--   2. Ejecuta todo (⚡ Execute o Ctrl+Shift+Enter)
--   3. Se crea la base `shop_with_mel` con tablas y usuario admin de prueba
--
-- USO EN AIVEN (más adelante):
--   - En Aiven ya existe la base `defaultdb`; NO ejecutes CREATE DATABASE.
--   - Comenta o borra las líneas de CREATE DATABASE y USE shop_with_mel.
--   - Selecciona `defaultdb` en Workbench / cliente y ejecuta desde
--     "SET NAMES utf8mb4" hasta el final.
--
-- Usuario admin de prueba (cámbialo en producción):
--   Correo:     mel@shopwithmel.com
--   Contraseña: dulce123
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Base de datos (solo local / Workbench) ───────────────────────────────────
CREATE DATABASE IF NOT EXISTS shop_with_mel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shop_with_mel;

-- ── Tabla: usuarios (login de la app) ────────────────────────────────────────
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)     NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  display_name  VARCHAR(120)     NOT NULL,
  is_active     TINYINT(1)       NOT NULL DEFAULT 1,
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla: productos ─────────────────────────────────────────────────────────
CREATE TABLE products (
  id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  sku         VARCHAR(50)    NULL,
  name        VARCHAR(200)   NOT NULL,
  description TEXT           NULL,
  image_url   MEDIUMTEXT     NULL,
  price       DECIMAL(10, 2) NOT NULL,
  stock       INT UNSIGNED   NOT NULL DEFAULT 0,
  is_active   TINYINT(1)     NOT NULL DEFAULT 1,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_active_name (is_active, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla: clientes ──────────────────────────────────────────────────────────
CREATE TABLE clients (
  id         INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  name       VARCHAR(200)   NOT NULL,
  phone      VARCHAR(30)    NULL,
  email      VARCHAR(255)   NULL,
  notes      TEXT           NULL,
  is_active  TINYINT(1)     NOT NULL DEFAULT 1,
  created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_clients_active_name (is_active, name),
  KEY idx_clients_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla: ventas (cabecera) ───────────────────────────────────────────────────
CREATE TABLE sales (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  client_id      INT UNSIGNED   NULL,
  registered_by  INT UNSIGNED   NOT NULL,
  sale_date      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal       DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  discount       DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total          DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  notes          TEXT           NULL,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sales_sale_date (sale_date),
  KEY idx_sales_client (client_id),
  KEY idx_sales_registered_by (registered_by),
  CONSTRAINT fk_sales_client
    FOREIGN KEY (client_id) REFERENCES clients (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sales_user
    FOREIGN KEY (registered_by) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_sales_totals_nonneg
    CHECK (subtotal >= 0 AND discount >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla: líneas de venta (detalle) ─────────────────────────────────────────
CREATE TABLE sale_items (
  id           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  sale_id      INT UNSIGNED   NOT NULL,
  product_id   INT UNSIGNED   NULL,
  product_name VARCHAR(200)   NOT NULL,
  quantity     INT UNSIGNED   NOT NULL,
  unit_price   DECIMAL(10, 2) NOT NULL,
  line_total   DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sale_items_sale (sale_id),
  KEY idx_sale_items_product (product_id),
  CONSTRAINT fk_sale_items_sale
    FOREIGN KEY (sale_id) REFERENCES sales (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_sale_items_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_sale_items_qty_price
    CHECK (quantity > 0 AND unit_price >= 0 AND line_total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ── Datos iniciales ──────────────────────────────────────────────────────────

INSERT INTO users (email, password_hash, display_name)
VALUES (
  'mel@shopwithmel.com',
  '$2b$10$jjiCdYDxK/uwGuxleF8viuBjj1lCd5BudyJVisZtMf3.WMMo8Mauq',
  'Mel'
);

-- Productos y clientes de ejemplo (opcional; borra si no los quieres)
INSERT INTO products (sku, name, description, price, stock) VALUES
  ('DUL-001', 'Paleta de sandía',  'Paleta artesanal sabor sandía',  15.00, 50),
  ('DUL-002', 'Gomitas surtidas',  'Bolsa 100 g',                    25.00, 30),
  ('DUL-003', 'Chocolate kinder',  'Unidad',                         18.00, 40);

INSERT INTO clients (name, phone, email) VALUES
  ('Cliente mostrador', NULL, NULL),
  ('Ana García',        '5512345678', 'ana@ejemplo.com');

-- =============================================================================
-- Fin del esquema
-- =============================================================================
