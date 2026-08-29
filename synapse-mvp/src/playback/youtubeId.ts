/** Accept raw 11-char IDs or common YouTube URL forms. */
export function extractYouTubeId(input: string): string {
  const raw = (input || '').trim();
  if (!raw) return '';
  if (/^[\w-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace(/^\//, '').slice(0, 11);
      if (/^[\w-]{11}$/.test(id)) return id;
    }
    const v = url.searchParams.get('v');
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const embed = url.pathname.match(/\/embed\/([\w-]{11})/);
    if (embed?.[1]) return embed[1];
    const shorts = url.pathname.match(/\/shorts\/([\w-]{11})/);
    if (shorts?.[1]) return shorts[1];
  } catch {
    // not a URL
  }

  const loose = raw.match(/([\w-]{11})/);
  return loose?.[1] ?? '';
}
