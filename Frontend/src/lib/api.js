const TOKEN_KEY = 'mi_admin_token';

export const auth = {
  get token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage blocked */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
  },
};

async function request(path, { method = 'GET', body, admin = false } = {}) {
  const headers = {};
  if (admin && auth.token) headers.Authorization = `Bearer ${auth.token}`;
  const isForm = body instanceof FormData;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, { method, headers, body: body && !isForm ? JSON.stringify(body) : body });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && admin) {
    auth.clear();
    if (!location.pathname.startsWith('/admin/login')) location.assign('/admin/login');
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (p, o) => request(p, { ...o }),
  post: (p, body, o) => request(p, { ...o, method: 'POST', body }),
  put: (p, body, o) => request(p, { ...o, method: 'PUT', body }),
  patch: (p, body, o) => request(p, { ...o, method: 'PATCH', body }),
  del: (p, o) => request(p, { ...o, method: 'DELETE' }),
};

// Admin shortcuts
export const adminApi = {
  get: (p) => api.get(`/api/admin${p}`, { admin: true }),
  post: (p, b) => api.post(`/api/admin${p}`, b, { admin: true }),
  put: (p, b) => api.put(`/api/admin${p}`, b, { admin: true }),
  patch: (p, b) => api.patch(`/api/admin${p}`, b, { admin: true }),
  del: (p) => api.del(`/api/admin${p}`, { admin: true }),
};

// Authenticated file fetch (private documents, CSV export) → Blob.
export async function adminBlob(path) {
  const res = await fetch(`/api/admin${path}`, { headers: { Authorization: `Bearer ${auth.token}` } });
  if (res.status === 401) {
    auth.clear();
    location.assign('/admin/login');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.blob();
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Upload with progress (XHR so we can show a progress bar for big videos).
export function uploadMedia(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);
    xhr.open('POST', '/api/admin/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${auth.token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
