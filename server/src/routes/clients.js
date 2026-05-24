const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const CLIENT_FIELDS = 'id, name, phone, created_at, updated_at';

router.get('/', async (req, res) => {
  const q = req.query.q?.trim();

  try {
    let sql = `
      SELECT ${CLIENT_FIELDS}
      FROM clients WHERE is_active = 1`;
    const params = {};

    if (q) {
      sql += ` AND (name LIKE :q OR phone LIKE :q)`;
      params.q = `%${q}%`;
    }

    sql += ` ORDER BY name ASC LIMIT 50`;

    const [rows] = await getPool().query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /clients', err);
    res.status(500).json({ error: 'No se pudieron cargar los clientes' });
  }
});

router.post('/', async (req, res) => {
  const { name, phone } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (!phone?.trim()) {
    return res.status(400).json({ error: 'El número es obligatorio' });
  }

  try {
    const [result] = await getPool().query(
      `INSERT INTO clients (name, phone) VALUES (:name, :phone)`,
      { name: name.trim(), phone: phone.trim() }
    );

    const [rows] = await getPool().query(
      `SELECT ${CLIENT_FIELDS} FROM clients WHERE id = :id`,
      { id: result.insertId }
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /clients', err);
    res.status(500).json({ error: 'No se pudo crear el cliente' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone } = req.body;

  if (!id) return res.status(400).json({ error: 'ID inválido' });
  if (!name?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
  if (!phone?.trim()) return res.status(400).json({ error: 'El número es obligatorio' });

  try {
    const [result] = await getPool().query(
      `UPDATE clients SET name = :name, phone = :phone WHERE id = :id AND is_active = 1`,
      { id, name: name.trim(), phone: phone.trim() }
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const [rows] = await getPool().query(
      `SELECT ${CLIENT_FIELDS} FROM clients WHERE id = :id`,
      { id }
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /clients/:id', err);
    res.status(500).json({ error: 'No se pudo actualizar el cliente' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [result] = await getPool().query(
      `UPDATE clients SET is_active = 0 WHERE id = :id AND is_active = 1`,
      { id }
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /clients/:id', err);
    res.status(500).json({ error: 'No se pudo eliminar el cliente' });
  }
});

module.exports = router;
