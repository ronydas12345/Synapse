import { useEffect, useRef } from 'react';
import type { SynapseTheme } from '../theme/types';
import { applyThemeToElement } from '../theme/applyTheme';
import { previewEdgePath, sanitizeEdgeType } from '../theme/edgeType';
import { sanitizeVisualizerBarCount } from '../theme/visualizerBars';
import SynapseMark from '../pages/chrome/SynapseMark';

export default function ThemePreview({ theme }: { theme: SynapseTheme }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) applyThemeToElement(ref.current, theme);
  }, [theme]);

  const edgePath = previewEdgePath(sanitizeEdgeType(theme.style.edgeType));
  const barCount = sanitizeVisualizerBarCount(theme.style.visualizerBarCount);

  return (
    <div ref={ref} className="synapse-theme-preview" aria-hidden="true">
      <div className="synapse-theme-preview-chrome">
        <span className="synapse-theme-preview-brand">
          <SynapseMark size={16} />
          {theme.name}
        </span>
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
          <svg className="synapse-theme-preview-edge" viewBox="0 0 72 28">
            <path d={edgePath} fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div className="synapse-theme-preview-node is-track">Track</div>
          <div className="synapse-theme-preview-node is-conditional">If</div>
          <div className="synapse-theme-preview-node is-randomizer">Seq</div>
          <div className="synapse-theme-preview-node is-comment">Note</div>
        </div>
      </div>
      <div className="synapse-theme-preview-deck">
        <div className="synapse-theme-preview-screen" />
        <div className="synapse-theme-preview-viz" aria-hidden="true">
          {Array.from({ length: barCount }, (_, i) => {
            const t = barCount === 1 ? 0.5 : i / (barCount - 1);
            const h = 28 + Math.round(72 * Math.abs(Math.sin((t + 0.12) * Math.PI)));
            return <span key={i} style={{ height: `${h}%` }} />;
          })}
        </div>
        <div>
          <div>Now playing</div>
          <div className="synapse-theme-preview-btn">Play</div>
        </div>
      </div>
    </div>
  );
}
