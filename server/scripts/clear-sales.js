#!/usr/bin/env node
/**
 * Borra todas las ventas de prueba (sales + sale_items).
 * El historial en Excel local también se elimina si existe.
 *
 * Uso: node server/scripts/clear-sales.js
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getPool } = require('../src/db');
const { getExcelPath } = require('../src/excel');

async function main() {
  const pool = getPool();

  const [[{ salesCount }]] = await pool.query('SELECT COUNT(*) AS salesCount FROM sales');
  const [[{ itemsCount }]] = await pool.query('SELECT COUNT(*) AS itemsCount FROM sale_items');

  if (salesCount === 0) {
    console.log('No hay ventas en la base de datos.');
  } else {
    await pool.query('DELETE FROM sales');
    console.log(`✅ Eliminadas ${salesCount} ventas y ${itemsCount} líneas de detalle.`);
  }

  const excelPath = getExcelPath();
  if (fs.existsSync(excelPath)) {
    fs.unlinkSync(excelPath);
    console.log(`✅ Archivo Excel eliminado: ${excelPath}`);
  }

  const [[after]] = await pool.query('SELECT COUNT(*) AS c FROM sales');
  console.log(`Ventas restantes: ${after.c}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
