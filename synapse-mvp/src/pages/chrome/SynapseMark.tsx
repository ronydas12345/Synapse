export default function SynapseMark({
  size = 28,
  title,
}: {
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="9" fill="var(--bg-elevated)" />
      <path
        d="M9 16h6.5M15.5 16l5-6.5M15.5 16l5 6.5"
        stroke="var(--text-faint)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="8" cy="16" r="3.1" fill="var(--node-start)" />
      <circle cx="22.5" cy="8.8" r="3.1" fill="var(--node-conditional)" />
      <circle cx="22.5" cy="23.2" r="3.1" fill="var(--accent-warm)" />
    </svg>
  );
}
