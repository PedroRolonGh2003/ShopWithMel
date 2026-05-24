const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { appendSaleToExcel } = require('../excel');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { from, to } = req.query;

  try {
    let sql = `
      SELECT
        s.id,
        s.client_id,
        c.name AS client_name,
        c.phone AS client_phone,
        s.sale_date,
        s.subtotal,
        s.discount,
        s.total,
        s.notes,
        s.created_at,
        u.display_name AS registered_by_name,
        (
          SELECT GROUP_CONCAT(
            CONCAT(si.product_name, ' × ', si.quantity)
            ORDER BY si.id SEPARATOR ', '
          )
          FROM sale_items si
          WHERE si.sale_id = s.id
        ) AS items_summary
      FROM sales s
      LEFT JOIN clients c ON c.id = s.client_id
      JOIN users u ON u.id = s.registered_by
      WHERE 1=1`;
    const params = {};

    if (from) {
      sql += ` AND s.sale_date >= :from`;
      params.from = `${from} 00:00:00`;
    }
    if (to) {
      sql += ` AND s.sale_date <= :to`;
      params.to = `${to} 23:59:59`;
    }

    sql += ` ORDER BY s.sale_date DESC, s.id DESC LIMIT 1000`;

    const [rows] = await getPool().query(sql, params);
    const totalSold = rows.reduce((sum, row) => sum + Number(row.total), 0);
    res.json({ sales: rows, totalSold, count: rows.length });
  } catch (err) {
    console.error('GET /sales', err);
    res.status(500).json({ error: 'No se pudo cargar el historial' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  try {
    const pool = getPool();
    const [sales] = await pool.query(
      `SELECT
         s.id, s.client_id, c.name AS client_name, c.phone AS client_phone,
         s.sale_date, s.subtotal, s.discount, s.total, s.notes, s.created_at
       FROM sales s
       LEFT JOIN clients c ON c.id = s.client_id
       WHERE s.id = :id`,
      { id }
    );

    if (!sales[0]) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const [items] = await pool.query(
      `SELECT id, product_id, product_name, quantity, unit_price, line_total
       FROM sale_items WHERE sale_id = :id ORDER BY id`,
      { id }
    );

    res.json({ ...sales[0], items });
  } catch (err) {
    console.error('GET /sales/:id', err);
    res.status(500).json({ error: 'No se pudo cargar la venta' });
  }
});

router.post('/', async (req, res) => {
  const { client_id, items, discount, notes, sale_date } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La venta debe tener al menos un producto' });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    let subtotal = 0;
    const lineRows = [];

    for (const raw of items) {
      const productId = Number(raw.product_id);
      const quantity = Number(raw.quantity);

      if (!productId || !quantity || quantity < 1) {
        throw Object.assign(new Error('INVALID_ITEM'), {
          status: 400,
          message: 'Cada línea debe tener producto y cantidad válidos',
        });
      }

      const [products] = await conn.query(
        `SELECT id, name, price, stock FROM products
         WHERE id = :id AND is_active = 1 FOR UPDATE`,
        { id: productId }
      );

      const product = products[0];
      if (!product) {
        throw Object.assign(new Error('PRODUCT_NOT_FOUND'), {
          status: 400,
          message: `Producto ${productId} no encontrado`,
        });
      }
      if (product.stock < quantity) {
        throw Object.assign(new Error('INSUFFICIENT_STOCK'), {
          status: 400,
          message: `Stock insuficiente para "${product.name}" (disponible: ${product.stock})`,
        });
      }

      const unitPrice = Number(raw.unit_price ?? product.price);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      subtotal += lineTotal;

      lineRows.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    const discountAmount = Math.max(0, Number(discount) || 0);
    const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    if (client_id) {
      const [clients] = await conn.query(
        `SELECT id FROM clients WHERE id = :id AND is_active = 1`,
        { id: Number(client_id) }
      );
      if (!clients[0]) {
        throw Object.assign(new Error('CLIENT_NOT_FOUND'), {
          status: 400,
          message: 'Cliente no encontrado',
        });
      }
    }

    const [saleResult] = await conn.query(
      `INSERT INTO sales (client_id, registered_by, sale_date, subtotal, discount, total, notes)
       VALUES (:client_id, :registered_by, :sale_date, :subtotal, :discount, :total, :notes)`,
      {
        client_id: client_id ? Number(client_id) : null,
        registered_by: req.user.id,
        sale_date: sale_date ? new Date(sale_date) : new Date(),
        subtotal,
        discount: discountAmount,
        total,
        notes: notes?.trim() || null,
      }
    );

    const saleId = saleResult.insertId;

    for (const line of lineRows) {
      await conn.query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total)
         VALUES (:sale_id, :product_id, :product_name, :quantity, :unit_price, :line_total)`,
        { sale_id: saleId, ...line }
      );

      await conn.query(
        `UPDATE products SET stock = stock - :qty WHERE id = :id`,
        { qty: line.quantity, id: line.product_id }
      );
    }

    await conn.commit();

    const [sales] = await pool.query(
      `SELECT s.id, s.client_id, c.name AS client_name, c.phone AS client_phone,
              s.sale_date, s.subtotal, s.discount, s.total, s.notes
       FROM sales s
       LEFT JOIN clients c ON c.id = s.client_id
       WHERE s.id = :id`,
      { id: saleId }
    );

    const [savedItems] = await pool.query(
      `SELECT id, product_id, product_name, quantity, unit_price, line_total
       FROM sale_items WHERE sale_id = :id`,
      { id: saleId }
    );

    const sale = sales[0];
    try {
      await appendSaleToExcel({
        sale,
        clientName: sale.client_name,
        clientPhone: sale.client_phone,
        items: savedItems,
      });
    } catch (excelErr) {
      console.error('Excel append failed (sale saved in DB):', excelErr);
    }

    res.status(201).json({ ...sale, items: savedItems });
  } catch (err) {
    await conn.rollback();

    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error('POST /sales', err);
    res.status(500).json({ error: 'No se pudo registrar la venta' });
  } finally {
    conn.release();
  }
});

module.exports = router;
