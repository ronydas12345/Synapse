const KEY = 'synapse_command_recent';
const LIMIT = 6;

export function readRecentCommandIds(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string').slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function rememberCommandId(id: string): void {
  const next = [id, ...readRecentCommandIds().filter((item) => item !== id)].slice(
    0,
    LIMIT
  );
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}
