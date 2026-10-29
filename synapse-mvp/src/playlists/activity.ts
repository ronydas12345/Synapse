export const PATH_ACTIVITY_KEY = 'synapse_path_activity';
const MAX_ITEMS = 8;

export interface PathActivity {
  played: { id: string; at: string }[];
}

function empty(): PathActivity {
  return { played: [] };
}

export function parsePathActivity(raw: unknown): PathActivity {
  if (!raw || typeof raw !== 'object') return empty();
  const played = Array.isArray((raw as PathActivity).played)
    ? (raw as PathActivity).played.filter(
        (row) =>
          row &&
          typeof row.id === 'string' &&
          typeof row.at === 'string' &&
          Number.isFinite(Date.parse(row.at))
      )
    : [];
  return { played: played.slice(0, MAX_ITEMS) };
}

export function readPathActivity(): PathActivity {
  try {
    const raw = localStorage.getItem(PATH_ACTIVITY_KEY);
    return raw ? parsePathActivity(JSON.parse(raw)) : empty();
  } catch {
    return empty();
  }
}

export function recordPlayedPath(pathId: string): PathActivity {
  const id = pathId.trim();
  if (!id) return readPathActivity();
  const next: PathActivity = {
    played: [
      { id, at: new Date().toISOString() },
      ...readPathActivity().played.filter((row) => row.id !== id),
    ].slice(0, MAX_ITEMS),
  };
  try {
    localStorage.setItem(PATH_ACTIVITY_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
  return next;
}

export function recentPlayedIds(existingIds: Set<string>): string[] {
  return readPathActivity()
    .played.filter((row) => existingIds.has(row.id))
    .map((row) => row.id);
}
