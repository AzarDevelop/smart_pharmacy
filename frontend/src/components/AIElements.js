import React, { useState } from 'react';
import Spinner from './Spinner';

/**
 * Conversation - Wrapper container for AI chat stream
 */
export function Conversation({ children, className = '' }) {
  return (
    <div className={`ai-conversation ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      position: 'relative'
    }}>
      {children}
    </div>
  );
}

/**
 * ConversationContent - Scrollable message history list
 */
export function ConversationContent({ children, className = '', messagesEndRef }) {
  return (
    <div className={`ai-conversation-content ${className}`} style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      background: 'var(--color-bg)'
    }}>
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
}

/**
 * Message - Standard message item with role alignment
 */
export function Message({ from = 'user', children, className = '' }) {
  const isUser = from === 'user';
  return (
    <div className={`ai-message ai-message-${from} ${className}`} style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      width: '100%'
    }}>
      {!isUser && (
        <MessageAvatar from="assistant" fallback="AI" />
      )}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        gap: '6px'
      }}>
        {children}
      </div>
      {isUser && (
        <MessageAvatar from="user" fallback="U" />
      )}
    </div>
  );
}

/**
 * MessageAvatar - Avatar for user or AI assistant
 */
export function MessageAvatar({ from = 'assistant', fallback = 'AI', src }) {
  const isUser = from === 'user';
  return (
    <div style={{
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      background: isUser ? 'var(--color-teal-900)' : 'var(--color-teal-700)',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: 700,
      flexShrink: 0,
      boxShadow: '0 2px 6px rgba(11, 59, 54, 0.15)'
    }}>
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : isUser ? '👤' : '💊'}
    </div>
  );
}

/**
 * MessageContent - Styled bubble container
 */
export function MessageContent({ from = 'user', children, className = '' }) {
  const isUser = from === 'user';
  return (
    <div className={`ai-message-content ${className}`} style={{
      padding: '12px 18px',
      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
      background: isUser ? 'var(--color-teal-700)' : 'var(--color-surface)',
      color: isUser ? '#FFFFFF' : 'var(--color-text)',
      boxShadow: isUser ? '0 2px 8px rgba(15, 95, 86, 0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
      border: isUser ? 'none' : '1px solid var(--color-border)',
      fontSize: '14px',
      lineHeight: '1.6',
      whiteSpace: 'pre-line',
      wordBreak: 'break-word'
    }}>
      {children}
    </div>
  );
}

/**
 * Reasoning - Collapsible reasoning block
 */
export function Reasoning({ duration, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 12px',
      fontSize: '12px',
      color: 'var(--color-text-muted)',
      width: '100%',
      marginBottom: '6px'
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: 600 }}
      >
        <span>🧠 Medical Reasoning {duration ? `(${duration}s)` : ''}</span>
        <span>{isOpen ? '▲ Hide' : '▼ View'}</span>
      </div>
      {isOpen && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--color-border)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Sources - Clinical reference pills
 */
export function Sources({ sources = [] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
      {sources.map((s, idx) => (
        <a
          key={idx}
          href={s.href || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '11px',
            background: 'var(--color-teal-100)',
            color: 'var(--color-teal-900)',
            padding: '3px 8px',
            borderRadius: '999px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          📖 {s.title}
        </a>
      ))}
    </div>
  );
}

/**
 * ThinkingIndicator - Pulse state for when AI is reasoning or streaming
 */
export function ThinkingIndicator({ text = 'AI reasoning & analyzing medical database…' }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 14px',
      background: 'var(--color-surface)',
      borderRadius: '999px',
      border: '1px solid var(--color-border)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      fontSize: '13px',
      color: 'var(--color-text-muted)'
    }}>
      <Spinner size="sm" color="teal" />
      <span>{text}</span>
    </div>
  );
}

/**
 * SuggestionPrompt - Quick action chip
 */
export function SuggestionPrompt({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--color-teal-100)',
        color: 'var(--color-teal-900)',
        border: '1px solid transparent',
        borderRadius: '999px',
        padding: '6px 14px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#d3ece6';
        e.currentTarget.style.borderColor = 'var(--color-teal-500)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'var(--color-teal-100)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

/**
 * ToolCallResultCard - Render structured tool results (In-Chat Pharmacy Stock)
 */
export function ToolCallResultCard({ stock, onReserve, isReserving }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 18px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      marginTop: '8px'
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-teal-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{stock.medicine_name}</span>
          {stock.requires_prescription && (
            <span className="badge badge-amber" style={{ fontSize: '10px', padding: '2px 8px' }}>Rx Required</span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
          🏥 {stock.pharmacy_name} — {stock.address}, {stock.city}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-teal-700)', fontWeight: 600, marginTop: '3px' }}>
          ₹{stock.price} · {stock.quantity} in stock {stock.distance_km != null && `· 📍 ${stock.distance_km} km away`}
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ padding: '8px 16px', fontSize: '12px' }}
        onClick={() => onReserve(stock)}
        disabled={isReserving || stock.quantity === 0}
      >
        {isReserving ? (
          <Spinner size="sm" label="Holding…" />
        ) : stock.quantity === 0 ? (
          'Out of stock'
        ) : (
          '⚡ Reserve 1 Unit'
        )}
      </button>
    </div>
  );
}

