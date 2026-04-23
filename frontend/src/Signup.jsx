import { useEffect, useState } from 'react';
import { API_BASE_URL } from './config/api';

const REQUEST_TIMEOUT_MS = 10000;
const SUCCESS_POPUP_DURATION_MS = 2200;

const initialSignupForm = {
  nama: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function SignupModel({ isOpen, onClose, onOpenLogin, onAuthSuccess }) {
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSignupForm(initialSignupForm);
      setFeedback({ type: '', message: '' });
      setIsSubmitting(false);
      setShowSuccessPopup(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSignupChange = (field, value) => {
    setSignupForm((current) => ({ ...current, [field]: value }));
  };

  const readResponsePayload = async (response) => {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    return { detail: text };
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setFeedback({ type: '', message: '' });

    if (signupForm.password !== signupForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'Konfirmasi password tidak cocok.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: signupForm.nama,
          username: signupForm.username,
          email: signupForm.email,
          password: signupForm.password,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      const payload = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(payload.detail || 'Pendaftaran gagal.');
      }

      setShowSuccessPopup(true);
      setFeedback({ type: 'success', message: payload.message });
      onAuthSuccess?.(payload.user);
      
      setTimeout(() => {
        setShowSuccessPopup(false);
        setSignupForm(initialSignupForm);
        onClose();
      }, SUCCESS_POPUP_DURATION_MS);
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error && error.name === 'AbortError'
            ? 'Signup timeout. Cek backend atau koneksi database lalu coba lagi.'
            : error instanceof Error
              ? error.message
              : 'Pendaftaran gagal.',
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
              <span className="inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
                Signup
              </span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Daftar akun QCPedia
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

          <form onSubmit={handleSignup} className="mt-6 space-y-4">
            <div>
              <label htmlFor="signup-nama" className="mb-2 block text-sm font-medium text-slate-700">
                Nama
              </label>
              <input
                id="signup-nama"
                type="text"
                value={signupForm.nama}
                onChange={(event) => handleSignupChange('nama', event.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-username" className="mb-2 block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                value={signupForm.username}
                onChange={(event) => handleSignupChange('username', event.target.value)}
                placeholder="Masukkan username"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={signupForm.email}
                onChange={(event) => handleSignupChange('email', event.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={signupForm.password}
                onChange={(event) => handleSignupChange('password', event.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="mb-2 block text-sm font-medium text-slate-700">
                Konfirmasi Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                value={signupForm.confirmPassword}
                onChange={(event) => handleSignupChange('confirmPassword', event.target.value)}
                placeholder="Ulangi password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting ? 'Memproses...' : 'Signup'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin?.();
              }}
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Login
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
            <h3 className="text-2xl font-bold text-green-700">Pendaftaran Berhasil!</h3>
            <p className="mt-2 text-slate-600">Akun Anda sudah terdaftar dan siap digunakan.</p>
          </div>
        </div>
      )}
    </>
  );
}

export default SignupModel;
