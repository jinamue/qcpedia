import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { saveSession } from '../config/auth';

const initialLoginForm = {
  email: '',
  password: '',
};

function AdminLoginModal({ isOpen, onClose }) {
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (!isOpen) {
      setLoginForm(initialLoginForm);
      setIsLoggingIn(false);
      setFeedback({ type: '', message: '' });
      return;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || 'Login admin gagal.');
      }

      saveSession(payload.user, payload.access_token);
      setFeedback({ type: 'success', message: `Selamat datang, ${payload.user.nama}.` });
      window.setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Login admin gagal.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
              Admin Panel
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">Login Admin</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Masuk sebagai admin untuk mendapatkan akses edit isi kategori.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>

        {feedback.message && (
          <div
            className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-700'
                : 'border border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-700">
              Email admin
            </label>
            <input
              id="admin-email"
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
              placeholder="admin@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
              placeholder="Masukkan password admin"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isLoggingIn ? 'Memproses...' : 'Login Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginModal;
