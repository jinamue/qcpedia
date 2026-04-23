import { useRef, useState, useEffect } from 'react';
import logoChatbot from './assets/logoChatbot.gif';
import { API_BASE_URL } from './config/api';

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Halo, saya asisten QCPedia. Tanyakan dokumen, prosedur QC, atau informasi yang kamu butuhkan.',
    options: null,
  },
];

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

function renderInlineFormatting(text) {
  const segments = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={`${segment}-${index}`}>{segment.slice(2, -2)}</strong>;
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function renderHtmlNode(node, key) {
  if (node.nodeType === TEXT_NODE) {
    const text = node.textContent ?? '';
    return text.trim() ? <span key={key}>{text}</span> : null;
  }

  if (node.nodeType !== ELEMENT_NODE) {
    return null;
  }

  const children = Array.from(node.childNodes)
    .map((child, index) => renderHtmlNode(child, `${key}-${index}`))
    .filter(Boolean);

  const tagName = node.nodeName.toLowerCase();
  const isBold = node.style?.fontWeight === 'bold';
  const isBlue = node.style?.color === 'blue';
  const className = isBlue ? 'text-blue-600' : undefined;

  switch (tagName) {
    case 'strong':
    case 'b':
      return (
        <strong key={key} className={className}>
          {children}
        </strong>
      );
    case 'em':
    case 'i':
      return (
        <em key={key} className={className}>
          {children}
        </em>
      );
    case 'p':
      return (
        <p key={key} className={`whitespace-pre-wrap ${className ?? ''}`.trim()}>
          {isBold ? <strong>{children}</strong> : children}
        </p>
      );
    case 'ul':
      return (
        <ul key={key} className="list-disc space-y-1 pl-5">
          {children}
        </ul>
      );
    case 'ol':
      return (
        <ol key={key} className="list-decimal space-y-1 pl-5">
          {children}
        </ol>
      );
    case 'li':
      return <li key={key}>{isBold ? <strong>{children}</strong> : children}</li>;
    case 'br':
      return <br key={key} />;
    case 'td':
    case 'div':
    case 'span':
    case 'table':
    case 'tbody':
    case 'thead':
    case 'tr':
      if (isBold) {
        return (
          <div key={key} className={className}>
            <strong>{children}</strong>
          </div>
        );
      }

      return (
        <div key={key} className={className}>
          {children}
        </div>
      );
    default:
      return (
        <div key={key} className={className}>
          {children}
        </div>
      );
  }
}

function renderHtmlContent(content) {
  if (typeof window === 'undefined' || !content.includes('<')) {
    return null;
  }

  const parser = new window.DOMParser();
  const document = parser.parseFromString(content, 'text/html');
  const hasElement = Array.from(document.body.childNodes).some(
    (node) => node.nodeType === ELEMENT_NODE,
  );

  if (!hasElement) {
    return null;
  }

  return Array.from(document.body.childNodes)
    .map((node, index) => renderHtmlNode(node, `html-${index}`))
    .filter(Boolean);
}

function renderMessageContent(content) {
  const htmlContent = renderHtmlContent(content);

  if (htmlContent) {
    return htmlContent;
  }

  const normalizedContent = content
    .replace(/\s+\*\s+(?=\*\*|\S)/g, '\n* ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = normalizedContent.split('\n').filter((line) => line.trim());
  const blocks = [];
  let currentList = [];

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('* ')) {
      currentList.push(trimmedLine.slice(2).trim());
      return;
    }

    if (currentList.length > 0) {
      blocks.push({ type: 'list', items: currentList });
      currentList = [];
    }

    blocks.push({ type: 'paragraph', text: trimmedLine });
  });

  if (currentList.length > 0) {
    blocks.push({ type: 'list', items: currentList });
  }

  return blocks.map((block, index) => {
    if (block.type === 'list') {
      return (
        <ul key={`list-${index}`} className="list-disc space-y-1 pl-5">
          {block.items.map((item, itemIndex) => (
            <li key={`item-${itemIndex}`}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`paragraph-${index}`} className="whitespace-pre-wrap">
        {renderInlineFormatting(block.text)}
      </p>
    );
  });
}

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

  const requestReply = async (messageText) => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageText }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.detail || 'Chatbot tidak bisa merespons saat ini.');
    }

    if (payload.type === 'disambiguation') {
      return {
        content: payload.message || 'Saya menemukan beberapa pilihan. Silakan pilih salah satu.',
        options: payload.options || [],
      };
    }

    return {
      content: payload.reply || 'Maaf, saya belum menemukan jawaban yang sesuai.',
      options: null,
    };
  };

  const appendAssistantMessage = (assistantPayload, idSuffix = Date.now()) => {
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${idSuffix}`,
        role: 'assistant',
        content: assistantPayload.content,
        options: assistantPayload.options ?? null,
      },
    ]);
  };

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
      options: null,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const assistantPayload = await requestReply(trimmedInput);
      appendAssistantMessage(assistantPayload);
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
          options: null,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleOptionClick = async (option) => {
    if (!option?.value || isSending) {
      return;
    }

    const optionMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: option.label ?? option.value,
      options: null,
    };

    setMessages((current) => [...current, optionMessage]);
    setIsSending(true);

    try {
      const assistantPayload = await requestReply(option.value);
      appendAssistantMessage(assistantPayload);
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
          options: null,
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
                    : 'space-y-2 bg-white text-slate-700'
                }`}
              >
                {renderMessageContent(message.content)}
                {message.role === 'assistant' && message.options?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleOptionClick(option)}
                        disabled={isSending}
                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
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
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ketik disini..."
                className="min-h-[3rem] flex-1 resize-none rounded-2xl border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
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
