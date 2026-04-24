import { useState } from 'react';
import { API_BASE_URL } from '../config/api';

const CONTACT_RECIPIENTS = [
  { value: 'adminqc.rtm@cp.co.id', label: 'adminqc.rtm@cp.co.id' },
  { value: 'putri.harnis@cp.co.id', label: 'putri.harnis@cp.co.id' },
  { value: '7ayyentt@gmail.com', label: '7ayyentt@gmail.com' },
];

const initialForm = {
  name: '',
  email: '',
  recipient_email: CONTACT_RECIPIENTS[0].value,
  message: '',
};

function Contact() {
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || 'Pesan gagal dikirim.');
      }

      setForm(initialForm);
      setFeedback({ type: 'success', message: payload.message });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Pesan gagal dikirim.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-slate-50">
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="animate-fade-up rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/70 p-6">
              <span className="inline-flex rounded-full bg-red-50 px-4 py-1 text-sm font-medium text-red-700">
                Kontak
              </span>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">Hubungi tim QCPedia</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Form ini akan mengirim email lewat Gmail backend dan hanya bisa diarahkan ke email resmi
                yang sudah didaftarkan.
              </p>

              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-800">Email resmi</p>
                  <p>
                    adminqc.rtm@cp.co.id
                    <br />
                    putri.harnis@cp.co.id
                    <br />
                    7ayyentt@gmail.com
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Lokasi</p>
                  <p>PT. Charoen Pokphand Indonesia, Cikande</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Jam Operasional</p>
                  <p>Senin - Sabtu, 08.00 - 17.00 WIB</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="animate-fade-up-delay grid gap-5">
              {feedback.message && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    feedback.type === 'success'
                      ? 'border border-green-200 bg-green-50 text-green-700'
                      : 'border border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                  Nama
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email pengirim
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="recipient_email" className="mb-2 block text-sm font-medium text-slate-700">
                  Kirim ke
                </label>
                <select
                  id="recipient_email"
                  value={form.recipient_email}
                  onChange={(event) => handleChange('recipient_email', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                  required
                >
                  {CONTACT_RECIPIENTS.map((recipient) => (
                    <option key={recipient.value} value={recipient.value}>
                      {recipient.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-700">
                  Pesan
                </label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(event) => handleChange('message', event.target.value)}
                  placeholder="Tulis kebutuhan atau pertanyaan Anda di sini"
                  rows={6}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-fit items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Contact;
