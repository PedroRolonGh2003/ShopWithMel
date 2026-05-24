const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, email, password_hash, display_name, is_active
       FROM users WHERE email = :email LIMIT 1`,
      { email: email.trim().toLowerCase() }
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.display_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.display_name },
    });
  } catch (err) {
    console.error('POST /auth/login', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

module.exports = router;
