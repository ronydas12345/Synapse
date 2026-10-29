import { parseQueueKey } from '../engine/types';
import { usePathStore } from '../store';

export function useNodePlaybackClass(id: string): string {
  return usePathStore((state) => {
    if (state.currentPlayingNodeId === id) return 'is-playing';
    const nextKey = state.playbackQueue[state.currentTrackIndex + 1];
    if (!nextKey) return '';
    return parseQueueKey(nextKey)?.nodeId === id ? 'is-next' : '';
  });
}
