import { useEffect, useState } from 'react';
import { API_BASE_URL } from './config/api';

const REQUEST_TIMEOUT_MS = 10000;
const SUCCESS_POPUP_DURATION_MS = 2200;

const initialLoginForm = {
  email: '',
  password: '',
};

function LoginModel({ isOpen, onClose, onOpenSignup, onAuthSuccess }) {
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLoginForm(initialLoginForm);
      setFeedback({ type: '', message: '' });
      setIsSubmitting(false);
      setShowSuccessPopup(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleLoginChange = (field, value) => {
    setLoginForm((current) => ({ ...current, [field]: value }));
  };

  const readResponsePayload = async (response) => {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    return { detail: text };
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(payload.detail || 'Login gagal.');
      }

      setShowSuccessPopup(true);
      setFeedback({
        type: 'success',
        message: `Selamat datang, ${payload.user.nama}!`,
      });
      onAuthSuccess?.(payload.user);
      
      setTimeout(() => {
        setShowSuccessPopup(false);
        onClose();
      }, SUCCESS_POPUP_DURATION_MS);
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error && error.name === 'AbortError'
            ? 'Login timeout. Cek backend atau koneksi database lalu coba lagi.'
            : error instanceof Error
              ? error.message
              : 'Login gagal.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
                Login
              </span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Masuk ke QCPedia
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
            >
              X
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

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={loginForm.email}
                onChange={(event) => handleLoginChange('email', event.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={loginForm.password}
                onChange={(event) => handleLoginChange('password', event.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isSubmitting ? 'Memproses...' : 'Login'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Belum punya akun?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSignup?.();
              }}
              className="font-semibold text-red-600 transition hover:text-red-700"
            >
              Signup
            </button>
          </p>
        </div>
      </div>

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45">
          <div className="w-full max-w-sm rounded-3xl border border-green-200 bg-white p-6 shadow-2xl text-center sm:p-8">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-700">Login Berhasil!</h3>
            <p className="mt-2 text-slate-600">Anda akan dialihkan dalam beberapa detik...</p>
          </div>
        </div>
      )}
    </>
  );
}

export default LoginModel;
