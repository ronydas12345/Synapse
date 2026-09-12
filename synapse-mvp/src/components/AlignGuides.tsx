import { useEffect, useMemo, useState } from 'react';
import { useViewport } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { nodeSize, worldPosition } from '../randomizerDrop';
import {
  ALIGN_PROXIMITY_PX,
  SNAP_THRESHOLD_PX,
  flowToOverlay,
  hoverGuides,
  type DiagonalGuide,
  type NodeBox,
  type OverlayGuide,
  type SpacingGuide,
} from '../alignGuides';
import { setAlignShift, useAlignOverlay } from '../alignGuideStore';

function tickOffset(guide: SpacingGuide, size: number): { x: number; y: number } {
  const dx = guide.x2 - guide.x1;
  const dy = guide.y2 - guide.y1;
  const len = Math.hypot(dx, dy) || 1;
  return { x: (-dy / len) * size, y: (dx / len) * size };
}

function AxisLine({
  guide,
  viewport,
}: {
  guide: Extract<OverlayGuide, { kind: 'side' | 'center' }>;
  viewport: { x: number; y: number; zoom: number };
}) {
  const at =
    guide.axis === 'x'
      ? guide.at * viewport.zoom + viewport.x
      : guide.at * viewport.zoom + viewport.y;
  if (guide.axis === 'x') {
    return (
      <line
        className={`synapse-align-guide is-${guide.kind}`}
        x1={at}
        y1={0}
        x2={at}
        y2="100%"
      />
    );
  }
  return (
    <line
      className={`synapse-align-guide is-${guide.kind}`}
      x1={0}
      y1={at}
      x2="100%"
      y2={at}
    />
  );
}

function DiagonalLine({
  guide,
  viewport,
}: {
  guide: DiagonalGuide;
  viewport: { x: number; y: number; zoom: number };
}) {
  const a = flowToOverlay(guide.x1, guide.y1, viewport);
  const b = flowToOverlay(guide.x2, guide.y2, viewport);
  return (
    <line
      className="synapse-align-guide is-diagonal"
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
    />
  );
}

function SpacingLine({
  guide,
  viewport,
}: {
  guide: SpacingGuide;
  viewport: { x: number; y: number; zoom: number };
}) {
  const a = flowToOverlay(guide.x1, guide.y1, viewport);
  const b = flowToOverlay(guide.x2, guide.y2, viewport);
  const tick = tickOffset(
    { ...guide, x1: a.x, y1: a.y, x2: b.x, y2: b.y },
    5
  );
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const label = `${Math.round(guide.gap)}`;
  return (
    <g className="synapse-align-spacing">
      <line
        className="synapse-align-guide is-spacing"
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
      />
      <line
        className="synapse-align-guide is-spacing"
        x1={a.x - tick.x}
        y1={a.y - tick.y}
        x2={a.x + tick.x}
        y2={a.y + tick.y}
      />
      <line
        className="synapse-align-guide is-spacing"
        x1={b.x - tick.x}
        y1={b.y - tick.y}
        x2={b.x + tick.x}
        y2={b.y + tick.y}
      />
      <text className="synapse-align-gap-label" x={mx} y={my - 4} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

export default function AlignGuides({
  nodes,
  containerRef,
}: {
  nodes: Node[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const viewport = useViewport();
  const overlay = useAlignOverlay();
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      if (event.shiftKey) setAlignShift(true);
    };
    const onLeave = () => setPointer(null);
    el.addEventListener('pointerenter', onMove);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onMove);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [containerRef]);

  const boxes = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const out: NodeBox[] = [];
    for (const node of nodes) {
      if (node.hidden) continue;
      const size = nodeSize(node);
      const pos = worldPosition(node, byId);
      out.push({
        id: node.id,
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
      });
    }
    return out;
  }, [nodes]);

  const hover = useMemo(() => {
    if (overlay.dragging || !overlay.shift || !pointer) return [];
    const zoom = viewport.zoom || 1;
    const flow = {
      x: (pointer.x - viewport.x) / zoom,
      y: (pointer.y - viewport.y) / zoom,
    };
    return hoverGuides(flow, boxes, ALIGN_PROXIMITY_PX / zoom, SNAP_THRESHOLD_PX / zoom);
  }, [overlay.dragging, overlay.shift, pointer, boxes, viewport]);

  const guides = overlay.dragging ? overlay.guides : hover;
  if (!overlay.shift || guides.length === 0) return null;

  return (
    <svg className="synapse-align-guides" aria-hidden="true">
      {guides.map((guide) => {
        if (guide.kind === 'diagonal') {
          return <DiagonalLine key={guide.id} guide={guide} viewport={viewport} />;
        }
        if (guide.kind === 'spacing') {
          return <SpacingLine key={guide.id} guide={guide} viewport={viewport} />;
        }
        return <AxisLine key={guide.id} guide={guide} viewport={viewport} />;
      })}
    </svg>
  );
}
