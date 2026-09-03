/** Node types that may be used as a playback walk origin. */
export const PLAYBACK_START_NODE_TYPES = [
  'start',
  'track',
  'conditional',
  'splitter',
  'randomizer',
  'transition',
  'end',
] as const;

export type PlaybackStartNodeType = (typeof PLAYBACK_START_NODE_TYPES)[number];

export function isPlaybackStartNodeType(
  type: string | undefined | null
): boolean {
  if (!type) return false;
  return (PLAYBACK_START_NODE_TYPES as readonly string[]).includes(type);
}
