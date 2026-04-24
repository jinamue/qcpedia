const USER_STORAGE_KEY = 'qcpedia-user';
const TOKEN_STORAGE_KEY = 'qcpedia-token';
const SESSION_EVENT_NAME = 'qcpedia-session-change';

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function saveSession(user, token) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT_NAME));
}

export function clearSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT_NAME));
}

export function isAdminUser(user) {
  return Boolean(user) && String(user.tipe_user ?? '').trim() !== '4';
}

export function subscribeToSessionChange(callback) {
  window.addEventListener(SESSION_EVENT_NAME, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(SESSION_EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
}
