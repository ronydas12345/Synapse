export function normalizeCommandQuery(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function commandHaystack(
  label: string,
  group: string,
  keywords = ''
): string {
  return `${label} ${group} ${keywords}`.toLowerCase();
}

export function matchesCommandQuery(
  haystack: string,
  tokens: string[]
): boolean {
  if (!tokens.length) return true;
  return tokens.every((token) => haystack.includes(token));
}
