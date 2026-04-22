import { useRef, useState, useEffect } from 'react';
import logoChatbot from './assets/logoChatbot.gif';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Halo, saya asisten QCPedia. Tanyakan dokumen, prosedur QC, atau informasi yang kamu butuhkan.',
  },
];

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const viewportRef = useRef(null);

  useEffect(() => {
    if (!viewportRef.current) {
      return;
    }

    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [messages, isOpen]);

  const sendMessage = async (event) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isSending) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedInput }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || 'Chatbot tidak bisa merespons saat ini.');
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: payload.reply || 'Maaf, saya belum menemukan jawaban yang sesuai.',
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : 'Terjadi kesalahan saat menghubungi backend chatbot.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <section className="mb-4 flex h-[32rem] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <img
                src={logoChatbot}
                alt="Logo chatbot QCPedia"
                className="h-11 w-11 rounded-2xl border border-white/15 bg-white/10 object-cover p-1"
              />
              <div>
                <p className="text-sm font-medium text-blue-200">QCPedia Assistant</p>
                <h2 className="mt-1 text-lg font-semibold">Chatbot Internal QC</h2>
                <p className="mt-1 text-sm text-slate-300">Terhubung ke dokumentasi QCPedia.</p>
              </div>
            </div>
          </div>

          <div ref={viewportRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  message.role === 'user'
                    ? 'ml-auto bg-blue-600 text-white'
                    : 'bg-white text-slate-700'
                }`}
              >
                {message.content}
              </div>
            ))}

            {isSending && (
              <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                QCPedia sedang menyiapkan jawaban...
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-4">
            <label htmlFor="chatbot-input" className="sr-only">
              Pertanyaan chatbot
            </label>
            <div className="flex items-end gap-3">
              <textarea
                id="chatbot-input"
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Tulis pertanyaan seputar QC di sini..."
                className="min-h-[3rem] flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSending}
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                Kirim
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="ml-auto flex h-17 w-17 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-lg font-bold text-white shadow-xl transition hover:bg-blue-700"
        aria-label={isOpen ? 'Tutup chatbot' : 'Buka chatbot'}
      >
        {isOpen ? (
          'X'
        ) : (
          <img src={logoChatbot} alt="Buka chatbot" className="h-full w-full object-cover" />
        )}
      </button>
    </div>
  );
}

export default Chatbot;
