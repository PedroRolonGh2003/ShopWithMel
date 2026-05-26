#!/usr/bin/env node
/**
 * Limpia ventas, productos y clientes (deja usuarios intactos).
 * Uso: node server/scripts/clear-all-data.js
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getPool } = require('../src/db');
const { getExcelPath } = require('../src/excel');

async function main() {
  const pool = getPool();

  const [[counts]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM sales) AS sales,
       (SELECT COUNT(*) FROM sale_items) AS sale_items,
       (SELECT COUNT(*) FROM products) AS products,
       (SELECT COUNT(*) FROM clients) AS clients`
  );

  await pool.query('DELETE FROM sales');
  await pool.query('DELETE FROM products');
  await pool.query('DELETE FROM clients');

  const excelPath = getExcelPath();
  if (fs.existsSync(excelPath)) {
    fs.unlinkSync(excelPath);
  }

  console.log('✅ Datos eliminados:');
  console.log(`   Ventas: ${counts.sales} (${counts.sale_items} líneas)`);
  console.log(`   Productos: ${counts.products}`);
  console.log(`   Clientes: ${counts.clients}`);
  if (fs.existsSync(excelPath) === false && counts.sales > 0) {
    console.log('   Excel local: eliminado o no existía');
  }
  console.log('Usuarios de login: sin cambios.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
