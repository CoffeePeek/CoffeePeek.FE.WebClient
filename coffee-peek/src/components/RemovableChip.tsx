import React from 'react';

const CloseIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    style={{ display: 'block', flexShrink: 0 }}
  >
    <path d="M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/** Removable gold pill used in filters and create-shop multi-selects. */
export const RemovableChip: React.FC<{
  label: React.ReactNode;
  gold?: string;
  onRemove: () => void;
}> = ({ label, gold = '#EAB308', onRemove }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '5px 8px 5px 12px',
      borderRadius: 99,
      whiteSpace: 'nowrap',
      background: `${gold}15`,
      color: gold,
      border: `1px solid ${gold}40`,
      fontFamily: '"RF Dewi Expanded"',
      fontWeight: 600,
      fontSize: 12,
    }}
  >
    {label}
    <button
      type="button"
      onClick={onRemove}
      aria-label="Удалить"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: 2,
      }}
    >
      <CloseIcon color={gold} size={13} />
    </button>
  </span>
);

export default RemovableChip;
