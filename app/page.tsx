'use client';
import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, previousResponseId: responseId }),
      });
      const data = await res.json();
      setResponseId(data.responseId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error — please try again.' }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 780, margin: '0 auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '20px 0 10px', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>⚡ FSR AI Assistant</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>Ask about pricing, contacts, opportunities, or anything GHL</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {messages.length === 0 && (
          <p style={{ color: '#aaa', fontSize: 14 }}>Start by asking something like: <em>"What's the price on OC Duration Driftwood?"</em> or <em>"Look up contact John Smith"</em></p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              background: m.role === 'user' ? '#0070f3' : '#f4f4f4',
              color: m.role === 'user' ? '#fff' : '#111',
              padding: '10px 14px',
              borderRadius: 12,
              maxWidth: '80%',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: '#aaa', fontSize: 13, padding: '8px 0' }}>🔍 Checking GHL + pricing data...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: 8, padding: '12px 0 20px', borderTop: '1px solid #eee' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about pricing, contacts, jobs..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, outline: 'none' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14 }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
