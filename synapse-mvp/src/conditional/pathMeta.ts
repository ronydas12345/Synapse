/** Branch names and Choice keybinds stored on Conditional nodes. */

export function pathLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function defaultPathName(index: number): string {
  return `Path ${pathLetter(index)}`;
}

export function defaultPathKey(index: number): string {
  if (index < 9) return String(index + 1);
  return '0';
}

export function storedPathNames(raw: unknown, numPaths: number): string[] {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: numPaths }, (_, i) =>
    typeof list[i] === 'string' ? list[i] : ''
  );
}

export function parsePathNames(raw: unknown, numPaths: number): string[] {
  const stored = storedPathNames(raw, numPaths);
  return stored.map((name, i) => (name.trim() ? name.trim() : defaultPathName(i)));
}

export function pathDisplayName(
  data: Record<string, unknown> | undefined,
  index: number
): string {
  const numPaths = Math.max(Number(data?.numPaths) || index + 1, index + 1);
  return parsePathNames(data?.pathNames, numPaths)[index] ?? defaultPathName(index);
}

export function normalizeStoredPathKey(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed === ' ' || trimmed.toLowerCase() === 'space') return 'Space';
  if (trimmed.length === 1) return trimmed.toLowerCase();
  return trimmed;
}

export function storedPathKeys(raw: unknown, numPaths: number): string[] {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: numPaths }, (_, i) => {
    if (typeof list[i] === 'string') return normalizeStoredPathKey(list[i]);
    return defaultPathKey(i);
  });
}

export function parsePathKeys(raw: unknown, numPaths: number): string[] {
  return storedPathKeys(raw, numPaths);
}

const BLOCKED_BIND_KEYS = new Set([
  'Escape',
  'Tab',
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'Dead',
  'Compose',
]);

export function isBindablePathKey(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (BLOCKED_BIND_KEYS.has(event.key)) return false;
  return event.key.length > 0;
}

export function pathKeyFromEvent(event: KeyboardEvent): string {
  if (event.key === ' ') return 'Space';
  if (event.key.length === 1) return event.key.toLowerCase();
  return event.key;
}

export function pathKeyMatches(stored: string, event: KeyboardEvent): boolean {
  if (!stored) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  const want = stored.toLowerCase();
  const got = event.key === ' ' ? 'space' : event.key.toLowerCase();
  return want === got;
}

export function formatPathKeyHint(stored: string): string {
  if (!stored) return '';
  if (stored.toLowerCase() === 'space' || stored === ' ') return 'Space';
  if (stored.length === 1) return stored.toUpperCase();
  return stored;
}

export function isChoiceConditional(
  data: Record<string, unknown> | undefined
): boolean {
  return data?.mode === 'choice';
}

export function connectedPathTargetId(
  nodeId: string,
  pathIndex: number,
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>
): string | null {
  const handle = pathLetter(pathIndex);
  const edge = edges.find(
    (item) =>
      item.source === nodeId &&
      (item.sourceHandle === handle || (!item.sourceHandle && pathIndex === 0))
  );
  return edge?.target || null;
}
