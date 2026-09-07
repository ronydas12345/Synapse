import { useEffect, useRef } from 'react';
import type { SynapseTheme } from '../theme/types';
import { applyThemeToElement } from '../theme/applyTheme';

export default function ThemePreview({ theme }: { theme: SynapseTheme }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) applyThemeToElement(ref.current, theme);
  }, [theme]);

  return (
    <div ref={ref} className="synapse-theme-preview" aria-hidden="true">
      <div className="synapse-theme-preview-chrome">
        <span className="synapse-theme-preview-brand">{theme.name}</span>
        <span className="synapse-theme-preview-btn">Play</span>
      </div>
      <div className="synapse-theme-preview-body">
        <aside className="synapse-theme-preview-rail">
          <div>Nodes</div>
          <div className="synapse-theme-preview-chip">Track</div>
          <div className="synapse-theme-preview-chip">Conditional</div>
        </aside>
        <div className="synapse-theme-preview-canvas">
          <div className="synapse-theme-preview-node is-start">Start</div>
          <svg className="synapse-theme-preview-edge" viewBox="0 0 48 12">
            <path d="M0 6 C16 6 32 6 48 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div className="synapse-theme-preview-node is-track">Track</div>
          <div className="synapse-theme-preview-node is-conditional">If</div>
          <div className="synapse-theme-preview-node is-randomizer">Seq</div>
          <div className="synapse-theme-preview-node is-comment">Note</div>
        </div>
      </div>
      <div className="synapse-theme-preview-deck">
        <div className="synapse-theme-preview-screen" />
        <div>
          <div>Now playing</div>
          <div className="synapse-theme-preview-btn">Play</div>
        </div>
      </div>
    </div>
  );
}
