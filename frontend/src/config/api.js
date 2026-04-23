const DEFAULT_SERVER_API_BASE_URL = 'http://10.7.10.102:8000';
// Untuk development lokal, ganti ke baris ini bila diperlukan:
// const DEFAULT_SERVER_API_BASE_URL = 'http://127.0.0.1:8000';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_SERVER_API_BASE_URL;
