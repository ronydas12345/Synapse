import { AppLink } from '../../../app/AppLink';
import ThemePreview from '../../../components/ThemePreview';
import { BUILTIN_THEMES } from '../../../theme/presets';
import Reveal from './Reveal';

const SHOWCASE_IDS = [
  'standard-dark',
  'cyberpunk',
  'neon',
  'synthwave',
  'monochrome',
  'forest',
  'cherry-tree',
  'pretty-pink',
  'midnight',
  'warm-cream',
] as const;

export default function ThemeShowcase() {
  const themes = SHOWCASE_IDS.map((id) =>
    BUILTIN_THEMES.find((t) => t.id === id)
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <section className="synapse-mkt-section" id="themes" aria-labelledby="themes-title">
      <Reveal>
        <p className="synapse-mkt-kicker">Themes</p>
        <h2 id="themes-title">The path stays. The world around it changes.</h2>
        <p className="synapse-mkt-lead">
          These are real presets from the app. The Music Path underneath does not
          change — only color, type, and chrome.
        </p>
        <div className="synapse-mkt-theme-row">
          {themes.map((theme) => (
            <figure key={theme.id} className="synapse-mkt-theme-card">
              <ThemePreview theme={theme} />
              <figcaption>{theme.name}</figcaption>
            </figure>
          ))}
        </div>
        <p className="synapse-mkt-actions">
          <AppLink to="settings" className="synapse-btn synapse-btn-ghost">
            Explore Themes
          </AppLink>
        </p>
      </Reveal>
    </section>
  );
}
