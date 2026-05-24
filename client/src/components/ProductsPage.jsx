import { useEffect, useState } from 'react';
import { api, formatMoney } from '../api';
import { readImageFile } from '../utils/image';

const emptyForm = { name: '', price: '', stock: '', image_url: '', clear_image: false };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setProducts(await api.getProducts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setImageError('');
    setModal('create');
  }

  function openEdit(p) {
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      image_url: p.image_url || '',
      clear_image: false,
    });
    setImageError('');
    setModal(p.id);
  }

  function closeModal() {
    setModal(null);
    setForm(emptyForm);
    setImageError('');
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    try {
      const dataUrl = await readImageFile(file);
      setForm((prev) => ({ ...prev, image_url: dataUrl, clear_image: false }));
    } catch (err) {
      setImageError(err.message);
      e.target.value = '';
    }
  }

  function removeImage() {
    setForm((prev) => ({ ...prev, image_url: '', clear_image: true }));
    setImageError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      image_url: form.image_url || null,
      clear_image: form.clear_image,
    };
    try {
      if (modal === 'create') {
        await api.createProduct(body);
      } else {
        await api.updateProduct(modal, body);
      }
      closeModal();
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.deleteProduct(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page page--gallery">
      <header className="page-header">
        <h1>Productos</h1>
        <p>{products.length} activos · precios en bolivianos</p>
      </header>

      <button type="button" className="btn btn-primary" onClick={openCreate}>
        + Nuevo producto
      </button>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="empty">Cargando…</p>}
      {!loading && products.length === 0 && (
        <p className="empty">No hay productos. Crea el primero.</p>
      )}

      <div className="product-gallery">
        {products.map((p) => (
          <article key={p.id} className="gallery-card">
            <div className="gallery-image-wrap">
              {p.image_url ? (
                <img className="gallery-image" src={p.image_url} alt={p.name} loading="lazy" />
              ) : (
                <div className="gallery-image gallery-image--empty" aria-hidden>
                  📦
                </div>
              )}
            </div>
            <div className="gallery-body">
              <h3 className="gallery-name">{p.name}</h3>
              <p className="gallery-price">{formatMoney(p.price)}</p>
              <p className="gallery-stock">Cantidad: {p.stock}</p>
            </div>
            <div className="gallery-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                Editar
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                ✕
              </button>
            </div>
          </article>
        ))}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'create' ? 'Nuevo producto' : 'Editar producto'}</h2>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Cantidad *</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Precio (Bs.) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Imagen</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {imageError && <p className="field-hint field-hint--error">{imageError}</p>}
                {form.image_url && (
                  <div className="image-preview-wrap">
                    <img src={form.image_url} alt="Vista previa" className="image-preview" />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={removeImage}>
                      Quitar imagen
                    </button>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
