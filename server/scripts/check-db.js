#!/usr/bin/env node
/**
 * Verifica conexión a MySQL (local o Aiven).
 * Uso: npm run db:check --prefix server
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { getDbStatus } = require('../src/db');

getDbStatus().then((status) => {
  console.log(JSON.stringify(status, null, 2));
  process.exit(status.connected ? 0 : 1);
});
