import { useEffect, useMemo, useState } from 'react';
import { api, formatMoney } from '../api';
import ClientSearch from './ClientSearch';

export default function SalePage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [clientId, setClientId] = useState('');
  const [discount, setDiscount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setProducts(await api.getProducts());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === Number(id));
        if (!product || qty <= 0) return null;
        return { product, qty };
      })
      .filter(Boolean);
  }, [cart, products]);

  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const discountNum = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountNum);

  function setQty(productId, qty) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }

  async function handleSubmit() {
    if (cartLines.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.createSale({
        client_id: clientId ? Number(clientId) : null,
        discount: discountNum,
        items: cartLines.map((line) => ({
          product_id: line.product.id,
          quantity: line.qty,
        })),
      });
      setCart({});
      setDiscount('');
      setClientId('');
      setSuccess('¡Venta registrada!');
      setProducts(await api.getProducts());
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="empty">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="page page--gallery">
      <header className="page-header">
        <h1>Nueva venta</h1>
        <p>Selecciona productos y confirma</p>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div className="card" style={{ background: '#e8f8f0', borderColor: '#b8e6cc' }}>
          {success}
        </div>
      )}

      <ClientSearch value={clientId} onChange={setClientId} />

      <div className="product-gallery sale-gallery">
        {products.map((p) => {
          const qty = cart[p.id] || 0;
          return (
            <article
              key={p.id}
              className={`gallery-card gallery-card--sale ${qty > 0 ? 'is-selected' : ''}`}
            >
              <div className="gallery-image-wrap">
                {p.image_url ? (
                  <img className="gallery-image" src={p.image_url} alt={p.name} loading="lazy" />
                ) : (
                  <div className="gallery-image gallery-image--empty">📦</div>
                )}
                {qty > 0 && <span className="sale-badge">{qty}</span>}
              </div>
              <div className="gallery-body">
                <h3 className="gallery-name">{p.name}</h3>
                <p className="gallery-price">{formatMoney(p.price)}</p>
                <p className="gallery-stock">Stock: {p.stock}</p>
              </div>
              <div className="gallery-qty">
                <button type="button" onClick={() => setQty(p.id, qty - 1)} disabled={qty === 0}>
                  −
                </button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty(p.id, qty + 1)} disabled={qty >= p.stock}>
                  +
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {cartLines.length > 0 && (
        <>
          <div className="field" style={{ marginTop: '1rem' }}>
            <label>Descuento (Bs.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="cart-total">
            <span>{cartLines.length} producto(s)</span>
            <strong>{formatMoney(total)}</strong>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '0.75rem' }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Registrando…' : 'Confirmar venta'}
          </button>
        </>
      )}
    </div>
  );
}
