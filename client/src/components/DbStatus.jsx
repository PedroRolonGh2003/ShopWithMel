import { useEffect, useState } from 'react';
import { api } from '../api';

export default function DbStatus({ compact = false }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then((data) => setStatus(data))
      .catch((err) => setStatus({ ok: false, db: { connected: false, error: err.message } }));
  }, []);

  if (!status) {
    return <p className={`db-status ${compact ? 'compact' : ''}`}>Verificando base de datos…</p>;
  }

  const db = status.db || {};
  if (!db.connected) {
    return (
      <div className={`db-status error ${compact ? 'compact' : ''}`}>
        <strong>BD desconectada</strong>
        {!compact && <span>{db.error || 'Revisa .env y reinicia el servidor'}</span>}
      </div>
    );
  }

  const label = db.provider === 'aiven' ? 'Aiven' : 'Local';

  return (
    <div className={`db-status ok ${compact ? 'compact' : ''}`}>
      <strong>BD conectada · {label}</strong>
      {!compact && (
        <span>
          {db.host}/{db.database}
          {db.ssl ? ' · SSL' : ''}
          {db.counts
            ? ` · ${db.counts.products} prod. · ${db.counts.clients} clientes · ${db.counts.sales} ventas`
            : db.schemaReady === false
              ? ' · ⚠️ Falta ejecutar schema.sql en Aiven'
              : ''}
        </span>
      )}
    </div>
  );
}
