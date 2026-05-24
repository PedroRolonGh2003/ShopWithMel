import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

export default function ClientSearch({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState('Mostrador');
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

  return (
    <div className="client-combobox" ref={wrapRef}>
      <label htmlFor="client-search">Cliente (opcional)</label>
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
      {open && (
        <ul className="client-dropdown" role="listbox">
          <li>
            <button type="button" className="client-option" onClick={() => selectClient(null)}>
              Mostrador (sin cliente)
            </button>
          </li>
          {loading && <li className="client-option-muted">Buscando…</li>}
          {!loading && clients.length === 0 && (
            <li className="client-option-muted">Sin resultados</li>
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
    </div>
  );
}
