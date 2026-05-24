import { useEffect, useMemo, useState } from 'react';
import { api, formatMoney } from '../api';

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatPeriodLabel(view, from, to) {
  if (view === 'today') return 'Hoy';
  if (view === 'all') return 'Todas las ventas';
  if (from && to && from !== to) return `${from} → ${to}`;
  if (from) return from;
  return 'Fecha específica';
}

export default function HistoryPage() {
  const [view, setView] = useState('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sales, setSales] = useState([]);
  const [totalSold, setTotalSold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dateParams = useMemo(() => {
    if (view === 'today') {
      const d = todayISO();
      return { from: d, to: d };
    }
    if (view === 'all') return {};
    const start = from || todayISO();
    const end = to || start;
    return { from: start, to: end };
  }, [view, from, to]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getSales(dateParams.from, dateParams.to);
        setSales(data.sales || []);
        setTotalSold(data.totalSold || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dateParams]);

  function switchView(next) {
    setView(next);
    if (next === 'custom' && !from) {
      setFrom(todayISO());
      setTo(todayISO());
    }
  }

  const sortedSales = useMemo(
    () => [...sales].sort((a, b) => new Date(a.sale_date) - new Date(b.sale_date)),
    [sales]
  );

  const totalLabel =
    view === 'today' ? 'Total vendido hoy' : `Total vendido (${formatPeriodLabel(view, from, to)})`;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Historial</h1>
        <p>Registro de ventas</p>
      </header>

      <div className="filter-tabs">
        <button
          type="button"
          className={`filter-tab ${view === 'today' ? 'active' : ''}`}
          onClick={() => switchView('today')}
        >
          Hoy
        </button>
        <button
          type="button"
          className={`filter-tab ${view === 'all' ? 'active' : ''}`}
          onClick={() => switchView('all')}
        >
          Todas
        </button>
        <button
          type="button"
          className={`filter-tab ${view === 'custom' ? 'active' : ''}`}
          onClick={() => switchView('custom')}
        >
          Por fecha
        </button>
      </div>

      {view === 'custom' && (
        <div className="date-filters">
          <div className="field">
            <label>Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label>Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="empty">Cargando…</p>}

      {!loading && (
        <div className="ledger-wrap">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Número</th>
                <th>Compró</th>
                <th className="ledger-num">Total (Bs.)</th>
              </tr>
            </thead>
            <tbody>
              {sortedSales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="ledger-empty">
                    Sin ventas en este periodo
                  </td>
                </tr>
              ) : (
                sortedSales.map((s) => (
                  <tr key={s.id}>
                    <td>{s.client_name || 'Mostrador'}</td>
                    <td>{s.client_phone || '—'}</td>
                    <td className="ledger-items">{s.items_summary || '—'}</td>
                    <td className="ledger-num">{formatMoney(s.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {sales.length > 0 && (
              <tfoot>
                <tr className="ledger-total-row">
                  <td colSpan={3}>
                    <strong>{totalLabel}</strong>
                    <span className="ledger-count"> · {sales.length} venta(s)</span>
                  </td>
                  <td className="ledger-num">
                    <strong>{formatMoney(totalSold)}</strong>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
