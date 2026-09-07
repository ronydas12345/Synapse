import { useId } from 'react';
import { usePrefersReducedMotion } from '../../../site/motion';

export type PathScene =
  | 'hero'
  | 'build'
  | 'control'
  | 'experience'
  | 'step1'
  | 'step2'
  | 'step3'
  | 'step4';

const PLAY_D =
  'M86 208 H198 H352 C352 208 352 312 520 312 H668';

function NodeBox({
  x,
  y,
  label,
  kind,
  lit,
}: {
  x: number;
  y: number;
  label: string;
  kind: 'start' | 'track' | 'conditional' | 'randomizer' | 'transition';
  lit?: boolean;
}) {
  const w = kind === 'start' ? 88 : 118;
  const h = 44;
  return (
    <g className={`synapse-path-node is-${kind}${lit ? ' is-lit' : ''}`}>
      <rect x={x} y={y} width={w} height={h} rx="8" />
      <text x={x + w / 2} y={y + 27} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

export default function PathDemo({
  scene,
  animate = false,
  label,
}: {
  scene: PathScene;
  animate?: boolean;
  label: string;
}) {
  const reduced = usePrefersReducedMotion();
  const motion = animate && !reduced;
  const routeId = useId().replace(/:/g, '');
  const lit = (id: string) => {
    if (scene === 'hero' || scene === 'step2' || scene === 'experience') return true;
    if (scene === 'build' || scene === 'step1') return id === 'start' || id === 'trackA';
    if (scene === 'control' || scene === 'step3')
      return id === 'cond' || id === 'rnd' || id === 'trans';
    if (scene === 'step4') return id === 'rnd' || id === 'trackD';
    return true;
  };

  return (
    <svg
      className={`synapse-path-demo${motion ? ' is-motion' : ''}`}
      viewBox="0 0 760 400"
      role="img"
      aria-label={label}
    >
      <rect className="synapse-path-grid" x="0" y="0" width="760" height="400" rx="16" />
      <path
        className="synapse-path-edge"
        d="M86 208 H198"
        fill="none"
      />
      <path className="synapse-path-edge" d="M316 208 H352" fill="none" />
      <path
        className="synapse-path-edge"
        d="M470 202 C500 202 500 102 520 102 H598"
        fill="none"
      />
      <path
        className="synapse-path-edge"
        d="M470 208 H520"
        fill="none"
      />
      <path
        className="synapse-path-edge"
        d="M470 214 C500 214 500 312 520 312 H598"
        fill="none"
      />
      <path className="synapse-path-edge" d="M636 102 H668" fill="none" />
      <path className="synapse-path-edge" d="M636 312 H668" fill="none" />
      {motion ? (
        <path
          id={routeId}
          className="synapse-path-route"
          d={PLAY_D}
          fill="none"
        />
      ) : null}

      <NodeBox x={42} y={186} label="Start" kind="start" lit={lit('start')} />
      <NodeBox x={198} y={186} label="Track" kind="track" lit={lit('trackA')} />
      <NodeBox x={352} y={186} label="If" kind="conditional" lit={lit('cond')} />
      <NodeBox x={520} y={80} label="Track" kind="track" lit={lit('trackB')} />
      <NodeBox x={520} y={186} label="FX" kind="transition" lit={lit('trans')} />
      <NodeBox x={520} y={290} label="Rnd" kind="randomizer" lit={lit('rnd')} />
      <NodeBox x={650} y={80} label="Track" kind="track" lit={lit('trackC')} />
      <NodeBox x={650} y={290} label="Track" kind="track" lit={lit('trackD')} />

      {motion ? (
        <circle className="synapse-path-playhead" r="6" fill="var(--accent-warm)">
          <animateMotion dur="7s" repeatCount="indefinite">
            <mpath href={`#${routeId}`} />
          </animateMotion>
        </circle>
      ) : (
        <circle cx="86" cy="208" r="6" fill="var(--accent-warm)" opacity="0.9" />
      )}
    </svg>
  );
}
