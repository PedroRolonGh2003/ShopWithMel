const TABS = [
  { id: 'sale', icon: '🛒', label: 'Vender' },
  { id: 'products', icon: '📦', label: 'Productos' },
  { id: 'clients', icon: '👥', label: 'Clientes' },
  { id: 'history', icon: '📋', label: 'Historial' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-btn ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
