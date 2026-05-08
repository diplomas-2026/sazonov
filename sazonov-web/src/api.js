const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://sazonov.danbel.ru/api';
const AUTH_STORAGE_KEY = 'sazonov-auth';

export function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function request(path, { token, method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload && typeof payload === 'object' ? payload.message : payload;
    throw new Error(message || 'Не удалось выполнить запрос');
  }

  return payload;
}

async function blobRequest(path, { token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token
      ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
      : {},
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Не удалось скачать файл');
  }

  return response.blob();
}

export const api = {
  request,
  blobRequest,
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  updateMe: (token, payload) => request('/auth/me', { token, method: 'PUT', body: payload }),
  publicSpecialities: () => request('/public/specialities'),
  publicDashboard: () => request('/public/dashboard'),
  applicantApplications: (token) => request('/applicant/applications', { token }),
  applicantCreateApplication: (token, payload) =>
    request('/applicant/applications', { token, method: 'POST', body: payload }),
  applicantApplication: (token, id) => request(`/applicant/applications/${id}`, { token }),
  uploadDocument: (token, applicationId, type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return request(`/applicant/applications/${applicationId}/documents`, {
      token,
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },
  deleteDocument: (token, documentId) =>
    request(`/applicant/documents/${documentId}`, { token, method: 'DELETE' }),
  downloadDocument: (token, documentId) => blobRequest(`/applicant/documents/${documentId}`, { token }),
  staffApplications: (token, status) =>
    request(`/staff/applications${status ? `?status=${encodeURIComponent(status)}` : ''}`, { token }),
  staffUpdateStatus: (token, id, payload) =>
    request(`/staff/applications/${id}/status`, { token, method: 'PATCH', body: payload }),
  staffApplication: (token, id) => request(`/staff/applications/${id}`, { token }),
  adminDashboard: (token) => request('/admin/dashboard', { token }),
  adminSpecialities: (token) => request('/admin/specialities', { token }),
  adminCreateSpeciality: (token, payload) =>
    request('/admin/specialities', { token, method: 'POST', body: payload }),
  adminUpdateSpeciality: (token, id, payload) =>
    request(`/admin/specialities/${id}`, { token, method: 'PUT', body: payload }),
  adminDeleteSpeciality: (token, id) =>
    request(`/admin/specialities/${id}`, { token, method: 'DELETE' }),
  adminUsers: (token) => request('/admin/users', { token }),
  adminCreateUser: (token, payload) => request('/admin/users', { token, method: 'POST', body: payload }),
  adminUpdateUser: (token, id, payload) => request(`/admin/users/${id}`, { token, method: 'PUT', body: payload }),
};
