import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL: API_URL });

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kmj_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kmj_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Medicines
export const medicinesAPI = {
  getAll: (params) => api.get('/medicines', { params }),
  getById: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post('/medicines', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/medicines/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/medicines/${id}`),
  batchImport: (file) => { const fd = new FormData(); fd.append('file', file); return api.post('/medicines/batch-import', fd); },
  getLowStock: () => api.get('/medicines/low-stock'),
  getExpiring: (days) => api.get('/medicines/expiring', { params: { days } }),
};

// Transactions
export const transactionsAPI = {
  checkout: (data) => api.post('/transactions/checkout', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  updateStatus: (id, status) => api.patch(`/transactions/${id}/status`, { status }),
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Laporan
export const laporanAPI = {
  getPenjualan: (params) => api.get('/laporan/penjualan', { params }),
  getStokKritis: () => api.get('/laporan/stok-kritis'),
  getKadaluarsa: (days) => api.get('/laporan/kadaluarsa', { params: { days } }),
  exportPdf: () => api.get('/laporan/export-pdf', { responseType: 'blob' }),
};

// Monitoring
export const monitoringAPI = {
  getResources: () => api.get('/monitoring/resources'),
  getErrorLogs: (params) => api.get('/monitoring/error-logs', { params }),
  resolveError: (id) => api.patch(`/monitoring/error-logs/${id}/resolve`),
  getAuditLogs: (params) => api.get('/monitoring/audit-logs', { params }),
};
