export function asDate(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const next = new Date(value);
    if (Number.isFinite(next.getTime())) return next;
  }
  return null;
}

export function formatWhen(value: Date | null): string {
  if (!value) return '—';
  return value.toLocaleString();
}
