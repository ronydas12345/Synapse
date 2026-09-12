import { allThemes, resolveTheme, useThemeStore } from '../../../theme/themeStore';

export default function HomeThemePicker({ compact = false }: { compact?: boolean }) {
  const activeId = useThemeStore((s) => s.activeId);
  const customThemes = useThemeStore((s) => s.customThemes);
  const setActiveId = useThemeStore((s) => s.setActiveId);
  const themes = allThemes(customThemes);
  const active = resolveTheme(activeId, customThemes);

  return (
    <label className={`synapse-mkt-theme-pick${compact ? ' is-compact' : ''}`}>
      <span className={compact ? 'synapse-sr-only' : undefined}>Theme</span>
      <select
        aria-label="Theme"
        value={active.id}
        onChange={(e) => setActiveId(e.target.value)}
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.builtin ? '' : ' (custom)'}
          </option>
        ))}
      </select>
    </label>
  );
}
