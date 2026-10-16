import api from './client';

// Locked notes send the lock password in this header when they are edited or deleted
const lockHeader = (password) => (password ? { headers: { 'X-Lock-Password': password } } : undefined);

/**
 * All note-related REST calls.
 * Each function returns the JSON payload the server sends back.
 */
export const notesApi = {
  /** GET /api/notes?search=&tag=&pinned=&locked=&sort= */
  list: (params = {}) => api.get('/notes', { params }).then((r) => r.data),

  /** GET /api/notes/stats */
  stats: () => api.get('/notes/stats').then((r) => r.data.stats),

  /** GET /api/notes/:id */
  get: (id) => api.get(`/notes/${id}`).then((r) => r.data.note),

  /** POST /api/notes  – body: { title, content, tags, pinned, color } */
  create: (note) => api.post('/notes', note).then((r) => r.data.note),

  /** PUT /api/notes/:id – body: any changed fields */
  update: (id, changes, lockPassword) => api.put(`/notes/${id}`, changes, lockHeader(lockPassword)).then((r) => r.data.note),

  /** PATCH /api/notes/:id/pin */
  togglePin: (id) => api.patch(`/notes/${id}/pin`).then((r) => r.data.note),

  /** PATCH /api/notes/:id/lock – lock, or remove the lock (needs the password) */
  toggleLock: (id, password) => api.patch(`/notes/${id}/lock`, password ? { password } : {}).then((r) => r.data.note),

  /** POST /api/notes/:id/unlock – returns the full content of a locked note */
  unlock: (id, password) => api.post(`/notes/${id}/unlock`, { password }).then((r) => r.data.note),

  /** DELETE /api/notes/:id */
  remove: (id, lockPassword) => api.delete(`/notes/${id}`, lockHeader(lockPassword)).then((r) => r.data),
};

export const authApi = {
  register: (body) => api.post('/auth/register', body).then((r) => r.data),
  login: (body) => api.post('/auth/login', body).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data.user),
  /** PUT /api/auth/lock-password – body: { newPassword, currentPassword? } */
  setLockPassword: (body) => api.put('/auth/lock-password', body).then((r) => r.data.user),
};
