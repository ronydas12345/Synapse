import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ThemePreview from '../../../components/ThemePreview';
import { allThemes, useThemeStore } from '../../../theme/themeStore';
import HomeThemePicker from './HomeThemePicker';
import Reveal from './Reveal';

export default function ThemeShowcase() {
  const activeId = useThemeStore((s) => s.activeId);
  const customThemes = useThemeStore((s) => s.customThemes);
  const setActiveId = useThemeStore((s) => s.setActiveId);
  const themes = allThemes(customThemes);
  const rowRef = useRef<HTMLDivElement>(null);

  function scrollRow(direction: -1 | 1) {
    const row = rowRef.current;
    if (!row) return;
    const amount = Math.max(row.clientWidth * 0.72, 280);
    row.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }

  return (
    <section className="synapse-mkt-section" id="themes" aria-labelledby="themes-title">
      <h2 id="themes-title">Themes</h2>
      <p className="synapse-mkt-lead">
        Choose a visual style for Synapse. Your selected theme carries across
        the homepage and editor. You can try themes here without an account.
        Import and export are in Settings.
      </p>
      <Reveal>
        <HomeThemePicker />
        <div className="synapse-mkt-theme-carousel">
          <button
            type="button"
            className="synapse-mkt-theme-nav"
            aria-label="Previous themes"
            onClick={() => scrollRow(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="synapse-mkt-theme-row" ref={rowRef}>
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
          <button
            type="button"
            className="synapse-mkt-theme-nav"
            aria-label="Next themes"
            onClick={() => scrollRow(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
