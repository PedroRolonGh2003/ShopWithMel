const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { getDbStatus } = require('./db');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const clientsRoutes = require('./routes/clients');
const salesRoutes = require('./routes/sales');

const app = express();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET débil o ausente. Define uno largo en producción.');
}

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === clientOrigin) return true;
  if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
    return true;
  }
  if (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`) {
    return true;
  }
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) {
    return true;
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req, res) => {
  const db = await getDbStatus();
  if (!db.connected) {
    return res.status(503).json({ ok: false, db });
  }
  res.json({ ok: true, db });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/sales', salesRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
