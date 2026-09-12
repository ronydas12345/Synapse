import { useEffect } from 'react';
import { applyTheme } from './applyTheme';
import { isPlaybackStyleSessionActive } from './playbackStyle';
import { resolveTheme, useThemeStore } from './themeStore';

/** Applies the saved theme, or the in-progress editor draft. */
export default function ThemeRoot() {
  const activeId = useThemeStore((s) => s.activeId);
  const customThemes = useThemeStore((s) => s.customThemes);
  const draft = useThemeStore((s) => s.draft);

  useEffect(() => {
    if (isPlaybackStyleSessionActive()) return;
    applyTheme(draft ?? resolveTheme(activeId, customThemes));
  }, [activeId, customThemes, draft]);

  return null;
}
