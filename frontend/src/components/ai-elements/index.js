import React, { useState } from 'react';
import * as AIElements from '../AIElements';

// Export all base elements from AIElements
export * from '../AIElements';

// Provide MessageCopy component
export function MessageCopy({ text, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AIElements.MessageAction
      onClick={handleCopy}
      label={copied ? 'Copied!' : 'Copy'}
      tooltip="Copy response"
      className={className}
    >
      {copied ? '✅' : '📋'}
    </AIElements.MessageAction>
  );
}

// Provide Suggestions container & Suggestion alias
export function Suggestions({ children, className = '' }) {
  return (
    <div
      className={`ai-suggestions ${className}`}
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '10px 16px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg, #f8fafc)',
        scrollbarWidth: 'none'
      }}
    >
      {children}
    </div>
  );
}

export const Suggestion = AIElements.SuggestionPrompt;
