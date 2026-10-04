/** Matches Postgres internal.new_share_id(): a–k, m–z (no L) and digits 2–9. Includes O. */
export const SHARE_CODE_RE = /^[2-9a-kmn-z]{10}$/;

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

/** Public playlist URL segment: UUID or a share id, including alphabet drift. */
export function isWorkshopItemSegment(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v) ||
    /^[a-z0-9]{8,16}$/.test(v)
  );
}

export function profileSharePath(id: string): string {
  return `/u/${id.trim().toLowerCase()}`;
}

export function workshopSharePath(id: string): string {
  const value = id.trim().toLowerCase();
  return `/playlist/${value}`;
}

export function absoluteShareUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

export async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}
