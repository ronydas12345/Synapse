const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHex(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const raw = value.trim();
  if (!HEX.test(raw)) return fallback;
  if (raw.length === 4) {
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return raw.toLowerCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex, '#000000').slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function cssToRgb(
  value: string,
  fallback = '#000000'
): { r: number; g: number; b: number } {
  const v = value.trim();
  if (HEX.test(v)) return hexToRgb(v);
  const rgb = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  }
  return hexToRgb(fallback);
}

export function lerpRgb(
  from: { r: number; g: number; b: number },
  to: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  const u = Math.min(1, Math.max(0, t));
  return {
    r: Math.round(from.r + (to.r - from.r) * u),
    g: Math.round(from.g + (to.g - from.g) * u),
    b: Math.round(from.b + (to.b - from.b) * u),
  };
}

export function rgba(
  rgb: { r: number; g: number; b: number },
  alpha: number
): string {
  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}
