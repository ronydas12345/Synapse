import { getTrackDisplayMeta } from '../trackMetadata';

export function nodeCustomName(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const name = (data as { name?: unknown }).name;
  return typeof name === 'string' ? name.trim() : '';
}

export function nodeTypeLabel(
  type: string | undefined,
  data?: unknown
): string {
  if (type === 'randomizer') {
    const mode =
      data && typeof data === 'object'
        ? (data as { mode?: unknown }).mode
        : undefined;
    return mode === 'randomizer' ? 'Randomizer' : 'Sequence';
  }
  if (type === 'conditional' || type === 'splitter') return 'Conditional';
  if (type === 'track') return 'Track';
  if (type === 'transition') return 'Transition';
  if (type === 'style') return 'Style';
  if (type === 'comment') return 'Comment';
  if (type === 'start') return 'Start';
  if (type === 'end') return 'End';
  return type ? type[0].toUpperCase() + type.slice(1) : 'Node';
}

/** Canvas / listen title: custom name, else song title for tracks, else type. */
export function nodeDisplayName(
  type: string | undefined,
  data?: unknown
): string {
  const custom = nodeCustomName(data);
  if (custom) return custom;
  if (type === 'track') return getTrackDisplayMeta(data as never).title;
  return nodeTypeLabel(type, data);
}
