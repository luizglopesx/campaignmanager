import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erro 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cm_token');
      localStorage.removeItem('cm_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==========================================
// Auth
// ==========================================
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  users: () => api.get('/auth/users'),
  updateMe: (data: any) => api.put('/auth/me', data),
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
};

// ==========================================
// Settings
// ==========================================
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  testChatwoot: () => api.post('/settings/test-chatwoot'),
  testWuzapi: () => api.post('/settings/test-wuzapi'),
};

// ==========================================
// Templates
// ==========================================
export const templatesApi = {
  list: (type?: string) => api.get('/templates', { params: { type } }),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: any) => api.post('/templates', data),
  update: (id: string, data: any) => api.put(`/templates/${id}`, data),
  duplicate: (id: string) => api.post(`/templates/${id}/duplicate`),
  delete: (id: string) => api.delete(`/templates/${id}`),
  preview: (id: string, variables?: any) =>
    api.post(`/templates/${id}/preview`, { variables }),
};

// ==========================================
// Leads
// ==========================================
export const leadsApi = {
  list: (params?: any) => api.get('/leads', { params }),
  get: (id: string) => api.get(`/leads/${id}`),
  updateStatus: (id: string, status: string) =>
    api.put(`/leads/${id}/status`, { followUpStatus: status }),
  stats: () => api.get('/leads/stats/overview'),
  startByLabel: (data: { label: string; templateIds: string[] }) =>
    api.post('/leads/start-followup-by-label', data),
  bulkStatus: (status: 'PAUSED' | 'ACTIVE') =>
    api.put('/leads/bulk-status', { status }),
  triggerFollowUp: (id: string) =>
    api.post(`/leads/${id}/trigger-followup`),
};

// ==========================================
// Campaigns
// ==========================================
export const campaignsApi = {
  list: (status?: string) => api.get('/campaigns', { params: { status } }),
  get: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: any) => api.post('/campaigns', data),
  update: (id: string, data: any) => api.put(`/campaigns/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.put(`/campaigns/${id}`, { status }),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
  addImages: (id: string, data: any) => api.post(`/campaigns/${id}/images`, data),
  addRecipients: (id: string, recipients: any[]) =>
    api.post(`/campaigns/${id}/recipients`, { recipients }),
  start: (id: string) => api.post(`/campaigns/${id}/start`),
};

// ==========================================
// Upload
// ==========================================
export const uploadApi = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  media: (file: File) => {
    const formData = new FormData();
    formData.append('media', file);
    return api.post('/upload/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (path: string) => api.delete('/upload/image', { data: { path } }),
};

// ==========================================
// Dashboard
// ==========================================
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// ==========================================
// History
// ==========================================
export const historyApi = {
  list: (params?: any) => api.get('/history', { params }),
  audit: (params?: any) => api.get('/history/audit', { params }),
};

// ==========================================
// Metrics
// ==========================================
export const metricsApi = {
  get: () => api.get('/metrics'),
};

// ==========================================
// Schedule (additional)
// ==========================================
export const scheduleCalendarApi = {
  get: (month?: string) => api.get('/schedule/calendar', { params: month ? { month } : {} }),
};

// ==========================================
// Broadcast
// ==========================================
export const broadcastApi = {
  labels: () => api.get('/broadcast/labels'),
  contactsByLabel: (label: string) => api.post('/broadcast/contacts-by-label', { label }),
  list: () => api.get('/broadcast'),
  get: (id: string) => api.get(`/broadcast/${id}`),
  create: (data: { label: string; message?: string; mediaUrl?: string; mediaType?: string; name?: string }) =>
    api.post('/broadcast', data),
  progress: (id: string) => api.get(`/broadcast/${id}/progress`),
  cancel: (id: string) => api.post(`/broadcast/${id}/cancel`),
  delete: (id: string) => api.delete(`/broadcast/${id}`),
  sendStatus: (data: { mediaUrl: string; caption?: string; mediaType?: string }) =>
    api.post('/broadcast/send-status', data),
};

// ==========================================
// Status (WhatsApp Status)
// ==========================================
export const statusApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('media', file);
    return api.post('/status/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2min para processamento de vídeo
    });
  },
  publish: (data: { mediaUrl: string; caption?: string; mediaType?: string }) =>
    api.post('/status/publish', data),
  history: () => api.get('/status/history'),
};

// ==========================================
// Contacts
// ==========================================
export const contactsApi = {
  list: (params?: any) => api.get('/contacts', { params }),
  all: () => api.get('/contacts/all'),
  syncChatwoot: () => api.post('/contacts/sync-chatwoot'),
  export: () => api.get('/contacts/export', { responseType: 'blob' }),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
