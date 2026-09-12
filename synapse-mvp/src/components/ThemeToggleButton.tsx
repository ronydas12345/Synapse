import { useCallback, useSyncExternalStore } from 'react';
import { usePathStore } from '../store';
import {
  applyPathTheme,
  endPlaybackStyleSession,
  isShowingPathTheme,
  subscribePlaybackThemeUi,
} from '../theme/playbackStyle';

export default function ThemeToggleButton() {
  const showingPath = useSyncExternalStore(
    subscribePlaybackThemeUi,
    isShowingPathTheme,
    isShowingPathTheme
  );

  const onClick = useCallback(() => {
    if (showingPath) {
      endPlaybackStyleSession();
      return;
    }
    const { nodes, edges, currentPlayingNodeId, selectedPlaybackStartNodeId } =
      usePathStore.getState();
    const origin =
      currentPlayingNodeId ||
      selectedPlaybackStartNodeId ||
      nodes.find((n) => n.type === 'start')?.id;
    applyPathTheme(nodes, edges, origin);
  }, [showingPath]);

  if (showingPath) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="synapse-canvas-action is-revert"
        data-tutorial="theme-toggle"
        title="Restore the theme chosen in Settings"
      >
        Settings theme
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="synapse-canvas-action is-path"
      data-tutorial="theme-toggle"
      title="Apply Style nodes on the current path"
    >
      Path theme
    </button>
  );
}
