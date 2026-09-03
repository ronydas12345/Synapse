/** Shared mode values written by inspector and on-node dropdowns. */

export const CONDITIONAL_MODE_OPTIONS = [
  { value: 'random', label: 'Weighted Random' },
  { value: 'timeRange', label: 'Time Range' },
] as const;

export const RANDOMIZER_MODE_OPTIONS = [
  { value: 'sequence', label: 'Sequence' },
  { value: 'randomizer', label: 'Weighted Random' },
] as const;

export type ConditionalMode = (typeof CONDITIONAL_MODE_OPTIONS)[number]['value'];
export type RandomizerMode = (typeof RANDOMIZER_MODE_OPTIONS)[number]['value'];

/**
 * Patch for Conditional `data.mode`. Merges via updateNodeData — weights and
 * existing time ranges are preserved. Only initializes pathTimeRanges when
 * switching to timeRange and none exist yet.
 */
export function conditionalModePatch(
  data: Record<string, unknown> | undefined,
  newMode: string
): Record<string, unknown> {
  if (newMode === 'timeRange' && !data?.pathTimeRanges) {
    const numPaths = Number(data?.numPaths) || 2;
    return {
      mode: newMode,
      pathTimeRanges: Array.from({ length: numPaths }, () => [
        { start: 0, end: 23 },
      ]),
    };
  }
  return { mode: newMode };
}

/**
 * Patch for Sequence/Randomizer `data.mode`. Weights stay on the node; the
 * engine and UI hide them in sequence mode and restore them in randomizer mode.
 */
export function randomizerModePatch(
  _data: Record<string, unknown> | undefined,
  newMode: string
): Record<string, unknown> {
  return { mode: newMode };
}
