import axios from 'axios';

export const TOKEN_KEY = 'notes_token';

/**
 * One shared Axios instance for the whole app.
 * - baseURL is "/api" locally (Vite proxies it to Express) or VITE_API_URL in production.
 * - The request interceptor adds the JWT to every call.
 * - The response interceptor turns server errors into a simple { message, details } object.
 */
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data || {};

    // Token expired / invalid on a protected route → tell the app to log out
    if (status === 401 && !error.config?.url?.startsWith('/auth/')) {
      window.dispatchEvent(new Event('auth:logout'));
    }

    return Promise.reject({
      status,
      message: data.message || (status ? 'Request failed' : 'Cannot reach the server – is the API running?'),
      details: data.details || {},
    });
  }
);

export default api;
