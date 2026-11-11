export const VALUE_BEATS = ['build', 'branch', 'play'] as const;
export type ValueBeat = (typeof VALUE_BEATS)[number];

export const VALUE_BEAT_MS: Record<ValueBeat, number> = {
  build: 4600,
  branch: 5400,
  play: 6800,
};

export const VALUE_BEAT_MS_REDUCED = 2600;

export function nextValueBeat(beat: ValueBeat): ValueBeat {
  return VALUE_BEATS[(VALUE_BEATS.indexOf(beat) + 1) % VALUE_BEATS.length];
}

const PLAY_D = 'M86 208 H198 H352 C352 208 352 312 520 312 H668';

function NodeBox({
  x,
  y,
  label,
  kind,
  className = '',
}: {
  x: number;
  y: number;
  label: string;
  kind: 'start' | 'track' | 'conditional' | 'randomizer' | 'transition';
  className?: string;
}) {
  const w = kind === 'start' ? 88 : 118;
  const h = 44;
  return (
    <g className={`synapse-path-node is-${kind} ${className}`.trim()}>
      <rect x={x} y={y} width={w} height={h} rx="8" />
      <text x={x + w / 2} y={y + 27} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function GrabCursor({ x, y }: { x: number; y: number }) {
  return (
    <g className="synapse-value-cursor" transform={`translate(${x} ${y})`}>
      <path
        d="M2 1.5 2 18.2 6.1 14.2 9.4 22.2 12.2 21 8.9 13 15.2 13 Z"
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

  return (
    <svg
      className={`synapse-path-demo synapse-value-demo${motion ? ' is-motion' : ''}`}
      viewBox="0 0 760 400"
      role="img"
      aria-label={label}
      data-beat={beat}
      data-active={active ? 'true' : 'false'}
      data-reduced={reduced ? 'true' : 'false'}
    >
      <rect className="synapse-path-grid" x="0" y="0" width="760" height="400" rx="16" />

      <g className="synapse-value-rack" aria-hidden="true">
        <rect x="16" y="16" width="168" height="52" rx="10" />
        <text x="32" y="47">
          Track
        </text>
      </g>

      <path
        className="synapse-path-edge synapse-value-edge is-edge-start-track"
        pathLength="1"
        d="M86 208 H198"
        fill="none"
      />
      <path
        className="synapse-path-edge synapse-value-edge is-edge-track-if"
        pathLength="1"
        d="M316 208 H352"
        fill="none"
      />
      <path
        className="synapse-path-edge synapse-value-edge is-edge-up"
        pathLength="1"
        d="M470 202 C500 202 500 102 520 102 H598"
        fill="none"
      />
      <path
        className="synapse-path-edge synapse-value-edge is-edge-mid"
        pathLength="1"
        d="M470 208 H520"
        fill="none"
      />
      <path
        className="synapse-path-edge synapse-value-edge is-edge-down"
        pathLength="1"
        d="M470 214 C500 214 500 312 520 312 H598"
        fill="none"
      />
      <path
        className="synapse-path-edge synapse-value-edge is-edge-c"
        pathLength="1"
        d="M636 102 H668"
        fill="none"
      />
      <path
        className="synapse-path-edge synapse-value-edge is-edge-d"
        pathLength="1"
        d="M636 312 H668"
        fill="none"
      />

      {beat === 'play' && motion ? (
        <path id="synapse-value-play-route" className="synapse-path-route" d={PLAY_D} fill="none" />
      ) : null}

      <NodeBox x={42} y={186} label="Start" kind="start" className="is-node-start is-lit" />
      <g className="synapse-value-drag is-drag-track">
        <NodeBox x={198} y={186} label="Track" kind="track" className="is-node-track is-lit" />
        {beat === 'build' && motion ? <GrabCursor x={292} y={208} /> : null}
      </g>
      <g className="synapse-value-drag is-drag-if">
        <NodeBox
          x={352}
          y={186}
          label="If"
          kind="conditional"
          className="is-node-if is-lit"
        />
        {beat === 'build' && motion ? <GrabCursor x={446} y={208} /> : null}
      </g>
      <NodeBox x={520} y={80} label="Track" kind="track" className="is-node-b is-lit" />
      <NodeBox x={520} y={186} label="FX" kind="transition" className="is-node-fx is-lit" />
      <NodeBox x={520} y={290} label="Rnd" kind="randomizer" className="is-node-rnd is-lit" />
      <NodeBox x={650} y={80} label="Track" kind="track" className="is-node-c is-lit" />
      <NodeBox x={650} y={290} label="Track" kind="track" className="is-node-d is-lit" />

      {beat === 'play' ? (
        motion ? (
          <circle className="synapse-path-playhead" r="6" fill="var(--accent-warm)">
            <animateMotion dur="6s" fill="freeze" repeatCount="1">
              <mpath href="#synapse-value-play-route" />
            </animateMotion>
          </circle>
        ) : (
          <circle cx="86" cy="208" r="6" fill="var(--accent-warm)" opacity="0.9" />
        )
      ) : null}
    </svg>
  );
}
