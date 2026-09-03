import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReactFlow, useStore, useViewport } from '@xyflow/react';
import { Navigation2 } from 'lucide-react';
import { startArrowState, type StartArrowTarget } from '../startArrow';

const DEFAULT_START_SIZE = { width: 144, height: 88 };

export default function StartDirectionArrow() {
  const viewport = useViewport();
  const { setCenter, getViewport } = useReactFlow();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const starts = useStore((s) => {
    const out: StartArrowTarget[] = [];
    s.nodeLookup.forEach((node) => {
      if (node.type !== 'start' || node.hidden) return;
      const abs = node.internals.positionAbsolute ?? node.position;
      out.push({
        id: node.id,
        rect: {
          x: abs.x,
          y: abs.y,
          width: node.measured?.width ?? node.width ?? DEFAULT_START_SIZE.width,
          height: node.measured?.height ?? node.height ?? DEFAULT_START_SIZE.height,
        },
      });
    });
    return out;
  });

  useEffect(() => {
    const el = document.querySelector(
      '.synapse-canvas-wrap .react-flow'
    ) as HTMLElement | null;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const arrow = useMemo(
    () => startArrowState(starts, viewport, size),
    [starts, viewport, size]
  );

  const panToStart = useCallback(() => {
    if (!arrow.targetId) return;
    const target = starts.find((s) => s.id === arrow.targetId);
    if (!target) return;
    const zoom = getViewport().zoom || 1;
    setCenter(
      target.rect.x + target.rect.width / 2,
      target.rect.y + target.rect.height / 2,
      { zoom, duration: 400 }
    );
  }, [arrow.targetId, starts, getViewport, setCenter]);

  if (!arrow.visible) return null;

  return (
    <button
      type="button"
      className="synapse-start-arrow"
      title="Go to Start node"
      aria-label="Start node is off-screen. Click to pan to it."
      onClick={panToStart}
      style={{ transform: `rotate(${arrow.angleRad + Math.PI / 2}rad)` }}
    >
      <Navigation2 className="w-4 h-4" />
    </button>
  );
}
