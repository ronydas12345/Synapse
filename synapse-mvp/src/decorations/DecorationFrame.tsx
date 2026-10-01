import { useId, type ReactNode } from 'react';
import {
  decorationClass,
  decorationDef,
  type DecorationOrnament,
} from './catalog';

function Ornament({ kind }: { kind: DecorationOrnament }) {
  const uid = useId().replace(/:/g, '');
  if (kind === 'none') return null;
  return (
    <span className="synapse-deco-ornament" data-kind={kind} aria-hidden="true">
      {kind === 'crown' ? (
        <svg viewBox="0 0 64 36" className="synapse-deco-svg synapse-deco-svg-crown">
          <path
            d="M6 28 L10 8 L22 20 L32 4 L42 20 L54 8 L58 28 Z"
            fill={`url(#${uid}-crown)`}
            stroke="#f5d76e"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="6" y="26" width="52" height="6" rx="2" fill="#f5d76e" />
          <circle cx="10" cy="8" r="3.2" fill="#f8f1c8" />
          <circle cx="32" cy="4" r="3.6" fill="#ffd54a" />
          <circle cx="54" cy="8" r="3.2" fill="#f8f1c8" />
          <circle cx="22" cy="20" r="2.2" fill="#7dd3fc" />
          <circle cx="42" cy="20" r="2.2" fill="#f472b6" />
          <defs>
            <linearGradient id={`${uid}-crown`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe27a" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
        </svg>
      ) : null}
      {kind === 'star' ? (
        <svg viewBox="0 0 64 36" className="synapse-deco-svg">
          <path
            d="M32 2 L38 14 L52 16 L42 26 L44 40 L32 33 L20 40 L22 26 L12 16 L26 14 Z"
            transform="translate(0 -4)"
            fill={`url(#${uid}-star)`}
            stroke="#93c5fd"
            strokeWidth="1.6"
          />
          <defs>
            <linearGradient id={`${uid}-star`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
      ) : null}
      {kind === 'laurel' ? (
        <svg viewBox="0 0 72 72" className="synapse-deco-svg synapse-deco-svg-wreath">
          <path
            d="M14 50 C8 36 16 16 32 12"
            fill="none"
            stroke="#86efac"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M58 50 C64 36 56 16 40 12"
            fill="none"
            stroke="#86efac"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M16 42 Q22 38 20 32" fill="#4ade80" />
          <path d="M18 32 Q26 30 22 24" fill="#22c55e" />
          <path d="M56 42 Q50 38 52 32" fill="#4ade80" />
          <path d="M54 32 Q46 30 50 24" fill="#22c55e" />
        </svg>
      ) : null}
      {kind === 'ring' ? (
        <svg viewBox="0 0 72 20" className="synapse-deco-svg synapse-deco-svg-ring">
          <circle cx="12" cy="10" r="3" fill="currentColor" />
          <circle cx="36" cy="6" r="2.4" fill="currentColor" />
          <circle cx="60" cy="10" r="3" fill="currentColor" />
        </svg>
      ) : null}
    </span>
  );
}

export default function DecorationFrame({
  id,
  children,
  className = '',
}: {
  id: string | null | undefined;
  children?: ReactNode;
  className?: string;
}) {
  const def = decorationDef(id);
  return (
    <span className={`${decorationClass(id)} ${className}`.trim()}>
      <Ornament kind={def.ornament} />
      <span className="synapse-deco-face">{children}</span>
    </span>
  );
}
