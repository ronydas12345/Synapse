import ThemePreview from '../../../components/ThemePreview';
import { allThemes, useThemeStore } from '../../../theme/themeStore';
import HomeThemePicker from './HomeThemePicker';
import Reveal from './Reveal';

export default function ThemeShowcase() {
  const activeId = useThemeStore((s) => s.activeId);
  const customThemes = useThemeStore((s) => s.customThemes);
  const setActiveId = useThemeStore((s) => s.setActiveId);
  const themes = allThemes(customThemes);

  return (
    <section className="synapse-mkt-section" id="themes" aria-labelledby="themes-title">
      <Reveal>
        <p className="synapse-mkt-kicker">Themes</p>
        <h2 id="themes-title">The path stays. The world around it changes.</h2>
        <p className="synapse-mkt-lead">
          Pick a preset (or a custom theme you already saved). The homepage and
          the editor share the same choice. Import and export stay in Settings.
        </p>
        <HomeThemePicker />
        <div className="synapse-mkt-theme-row">
          {themes.map((theme) => {
            const selected = theme.id === activeId;
            return (
              <figure
                key={theme.id}
                className={`synapse-mkt-theme-card${selected ? ' is-active' : ''}`}
              >
                <button
                  type="button"
                  className="synapse-mkt-theme-apply"
                  aria-pressed={selected}
                  aria-label={`Use ${theme.name} theme`}
                  onClick={() => setActiveId(theme.id)}
                >
                  <ThemePreview theme={theme} />
                </button>
                <figcaption>
                  {theme.name}
                  {theme.builtin ? '' : ' (custom)'}
                  {selected ? ' · Current' : ''}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
