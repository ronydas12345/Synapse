const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PORTAL_ID_RE = /^P-[A-Z0-9]{8}$/;

export function normalizePortalId(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().toUpperCase().replace(/\s+/g, '');
  if (!trimmed) return '';
  const withPrefix = trimmed.startsWith('P-') ? trimmed : `P-${trimmed}`;
  return withPrefix;
}

export function isPortalId(value: unknown): boolean {
  return PORTAL_ID_RE.test(normalizePortalId(value));
}

export function generatePortalId(used?: Iterable<string>): string {
  const taken = new Set(
    [...(used ?? [])].map((id) => normalizePortalId(id)).filter(Boolean)
  );
  for (let attempt = 0; attempt < 32; attempt++) {
    const id = randomPortalId();
    if (!taken.has(id)) return id;
  }
  return `P-${Date.now().toString(36).toUpperCase().slice(-8).padStart(8, '2')}`;
}

function randomPortalId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let body = '';
  for (const byte of bytes) body += ALPHABET[byte % ALPHABET.length];
  return `P-${body}`;
}

export function collectPortalIds(nodes: { data?: unknown }[]): Set<string> {
  const ids = new Set<string>();
  for (const node of nodes) {
    const data = node.data as { portalId?: unknown } | undefined;
    const id = normalizePortalId(data?.portalId);
    if (isPortalId(id)) ids.add(id);
  }
  return ids;
}
