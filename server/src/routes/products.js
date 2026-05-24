const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const PRODUCT_FIELDS = `id, sku, name, description, image_url, price, stock, created_at, updated_at`;

function validateImage(imageUrl) {
  if (imageUrl == null || imageUrl === '') return null;
  if (typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:image/') || /^https?:\/\//i.test(trimmed)) {
    if (trimmed.length > 1_500_000) {
      throw Object.assign(new Error('IMAGE_TOO_LARGE'), {
        message: 'La imagen es demasiado grande (máx ~1 MB)',
      });
    }
    return trimmed;
  }
  throw Object.assign(new Error('IMAGE_INVALID'), {
    message: 'Formato de imagen no válido',
  });
}

router.get('/', async (_req, res) => {
  try {
    const [rows] = await getPool().query(
      `SELECT ${PRODUCT_FIELDS} FROM products WHERE is_active = 1 ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /products', err);
    res.status(500).json({ error: 'No se pudieron cargar los productos' });
  }
});

router.post('/', async (req, res) => {
  const { sku, name, description, image_url, price, stock } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  if (price == null || Number(price) < 0) {
    return res.status(400).json({ error: 'Precio inválido' });
  }

  try {
    const imageUrl = validateImage(image_url);
    const [result] = await getPool().query(
      `INSERT INTO products (sku, name, description, image_url, price, stock)
       VALUES (:sku, :name, :description, :image_url, :price, :stock)`,
      {
        sku: sku?.trim() || null,
        name: name.trim(),
        description: description?.trim() || null,
        image_url: imageUrl,
        price: Number(price),
        stock: Math.max(0, Number(stock) || 0),
      }
    );

    const [rows] = await getPool().query(
      `SELECT ${PRODUCT_FIELDS} FROM products WHERE id = :id`,
      { id: result.insertId }
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.message === 'La imagen es demasiado grande (máx ~1 MB)' || err.message === 'Formato de imagen no válido') {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un producto con ese SKU' });
    }
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({
        error: 'Falta columna image_url. Ejecuta database/migration-product-image.sql',
      });
    }
    console.error('POST /products', err);
    res.status(500).json({ error: 'No se pudo crear el producto' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { sku, name, description, image_url, price, stock, clear_image } = req.body;

  if (!id) return res.status(400).json({ error: 'ID inválido' });
  if (!name?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    let imageUrl;
    if (clear_image) {
      imageUrl = null;
    } else if (image_url !== undefined) {
      imageUrl = validateImage(image_url);
    } else {
      const [[current]] = await getPool().query(
        `SELECT image_url FROM products WHERE id = :id AND is_active = 1`,
        { id }
      );
      if (!current) return res.status(404).json({ error: 'Producto no encontrado' });
      imageUrl = current.image_url;
    }

    const [result] = await getPool().query(
      `UPDATE products SET
         sku = :sku,
         name = :name,
         description = :description,
         image_url = :image_url,
         price = :price,
         stock = :stock
       WHERE id = :id AND is_active = 1`,
      {
        id,
        sku: sku?.trim() || null,
        name: name.trim(),
        description: description?.trim() || null,
        image_url: imageUrl,
        price: Number(price),
        stock: Math.max(0, Number(stock) || 0),
      }
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const [rows] = await getPool().query(
      `SELECT ${PRODUCT_FIELDS} FROM products WHERE id = :id`,
      { id }
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.message === 'La imagen es demasiado grande (máx ~1 MB)' || err.message === 'Formato de imagen no válido') {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un producto con ese SKU' });
    }
  console.error('PUT /products/:id', err);
    res.status(500).json({ error: 'No se pudo actualizar el producto' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [result] = await getPool().query(
      `UPDATE products SET is_active = 0 WHERE id = :id AND is_active = 1`,
      { id }
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /products/:id', err);
    res.status(500).json({ error: 'No se pudo eliminar el producto' });
  }
});

module.exports = router;
