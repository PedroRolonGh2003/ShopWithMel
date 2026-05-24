const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

let pool;

const projectRoot = path.resolve(__dirname, '../..');

function resolveCertPath(caPath) {
  if (!caPath) return null;
  return path.isAbsolute(caPath) ? caPath : path.join(projectRoot, caPath);
}

function buildPoolConfig() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const isServerless = Boolean(process.env.VERCEL);
  const config = {
    host,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'shop_with_mel',
    waitForConnections: true,
    connectionLimit: isServerless ? 1 : 10,
    namedPlaceholders: true,
  };

  const caPath = resolveCertPath(process.env.DB_SSL_CA);
  const isAiven = host.includes('aivencloud.com');
  const caContent = process.env.DB_SSL_CA_CONTENT?.replace(/\\n/g, '\n');

  if (caContent) {
    config.ssl = { ca: caContent, rejectUnauthorized: true };
  } else if (caPath && fs.existsSync(caPath)) {
    config.ssl = { ca: fs.readFileSync(caPath), rejectUnauthorized: true };
  } else if (isAiven) {
    if (!isServerless) {
      console.warn(
        '⚠️  Falta certs/aiven-ca.pem — conexión SSL sin verificar CA. Descárgalo en Aiven.'
      );
    }
    config.ssl = { rejectUnauthorized: false };
  } else if (process.env.DB_SSL_CA) {
    console.warn(`⚠️  Certificado SSL no encontrado: ${caPath}`);
  }

  return config;
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool(buildPoolConfig());
  }
  return pool;
}

function resetPool() {
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
  }
}

async function pingDb() {
  const [rows] = await getPool().query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}

async function getDbStatus() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const caPath = resolveCertPath(process.env.DB_SSL_CA);
  const caContent = process.env.DB_SSL_CA_CONTENT;
  const sslEnabled = Boolean(buildPoolConfig().ssl);

  try {
    const pool = getPool();
    const [[info]] = await pool.query(
      `SELECT
         DATABASE() AS db_name,
         VERSION() AS version,
         NOW() AS server_time`
    );

    let counts = null;
    let schemaReady = true;
    try {
      const [[row]] = await pool.query(
        `SELECT
           (SELECT COUNT(*) FROM products WHERE is_active = 1) AS products,
           (SELECT COUNT(*) FROM clients WHERE is_active = 1) AS clients,
           (SELECT COUNT(*) FROM sales) AS sales`
      );
      counts = row;
    } catch {
      schemaReady = false;
    }

    const isAiven = host.includes('aivencloud.com');

    return {
      connected: true,
      schemaReady,
      provider: isAiven ? 'aiven' : 'local',
      host,
      port: Number(process.env.DB_PORT) || 3306,
      database: info.db_name,
      ssl: sslEnabled,
      sslCaConfigured: Boolean(caContent || (caPath && fs.existsSync(caPath))),
      version: info.version,
      serverTime: info.server_time,
      counts: counts || null,
    };
  } catch (err) {
    return {
      connected: false,
      provider: host.includes('aivencloud.com') ? 'aiven' : 'local',
      host,
      port: Number(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME,
      ssl: sslEnabled,
      error: err.message,
    };
  }
}

module.exports = { getPool, pingDb, getDbStatus };
