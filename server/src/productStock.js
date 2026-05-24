/**
 * Quita del inventario productos con stock 0 (caja agotada).
 * Borrado físico si la FK lo permite; si no, desactiva (hasta migrar sale_items).
 */
async function removeProductIfOutOfStock(conn, productId) {
  try {
    const [result] = await conn.query(
      `DELETE FROM products WHERE id = :id AND stock = 0`,
      { id: productId }
    );
    return result.affectedRows > 0;
  } catch (err) {
    if (err.code !== 'ER_ROW_IS_REFERENCED_2') throw err;
    const [soft] = await conn.query(
      `UPDATE products SET is_active = 0 WHERE id = :id AND stock = 0`,
      { id: productId }
    );
    return soft.affectedRows > 0;
  }
}

module.exports = { removeProductIfOutOfStock };
