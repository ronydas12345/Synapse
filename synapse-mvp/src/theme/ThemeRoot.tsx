import { useEffect } from 'react';
import { applyTheme } from './applyTheme';
import { resolveTheme, useThemeStore } from './themeStore';

/** Applies the saved active theme. Draft edits stay in the isolated preview. */
export default function ThemeRoot() {
  const activeId = useThemeStore((s) => s.activeId);
  const customThemes = useThemeStore((s) => s.customThemes);

  useEffect(() => {
    applyTheme(resolveTheme(activeId, customThemes));
  }, [activeId, customThemes]);

  return null;
}
