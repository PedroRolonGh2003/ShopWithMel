#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { getPool } = require('../src/db');

async function main() {
  try {
    await getPool().query(
      `ALTER TABLE products ADD COLUMN image_url MEDIUMTEXT NULL AFTER description`
    );
    console.log('✅ Columna image_url añadida');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ La columna image_url ya existe');
      return;
    }
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
