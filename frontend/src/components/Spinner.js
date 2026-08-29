import React from 'react';

export default function Spinner({ size = 'md', color = 'default', label = '' }) {
  const sizeClass = size === 'lg' ? 'spinner-lg' : size === 'sm' ? 'spinner-sm' : '';
  const colorClass = color === 'teal' ? 'spinner-teal' : '';

  const spinnerElement = <div className={`spinner ${sizeClass} ${colorClass}`} aria-hidden="true" />;

  if (!label) return spinnerElement;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      {spinnerElement}
      <span>{label}</span>
    </div>
  );
}

export function LoadingState({ text = 'Loading data…', size = 'lg' }) {
  return (
    <div className="loading-container">
      <Spinner size={size} color="teal" />
      <span>{text}</span>
    </div>
  );
}
