/** Clamp a relative seek against optional track start/end bounds. */

export function clampSeek(
  current: number,
  delta: number,
  duration: number,
  start = 0,
  end = 0
): number {
  const lo = Math.max(0, Number.isFinite(start) ? start : 0);
  const hiRaw = end > lo ? end : duration;
  const hi = hiRaw > lo ? hiRaw : lo;
  const from = Number.isFinite(current) ? current : lo;
  return Math.min(hi, Math.max(lo, from + delta));
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
