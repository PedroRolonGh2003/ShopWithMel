import { useState } from 'react';
import { getToken, getUser, clearSession } from './api';
import Login from './components/Login';
import BottomNav from './components/BottomNav';
import SalePage from './components/SalePage';
import ProductsPage from './components/ProductsPage';
import ClientsPage from './components/ClientsPage';
import HistoryPage from './components/HistoryPage';

export default function App() {
  const [user, setUser] = useState(() => (getToken() ? getUser() : null));
  const [tab, setTab] = useState('sale');

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-row">
          <span>Hola, {user.name}</span>
          <button type="button" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      {tab === 'sale' && <SalePage />}
      {tab === 'products' && <ProductsPage />}
      {tab === 'clients' && <ClientsPage />}
      {tab === 'history' && <HistoryPage />}

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
