#!/usr/bin/env node
/**
 * Crea tablas en Aiven (defaultdb). Uso: npm run db:setup --prefix server
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getPool, resetPool, getDbStatus } = require('../src/db');

async function main() {
  resetPool();
  const before = await getDbStatus();
  if (!before.connected) {
    console.error('No hay conexión:', before.error);
    process.exit(1);
  }

  if (before.schemaReady) {
    console.log('✅ El esquema ya existe:', before.counts);
    process.exit(0);
  }

  const sqlPath = path.resolve(__dirname, '../../database/schema-aiven.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    for (const statement of statements) {
      if (statement.toUpperCase().startsWith('SET ')) {
        await conn.query(statement);
        continue;
      }
      await conn.query(statement);
      console.log('OK:', statement.slice(0, 60).replace(/\s+/g, ' ') + '…');
    }
    console.log('\n✅ Esquema creado en Aiven');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    conn.release();
  }

  resetPool();
  const after = await getDbStatus();
  console.log(JSON.stringify(after, null, 2));
}

main();
