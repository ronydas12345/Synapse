import { useEffect, useState } from 'react';
import {
  EDGES,
  H,
  NODES,
  VALUE_BEAT_MS,
  cx,
  cy,
  right,
  sampleDemo,
  splitPortY,
  type DemoNode,
  type ValueBeat,
} from './valueDemoTimeline';

export {
  PLAY_D,
  VALUE_BEAT_MS,
  VALUE_BEAT_MS_REDUCED,
  VALUE_BEATS,
  nextValueBeat,
} from './valueDemoTimeline';
export type { ValueBeat };

function Port({ x, y }: { x: number; y: number }) {
  return <circle className="synapse-value-port" cx={x} cy={y} r="5" />;
}

function NodePorts({ node }: { node: DemoNode }) {
  const midY = cy(node);
  if (node.ports === 'start') return <Port x={right(node)} y={midY} />;
  if (node.ports === 'end') return <Port x={node.x} y={midY} />;
  if (node.ports === 'both') {
    return (
      <>
        <Port x={node.x} y={midY} />
        <Port x={right(node)} y={midY} />
      </>
    );
  }
  return (
    <>
      <Port x={node.x} y={midY} />
      <Port x={right(node)} y={splitPortY(node, 0)} />
      <Port x={right(node)} y={splitPortY(node, 1)} />
      <Port x={right(node)} y={splitPortY(node, 2)} />
    </>
  );
}

function Cursor({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  if (opacity <= 0.02) return null;
  return (
    <g className="synapse-value-cursor" opacity={opacity} transform={`translate(${x} ${y})`}>
      <path
        d="M0 0 0 16.7 4.1 12.7 7.4 20.7 10.2 19.5 6.9 11.5 13.2 11.5 Z"
        fill="var(--text)"
        stroke="var(--bg-void)"
        strokeWidth="1.2"
      />
    </g>
  );
}

export default function ValuePathDemo({
  beat,
  active,
  reduced,
  label,
}: {
  beat: ValueBeat;
  active: boolean;
  reduced: boolean;
  label: string;
}) {
  const motion = active && !reduced;
  const duration = VALUE_BEAT_MS[beat];
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!motion) {
      setElapsed(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const dt = now - t0;
      setElapsed(dt);
      if (dt < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [motion, duration, beat]);

  const frame = sampleDemo(beat, elapsed, motion);

  return (
    <svg
      className={`synapse-path-demo synapse-value-demo${motion ? ' is-motion' : ''}`}
      viewBox="0 0 900 400"
      role="img"
      aria-label={label}
      data-beat={beat}
      data-active={active ? 'true' : 'false'}
      data-reduced={reduced ? 'true' : 'false'}
    >
      <defs>
        <clipPath id="synapse-value-demo-clip">
          <rect x="0" y="0" width="900" height="400" rx="16" />
        </clipPath>
      </defs>
      <rect className="synapse-path-grid" x="0" y="0" width="900" height="400" rx="16" />

      <g clipPath="url(#synapse-value-demo-clip)">
        <g opacity={frame.graphOpacity}>
          {EDGES.map((edge) => (
            <path
              key={edge.id}
              className={`synapse-path-edge synapse-value-edge is-edge-${edge.id}`}
              d={edge.d}
              fill="none"
              style={{ opacity: frame.edgeOn[edge.id] ? 0.7 : 0 }}
            />
          ))}

          {NODES.map((node) => {
            const pose = frame.node[node.id];
            return (
              <g
                key={node.id}
                className={`synapse-path-node is-${node.kind} ${node.className}`.trim()}
                opacity={pose?.opacity ?? 0}
                transform={`translate(${pose?.tx ?? 0} ${pose?.ty ?? 0})`}
              >
                <rect x={node.x} y={node.y} width={node.w} height={H} rx="8" />
                <text x={cx(node)} y={node.y + 27} textAnchor="middle">
                  {node.label}
                </text>
                <NodePorts node={node} />
              </g>
            );
          })}

          {frame.playhead ? (
            <circle
              className="synapse-path-playhead"
              cx={frame.playhead.x}
              cy={frame.playhead.y}
              r="8"
              fill="var(--accent-warm)"
              opacity={frame.playhead.opacity}
            />
          ) : null}

          {frame.marquee ? (
            <rect
              className="synapse-value-marquee"
              x={frame.marquee.x}
              y={frame.marquee.y}
              width={frame.marquee.w}
              height={frame.marquee.h}
              rx="8"
              opacity={frame.marquee.opacity}
            />
          ) : null}
        </g>

        {frame.rubber ? (
          <line
            className="synapse-value-rubber"
            x1={frame.rubber.x1}
            y1={frame.rubber.y1}
            x2={frame.rubber.x2}
            y2={frame.rubber.y2}
          />
        ) : null}

        {frame.playBurst > 0.02 ? (
          <g transform="translate(448 200)" opacity={frame.playBurst}>
            <g className="synapse-value-play-burst">
              <circle r="24" />
              <path d="M -6 -11 L -6 11 L 13 0 Z" />
            </g>
          </g>
        ) : null}

        <Cursor x={frame.cursor.x} y={frame.cursor.y} opacity={frame.cursor.opacity} />
      </g>
    </svg>
  );
}
