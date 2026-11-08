import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Focus, RotateCcw } from 'lucide-react';
import { FOCUS_SELECTED_EVENT, RESTORE_VIEWPORT_EVENT } from '../canvas/fitEvents';

export default function CanvasNavExtras() {
  const { getViewport } = useReactFlow();
  const [zoom, setZoom] = useState(1);
  const lastZoom = useRef(1);

  useEffect(() => {
    const tick = () => {
      const next = getViewport().zoom;
      if (!Number.isFinite(next) || Math.abs(next - lastZoom.current) < 0.005) return;
      lastZoom.current = next;
      setZoom(next);
    };
    tick();
    const id = window.setInterval(tick, 120);
    return () => window.clearInterval(id);
  }, [getViewport]);

  return (
    <div
      className="synapse-canvas-nav-extras"
      role="group"
      aria-label="Canvas view"
      data-tutorial="canvas-focus"
    >
      <span className="synapse-canvas-zoom-readout" aria-live="polite">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        className="synapse-canvas-nav-btn"
        title="Focus selected"
        aria-label="Focus selected"
        onClick={() => window.dispatchEvent(new Event(FOCUS_SELECTED_EVENT))}
      >
        <Focus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className="synapse-canvas-nav-btn"
        title="Restore previous view"
        aria-label="Restore previous view"
        onClick={() => window.dispatchEvent(new Event(RESTORE_VIEWPORT_EVENT))}
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
