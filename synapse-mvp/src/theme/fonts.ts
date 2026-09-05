export const FONT_OPTIONS = {
  ui: [
    { value: 'Outfit', label: 'Outfit' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Segoe UI', label: 'Segoe UI' },
    { value: 'system-ui', label: 'System UI' },
    { value: 'Space Grotesk', label: 'Space Grotesk' },
  ],
  display: [
    { value: 'Syne', label: 'Syne' },
    { value: 'Fraunces', label: 'Fraunces' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Outfit', label: 'Outfit' },
  ],
  mono: [
    { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono' },
    { value: 'ui-monospace', label: 'System Mono' },
  ],
  node: [
    { value: 'Outfit', label: 'Outfit' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Segoe UI', label: 'Segoe UI' },
  ],
} as const;

const ALLOWED = new Set<string>(
  Object.values(FONT_OPTIONS).flatMap((list) => list.map((f) => f.value))
);

export function sanitizeFont(value: unknown, fallback: string): string {
  if (typeof value === 'string' && ALLOWED.has(value)) return value;
  return fallback;
}

export function fontStack(name: string, kind: 'ui' | 'display' | 'mono'): string {
  if (kind === 'mono') return `"${name}", ui-monospace, monospace`;
  if (kind === 'display') return `"${name}", Outfit, sans-serif`;
  return `"${name}", "Segoe UI", sans-serif`;
}
