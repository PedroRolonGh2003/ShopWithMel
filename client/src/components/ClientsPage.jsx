import { useEffect, useState } from 'react';
import { api } from '../api';

const emptyForm = { name: '', phone: '' };

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(q = query) {
    setLoading(true);
    setError('');
    try {
      setClients(await api.getClients(q));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  function openCreate() {
    setForm(emptyForm);
    setModal('create');
  }

  function openEdit(c) {
    setForm({ name: c.name, phone: c.phone || '' });
    setModal(c.id);
  }

  function closeModal() {
    setModal(null);
    setForm(emptyForm);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.createClient(form);
      } else {
        await api.updateClient(modal, form);
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
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await api.deleteClient(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Clientes</h1>
        <p>Nombre y número de teléfono</p>
      </header>

      <div className="field">
        <input
          placeholder="Buscar por nombre o número…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <button type="button" className="btn btn-primary" onClick={openCreate}>
        + Nuevo cliente
      </button>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="empty">Cargando…</p>}
      {!loading && clients.length === 0 && <p className="empty">No hay clientes.</p>}

      {clients.map((c) => (
        <article key={c.id} className="card">
          <div className="card-row">
            <div>
              <p className="card-title">{c.name}</p>
              <p className="card-meta">{c.phone}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                Editar
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
                ✕
              </button>
            </div>
          </div>
        </article>
      ))}

      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'create' ? 'Nuevo cliente' : 'Editar cliente'}</h2>
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
                <label>Número *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="70123456"
                  required
                />
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
