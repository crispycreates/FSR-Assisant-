'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

const NEON_CYAN = '#00f0ff';
const NEON_MAGENTA = '#ff00e0';
const PANEL_BG = 'rgba(12, 8, 24, 0.62)';
const PANEL_BORDER = 'rgba(0, 240, 255, 0.28)';

const STORAGE_KEY = 'fsr_chat_v1';

type StoredChat = { messages: Message[]; responseId: string | null };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage on mount (client-only to keep SSR happy).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredChat;
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        if (typeof parsed.responseId === 'string') setResponseId(parsed.responseId);
      }
    } catch {
      // corrupt storage — ignore and start fresh
    }
    setHydrated(true);
  }, []);

  // Persist on every change, but only after hydration so we don't wipe storage
  // with the initial empty state on first render.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, responseId } satisfies StoredChat),
      );
    } catch {
      // quota exceeded or storage disabled — silently drop
    }
  }, [messages, responseId, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, previousResponseId: responseId }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || detail.error || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { text: string; responseId: string };
      setResponseId(data.responseId ?? null);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${detail}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    setResponseId(null);
  }

  const noHistory = messages.length === 0 && !responseId;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: 820,
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      <header
        style={{
          background: PANEL_BG,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 14,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.12)',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              letterSpacing: 0.5,
              color: NEON_CYAN,
              textShadow: `0 0 10px ${NEON_CYAN}`,
            }}
          >
            ⚡ FSR AI Assistant
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'rgba(232, 230, 245, 0.65)' }}>
            Ask about pricing, contacts, opportunities, or anything GHL.
          </p>
        </div>
        <button
          type="button"
          onClick={clearConversation}
          disabled={noHistory}
          style={{
            padding: '8px 12px',
            fontSize: 12,
            background: 'transparent',
            color: NEON_MAGENTA,
            border: `1px solid ${NEON_MAGENTA}`,
            borderRadius: 8,
            cursor: noHistory ? 'not-allowed' : 'pointer',
            opacity: noHistory ? 0.4 : 1,
            textShadow: `0 0 8px ${NEON_MAGENTA}`,
            boxShadow: `0 0 12px rgba(255, 0, 224, 0.25)`,
            transition: 'opacity 0.15s ease',
          }}
          aria-label="Clear conversation"
        >
          Clear
        </button>
      </header>

      <section
        style={{
          flex: 1,
          marginTop: 16,
          background: PANEL_BG,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 14,
          padding: 18,
          overflowY: 'auto',
          boxShadow:
            '0 0 30px rgba(0, 240, 255, 0.1), inset 0 0 30px rgba(177, 74, 237, 0.06)',
        }}
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p style={{ color: 'rgba(232, 230, 245, 0.55)', fontSize: 14, lineHeight: 1.6 }}>
            Try:{' '}
            <em style={{ color: NEON_CYAN }}>
              &ldquo;What&apos;s the price on OC Duration Driftwood?&rdquo;
            </em>{' '}
            or{' '}
            <em style={{ color: NEON_MAGENTA }}>
              &ldquo;Look up contact John Smith&rdquo;
            </em>
          </p>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          const accent = isUser ? NEON_CYAN : NEON_MAGENTA;
          return (
            <div
              key={i}
              style={{
                marginBottom: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  background: isUser ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 0, 224, 0.08)',
                  color: '#f4f1ff',
                  padding: '10px 14px',
                  borderRadius: 12,
                  maxWidth: '82%',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  border: `1px solid ${accent}55`,
                  boxShadow: `0 0 14px ${accent}33`,
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div
            style={{
              color: NEON_CYAN,
              fontSize: 13,
              padding: '6px 0',
              textShadow: `0 0 6px ${NEON_CYAN}`,
            }}
          >
            <span aria-hidden>◌</span> Checking GHL + pricing data&hellip;
          </div>
        )}
        <div ref={bottomRef} />
      </section>

      <form
        onSubmit={send}
        style={{
          marginTop: 16,
          display: 'flex',
          gap: 10,
          background: PANEL_BG,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 14,
          padding: 12,
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about pricing, contacts, jobs..."
          aria-label="Message"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(0, 240, 255, 0.25)',
            background: 'rgba(8, 4, 16, 0.6)',
            color: '#f4f1ff',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px',
            background:
              loading || !input.trim()
                ? 'rgba(0, 240, 255, 0.15)'
                : 'linear-gradient(135deg, #00f0ff 0%, #b14aed 100%)',
            color: loading || !input.trim() ? 'rgba(232, 230, 245, 0.5)' : '#080410',
            border: 'none',
            borderRadius: 10,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 0.3,
            boxShadow:
              loading || !input.trim() ? 'none' : '0 0 18px rgba(0, 240, 255, 0.45)',
            transition: 'box-shadow 0.15s ease',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
