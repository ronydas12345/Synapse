/** Matches Postgres internal.new_share_id(): letters a–k, m, n, p–z and digits 2–9. */
export const SHARE_CODE_RE = /^[2-9a-kmnp-z]{10}$/;

export function isShareCode(value: string): boolean {
  return SHARE_CODE_RE.test(value.trim().toLowerCase());
}

export function isWorkshopShareKey(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v) ||
    isShareCode(v)
  );
}

export function profileSharePath(id: string): string {
  return `/u/${id.trim().toLowerCase()}`;
}

export function workshopSharePath(id: string): string {
  const value = id.trim().toLowerCase();
  if (isShareCode(value)) return `/p/${value}`;
  return `/workshop/${value}`;
}

export function absoluteShareUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

export async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}
