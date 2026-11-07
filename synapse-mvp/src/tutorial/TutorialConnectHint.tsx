import { useLayoutEffect, useMemo, useState } from 'react';
import { usePathStore } from '../store';
import {
  connectGeomClose,
  findSuggestedConnection,
  measureConnectHint,
  type ConnectHintGeom,
} from './connectHint';

export default function TutorialConnectHint({
  active,
  reduced,
}: {
  active: boolean;
  reduced: boolean;
}) {
  const nodes = usePathStore((s) => s.nodes);
  const edges = usePathStore((s) => s.edges);
  const pair = useMemo(() => findSuggestedConnection(nodes, edges), [nodes, edges]);
  const [geom, setGeom] = useState<ConnectHintGeom | null>(null);

  useLayoutEffect(() => {
    if (!active || !pair) {
      setGeom(null);
      return;
    }

    let raf = 0;
    let last: ConnectHintGeom | null = null;
    const tick = () => {
      const next = measureConnectHint(pair);
      if (!connectGeomClose(last, next)) {
        last = next;
        setGeom(next);
      }
      raf = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(raf);
  }, [active, pair]);

  if (!active || !geom) return null;

  const pad = 10;
  const sw = Math.max(18, geom.source.width + pad);
  const sh = Math.max(18, geom.source.height + pad);
  const tw = Math.max(18, geom.target.width + pad);
  const th = Math.max(18, geom.target.height + pad);

  return (
    <div className={`synapse-tutorial-connect${reduced ? ' is-instant' : ''}`} aria-hidden>
      <span
        className="synapse-tutorial-connect-handle"
        style={{
          left: geom.source.x - sw / 2,
          top: geom.source.y - sh / 2,
          width: sw,
          height: sh,
        }}
      />
      <span
        className="synapse-tutorial-connect-handle"
        style={{
          left: geom.target.x - tw / 2,
          top: geom.target.y - th / 2,
          width: tw,
          height: th,
        }}
      />
      <svg className="synapse-tutorial-connect-svg">
        <line
          className="synapse-tutorial-connect-line"
          x1={geom.source.x}
          y1={geom.source.y}
          x2={geom.target.x}
          y2={geom.target.y}
        />
      </svg>
    </div>
  );
}
