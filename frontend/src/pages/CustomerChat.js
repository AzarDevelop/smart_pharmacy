import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
  Conversation,
  ConversationContent,
  Message,
  MessageContent,
  ThinkingIndicator,
  SuggestionPrompt,
  ToolCallResultCard
} from '../components/AIElements';

export default function CustomerChat() {
  const { user } = useAuth();
  const [coords, setCoords] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your AI Licensed Pharmacy Consultant 💊.\nTell me your symptoms, ask about medicine dosage, or request approved generic alternatives.\nI will stream advice in real-time and show live nearby pharmacy stock for 1-click reservations.",
      stocks: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [reservingId, setReservingId] = useState(null);
  const [reserveSuccess, setReserveSuccess] = useState('');
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null)
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    // Add user message & empty AI message ready for streaming
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: userText, stocks: [] },
      { id: aiMsgId, sender: 'assistant', text: '', isThinking: true, stocks: [] }
    ]);
    setInput('');
    setIsStreaming(true);
    setReserveSuccess('');

    abortControllerRef.current = new AbortController();

    try {
      // 1. Initiate real-time SSE stream from VoltAgent PharmacyConsultantAgent
      const streamResponse = await fetch('http://localhost:8000/agents/PharmacyConsultantAgent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userText,
          options: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        }),
        signal: abortControllerRef.current.signal
      });

      if (!streamResponse.ok) {
        throw new Error('Streaming failed: ' + streamResponse.statusText);
      }

      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullAiText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              if (eventData.type === 'text-delta' && eventData.text) {
                const deltaText = eventData.text;
                fullAiText += deltaText;
                const currentText = fullAiText;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId ? { ...msg, text: currentText, isThinking: false } : msg
                  )
                );
              }
            } catch (pErr) {
              // Ignore non-JSON line parts
            }
          }
        }
      }

      // 2. Fetch live matching pharmacy stock for the recommended medicines
      try {
        const payload = { question: userText };
        if (coords) {
          payload.lat = coords.lat;
          payload.lng = coords.lng;
        }
        const { data } = await api.post('/medicines/consult', payload);
        if (data.availableStocks && data.availableStocks.length > 0) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, stocks: data.availableStocks } : msg
            )
          );
        }
      } catch (stockErr) {
        console.warn('Could not fetch in-chat stock cards:', stockErr);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream stopped by user.');
      } else {
        console.error('Stream error:', err);
        // Fallback to standard backend API if direct stream fails
        try {
          const payload = { question: userText };
          if (coords) { payload.lat = coords.lat; payload.lng = coords.lng; }
          const { data } = await api.post('/medicines/consult', payload);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? { ...msg, text: data.answer || 'Consultation response received.', isThinking: false, stocks: data.availableStocks || [] }
                : msg
            )
          );
        } catch (fallbackErr) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? { ...msg, text: 'I am temporarily unable to connect to the medical AI service. Please try again.', isThinking: false }
                : msg
            )
          );
        }
      }
    } finally {
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMsgId ? { ...msg, isThinking: false } : msg))
      );
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleReserve = async (row) => {
    if (!user) {
      alert('Please log in as a Customer to reserve medicines.');
      return;
    }
    setReservingId(row.stock_id);
    try {
      await api.post('/reservations', {
        pharmacy_id: row.pharmacy_id,
        medicine_id: row.medicine_id,
        quantity: 1
      });
      setReserveSuccess(`✅ Successfully reserved 1 unit of ${row.medicine_name} at ${row.pharmacy_name}!`);
      // Decrement stock locally in message list
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          stocks: msg.stocks.map((s) =>
            s.stock_id === row.stock_id ? { ...s, quantity: Math.max(0, s.quantity - 1) } : s
          )
        }))
      );
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not reserve medicine.');
    } finally {
      setReservingId(null);
    }
  };

  const QUICK_QUESTIONS = [
    "I have a fever and mild headache, what can I take?",
    "Do you have Azithromycin or generic antibiotics in stock?",
    "What are safe OTC pain relief medicines for muscle aches?"
  ];

  return (
    <div className="page container" style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 26, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              ✨ AI Elements Pharmacy Assistant & Live Reservation
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
              AI-native conversational interface powered by AI Elements, real-time SSE streaming, and 1-click reservations.
            </p>
          </div>
          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-teal-700)' }}></span>
            AI Elements Active
          </span>
        </div>
      </div>

      {reserveSuccess && (
        <div style={{
          background: '#E3F2EF', border: '1px solid var(--color-teal-500)', color: 'var(--color-teal-900)',
          padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, fontWeight: 600, fontSize: 14
        }}>
          {reserveSuccess}
        </div>
      )}

      {/* AI Elements Conversation Container */}
      <div className="card" style={{
        padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '640px',
        boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)'
      }}>
        <Conversation>
          <ConversationContent messagesEndRef={messagesEndRef}>
            {messages.map((msg) => (
              <Message key={msg.id} from={msg.sender}>
                <MessageContent from={msg.sender}>
                  {msg.isThinking && !msg.text ? (
                    <ThinkingIndicator text="Consultant agent reasoning & analyzing pharmacy catalogue…" />
                  ) : (
                    msg.text
                  )}
                </MessageContent>

                {/* AI Elements In-Chat Tool Stock Result Cards */}
                {msg.stocks && msg.stocks.length > 0 && (
                  <div style={{ width: '100%', marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-teal-900)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
                      📍 Verified In-Stock Pharmacies Nearby:
                    </div>
                    {msg.stocks.map((stock) => (
                      <ToolCallResultCard
                        key={stock.stock_id}
                        stock={stock}
                        onReserve={handleReserve}
                        isReserving={reservingId === stock.stock_id}
                      />
                    ))}
                  </div>
                )}
              </Message>
            ))}
          </ConversationContent>

          {/* AI Elements Quick Suggestion Prompts */}
          <div style={{
            padding: '10px 18px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
            display: 'flex', gap: 8, overflowX: 'auto', whiteSpace: 'nowrap'
          }}>
            {QUICK_QUESTIONS.map((q, idx) => (
              <SuggestionPrompt key={idx} onClick={() => setInput(q)}>
                💬 {q}
              </SuggestionPrompt>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} style={{
            padding: '14px 18px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
            display: 'flex', gap: 10, alignItems: 'center'
          }}>
            <input
              className="input"
              style={{ flex: 1, margin: 0 }}
              placeholder="Ask AI about medicines, dosage, symptoms, or availability… (Press Enter to send)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              disabled={isStreaming}
              autoFocus
            />
            {isStreaming ? (
              <button className="btn btn-danger" type="button" onClick={handleStop} style={{ minWidth: 90 }}>
                ⏹ Stop
              </button>
            ) : (
              <button className="btn btn-primary" type="submit" disabled={!input.trim()} style={{ minWidth: 100 }}>
                Send 🚀
              </button>
            )}
          </form>
        </Conversation>
      </div>
    </div>
  );
}



