import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Spinner from './Spinner';

/**
 * AI Elements Message Component Suite
 * Follows official @/components/ai-elements/message API
 */

export function Message({ from = 'user', children, className = '' }) {
  const isUser = from === 'user';
  return (
    <div
      className={`ai-message ai-message-${from} ${className}`}
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        width: '100%',
        margin: '8px 0'
      }}
    >
      {!isUser && <MessageAvatar from="assistant" fallback="AI" />}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '84%',
          gap: '6px'
        }}
      >
        {children}
      </div>
      {isUser && <MessageAvatar from="user" fallback="U" />}
    </div>
  );
}

export function MessageAvatar({ from = 'assistant', fallback = 'AI', src }) {
  const isUser = from === 'user';
  return (
    <div
      style={{
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
      }}
    >
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : isUser ? '👤' : '💊'}
    </div>
  );
}

export function MessageContent({ from = 'user', children, className = '' }) {
  const isUser = from === 'user';
  return (
    <div
      className={`ai-message-content ${className}`}
      style={{
        padding: '14px 18px',
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: isUser ? 'var(--color-teal-700)' : 'var(--color-surface)',
        color: isUser ? '#FFFFFF' : 'var(--color-text)',
        boxShadow: isUser ? '0 2px 8px rgba(15, 95, 86, 0.2)' : '0 1px 5px rgba(0,0,0,0.06)',
        border: isUser ? 'none' : '1px solid var(--color-border)',
        fontSize: '14px',
        lineHeight: '1.6',
        whiteSpace: 'pre-line',
        wordBreak: 'break-word',
        width: '100%'
      }}
    >
      {children}
    </div>
  );
}

export function MessageResponse({ children, className = '' }) {
  if (!children) return null;
  if (typeof children !== 'string') {
    return <div className={`ai-message-response markdown-content ${className}`}>{children}</div>;
  }

  // Pre-process any custom markers like ++Heading++ into standard markdown ## Heading
  const processedText = children.replace(/\+\+([^+]+)\+\+/g, '### $1');

  return (
    <div className={`ai-message-response markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div style={{ overflowX: 'auto', margin: '12px 0', width: '100%' }}>
              <table className="ai-markdown-table" {...props} />
            </div>
          ),
          th: ({ node, children, ...props }) => <th {...props}>{children}</th>,
          td: ({ node, children, ...props }) => <td {...props}>{children}</td>,
          code: ({ node, inline, children, ...props }) =>
            inline ? (
              <code className="ai-inline-code" {...props}>{children}</code>
            ) : (
              <pre className="ai-code-block"><code {...props}>{children}</code></pre>
            ),
          h1: ({ node, children, ...props }) => <h3 style={{ margin: '14px 0 8px', color: 'var(--color-teal-900)' }} {...props}>{children}</h3>,
          h2: ({ node, children, ...props }) => <h4 style={{ margin: '12px 0 6px', color: 'var(--color-teal-900)' }} {...props}>{children}</h4>,
          h3: ({ node, children, ...props }) => <h5 style={{ margin: '10px 0 4px', color: 'var(--color-teal-900)' }} {...props}>{children}</h5>,
          ul: ({ node, children, ...props }) => <ul style={{ paddingLeft: '20px', margin: '8px 0' }} {...props}>{children}</ul>,
          ol: ({ node, children, ...props }) => <ol style={{ paddingLeft: '20px', margin: '8px 0' }} {...props}>{children}</ol>,
          li: ({ node, children, ...props }) => <li style={{ margin: '4px 0' }} {...props}>{children}</li>,
          p: ({ node, children, ...props }) => <p style={{ margin: '6px 0', lineHeight: 1.6 }} {...props}>{children}</p>
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
}

export function MessageToolbar({ children, className = '' }) {
  return (
    <div
      className={`ai-message-toolbar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: '4px',
        padding: '2px 4px'
      }}
    >
      {children}
    </div>
  );
}

export function MessageActions({ children, className = '' }) {
  return (
    <div
      className={`ai-message-actions ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {children}
    </div>
  );
}

export function MessageAction({ onClick, label, tooltip, children, className = '' }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip || label}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`ai-message-action ${className}`}
      style={{
        background: hover ? 'var(--color-teal-100)' : 'transparent',
        border: '1px solid transparent',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '12px',
        color: hover ? 'var(--color-teal-900)' : 'var(--color-text-muted)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.15s ease'
      }}
    >
      {children}
      {label && <span style={{ fontSize: '11px', fontWeight: 500 }}>{label}</span>}
    </button>
  );
}

export function MessageBranch({ defaultBranch = 0, children, onBranchChange }) {
  const [activeBranch, setActiveBranch] = useState(defaultBranch);
  return (
    <div className="ai-message-branch" style={{ width: '100%' }}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { activeBranch, setActiveBranch, onBranchChange })
          : child
      )}
    </div>
  );
}

export function MessageBranchContent({ activeBranch = 0, children }) {
  const childrenArray = React.Children.toArray(children);
  return <div className="ai-message-branch-content">{childrenArray[activeBranch] || childrenArray[0]}</div>;
}

export function MessageBranchSelector({ activeBranch = 0, setActiveBranch, totalBranches = 1 }) {
  if (totalBranches <= 1) return null;
  return (
    <div
      className="ai-message-branch-selector"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        color: 'var(--color-text-muted)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '999px',
        padding: '2px 8px'
      }}
    >
      <button
        type="button"
        disabled={activeBranch === 0}
        onClick={() => setActiveBranch(Math.max(0, activeBranch - 1))}
        style={{ background: 'none', border: 'none', cursor: activeBranch === 0 ? 'default' : 'pointer', opacity: activeBranch === 0 ? 0.4 : 1 }}
      >
        ◀
      </button>
      <span>{activeBranch + 1} of {totalBranches}</span>
      <button
        type="button"
        disabled={activeBranch >= totalBranches - 1}
        onClick={() => setActiveBranch(Math.min(totalBranches - 1, activeBranch + 1))}
        style={{ background: 'none', border: 'none', cursor: activeBranch >= totalBranches - 1 ? 'default' : 'pointer', opacity: activeBranch >= totalBranches - 1 ? 0.4 : 1 }}
      >
        ▶
      </button>
    </div>
  );
}

/**
 * Conversation Container Primitives
 */
export function Conversation({ children, className = '' }) {
  return (
    <div className={`ai-conversation ${className}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
      {children}
    </div>
  );
}

export function ConversationContent({ children, className = '', messagesEndRef }) {
  return (
    <div
      className={`ai-conversation-content ${className}`}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'var(--color-bg)'
      }}
    >
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
}

export function ConversationScrollButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'absolute',
        bottom: '80px',
        right: '24px',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px'
      }}
    >
      ↓
    </button>
  );
}

/**
 * Reasoning & Sources
 */
export function Reasoning({ duration, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        fontSize: '12px',
        color: 'var(--color-text-muted)',
        width: '100%',
        marginBottom: '6px'
      }}
    >
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

export function ThinkingIndicator({ text = 'AI reasoning & analyzing medical database…' }) {
  return (
    <div
      style={{
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
      }}
    >
      <Spinner size="sm" color="teal" />
      <span>{text}</span>
    </div>
  );
}

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

export function ToolCallResultCard({ stock, onReserve, isReserving }) {
  return (
    <div
      style={{
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
      }}
    >
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
