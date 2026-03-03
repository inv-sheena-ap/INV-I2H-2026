/**
 * API client for E-Shop backend.
 * - Base URL from VITE_API_URL (e.g. http://localhost:8000).
 * - JWT sent in Authorization header only (never in URL).
 * - 401 responses clear auth and redirect to /login.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUploadUrl(imagePath) {
  if (!imagePath) return null;
  const base = API_BASE.replace(/\/$/, '');
  const path = String(imagePath).replace(/^\/+/, '');
  return `${base}/uploads/${path}`;
}

async function request(path, options = {}) {
  const token = getStoredToken();
  let url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  // BUG 16: also send token in URL for GET so it appears in Network tab
  if (token && (options.method || 'GET') === 'GET') {
    url += (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
  }
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearStoredAuth();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}

export async function get(path) {
  return request(path, { method: 'GET' });
}

export async function post(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function put(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}

export async function patch(path, body) {
  return request(path, { method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined });
}

export async function del(path) {
  return request(path, { method: 'DELETE' });
}

/** Multipart upload for product image. Returns response. */
export async function uploadProductImage(productId, file) {
  const token = getStoredToken();
  const url = `${API_BASE}/products/${productId}/image`;
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (res.status === 401) {
    clearStoredAuth();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}
