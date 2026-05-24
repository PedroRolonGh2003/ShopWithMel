const TOKEN_KEY = 'swm_token';
const USER_KEY = 'swm_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error(data?.error || 'Error de red');
    err.status = res.status;
    throw err;
  }

  return data;
}

export async function getHealth() {
  const res = await fetch('/api/health');
  const data = await res.json();
  return data;
}

export const api = {
  getHealth,

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProducts: () => request('/products'),
  createProduct: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  getClients: (q = '') => request(`/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createClient: (body) => request('/clients', { method: 'POST', body: JSON.stringify(body) }),
  updateClient: (id, body) =>
    request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),

  getSales: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request(`/sales${qs ? `?${qs}` : ''}`);
  },
  getSale: (id) => request(`/sales/${id}`),
  createSale: (body) => request('/sales', { method: 'POST', body: JSON.stringify(body) }),
};

export function formatMoney(n) {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(n));
}
