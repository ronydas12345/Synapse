/** Empty draft (after trim) restores the original; otherwise keep the draft. */
export function commitOrRevert(draft: string, original: string): string {
  return draft.trim() === '' ? original : draft;
}

export function commitNumberOrRevert(
  draft: string,
  original: number,
  min?: number,
  max?: number
): number {
  if (draft.trim() === '') return original;
  const parsed = Number(draft);
  if (!Number.isFinite(parsed)) return original;
  let next = parsed;
  if (min != null) next = Math.max(min, next);
  if (max != null) next = Math.min(max, next);
  return next;
}
