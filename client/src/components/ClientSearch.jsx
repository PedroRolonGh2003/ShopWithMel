import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

const emptyClientForm = { name: '', phone: '' };

export default function ClientSearch({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState('Mostrador');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyClientForm);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!value) setLabel('Mostrador');
  }, [value]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        setClients(await api.getClients(query));
      } catch {
        setClients([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function selectClient(client) {
    if (!client) {
      onChange('');
      setLabel('Mostrador');
    } else {
      onChange(String(client.id));
      setLabel(`${client.name} · ${client.phone}`);
    }
    setQuery('');
    setOpen(false);
  }

  function openCreateModal(prefillName = '') {
    setForm({ name: prefillName, phone: '' });
    setCreateError('');
    setCreateOpen(true);
    setOpen(false);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setForm(emptyClientForm);
    setCreateError('');
  }

  async function handleCreateClient(e) {
    e.preventDefault();
    setSaving(true);
    setCreateError('');
    try {
      const created = await api.createClient(form);
      selectClient(created);
      closeCreateModal();
    } catch (err) {
      setCreateError(err.message || 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="client-combobox" ref={wrapRef}>
      <div className="client-combobox-header">
        <label htmlFor="client-search">Cliente (opcional)</label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={openCreateModal}>
          + Nuevo cliente
        </button>
      </div>
      <div className="client-combobox-field">
        <input
          id="client-search"
          type="search"
          className="client-combobox-input"
          placeholder={open ? 'Escribe nombre o número…' : 'Toca para buscar cliente…'}
          value={open ? query : value ? label : ''}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          autoComplete="off"
        />
        {!open && value && (
          <button type="button" className="client-combobox-clear" onClick={() => selectClient(null)}>
            Mostrador
          </button>
        )}
      </div>
      {open && (
        <ul className="client-dropdown" role="listbox">
          <li>
            <button type="button" className="client-option" onClick={() => selectClient(null)}>
              Mostrador (sin cliente)
            </button>
          </li>
          {loading && <li className="client-option-muted">Buscando…</li>}
          {!loading && clients.length === 0 && query.trim() && (
            <li className="client-option-muted">Sin resultados</li>
          )}
          {!loading && clients.length === 0 && query.trim() && (
            <li>
              <button
                type="button"
                className="client-option client-option--new"
                onClick={() => openCreateModal(query.trim())}
              >
                + Registrar «{query.trim()}» como cliente nuevo
              </button>
            </li>
          )}
          {clients.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`client-option ${String(c.id) === value ? 'active' : ''}`}
                onClick={() => selectClient(c)}
              >
                <strong>{c.name}</strong>
                <span>{c.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {createOpen && (
        <div className="modal-backdrop" onClick={closeCreateModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nuevo cliente</h2>
            {createError && <div className="error-banner">{createError}</div>}
            <form onSubmit={handleCreateClient}>
              <div className="field">
                <label>Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
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
                <button type="button" className="btn btn-secondary" onClick={closeCreateModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar y usar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
