import { useId } from 'react';

const SWOOP =
  'M 30 190 C 70 240, 130 320, 210 240 C 270 160, 370 180, 470 310 C 400 60, 280 10, 180 130 C 120 200, 70 185, 30 190 Z';

export default function SynapseMark({
  size = 28,
  title,
  className,
}: {
  size?: number;
  title?: string;
  className?: string;
}) {
  const rawId = useId().replace(/:/g, '');
  const gid = `synapse-logo-grad-${rawId}`;
  const height = size;
  const width = Math.round(size * (460 / 370));

  return (
    <svg
      className={['synapse-logo', className].filter(Boolean).join(' ')}
      width={width}
      height={height}
      viewBox="20 0 460 370"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8A2BE2" />
          <stop offset="100%" stopColor="#00008B" />
        </linearGradient>
      </defs>
      <path className="synapse-logo-shape" d={SWOOP} fill={`url(#${gid})`} />
      <circle className="synapse-logo-shape" cx="280" cy="310" r="45" fill={`url(#${gid})`} />
    </svg>
  );
}

export function SynapseWordmark({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={['synapse-wordmark', compact ? 'is-compact' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="synapse-wordmark-text" aria-hidden="true">
        <span>s</span>
        <span>y</span>
        <span>n</span>
        <SynapseMark className="synapse-wordmark-a" size={22} />
        <span>p</span>
        <span>s</span>
        <span>e</span>
      </span>
      <span className="synapse-sr-only">synapse</span>
    </span>
  );
}
