#!/usr/bin/env node
/**
 * Permite borrar productos agotados: sale_items.product_id pasa a NULL al eliminar el producto.
 * Ejecutar una vez: node server/scripts/migrate-sale-items-product-null.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { getPool } = require('../src/db');

const sqlPath = path.resolve(__dirname, '../../database/migration-sale-items-product-null.sql');

async function main() {
  const pool = getPool();
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await pool.query(statement);
      console.log('OK:', statement.slice(0, 60).replace(/\s+/g, ' ') + '…');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY' && /fk_sale_items_product/.test(statement)) {
        console.log('FK ya actualizada, omitiendo DROP');
        continue;
      }
      if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_CANT_CREATE_TABLE') {
        console.log('Migración ya aplicada o estado compatible:', err.message);
        continue;
      }
      throw err;
    }
  }
  console.log('✅ Migración sale_items completada');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
