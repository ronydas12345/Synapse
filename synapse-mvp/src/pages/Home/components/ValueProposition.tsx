import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../../site/motion';
import Reveal from './Reveal';
import ValuePathDemo, {
  VALUE_BEAT_MS,
  VALUE_BEAT_MS_REDUCED,
  VALUE_BEATS,
  nextValueBeat,
  type ValueBeat,
} from './ValuePathDemo';

const IDEAS: { beat: ValueBeat; title: string; body: string; label: string }[] = [
  {
    beat: 'build',
    title: 'Build',
    body: 'Drag nodes onto the canvas from the left. Ports stay visible until you connect them.',
    label: 'Nodes dragged in from the left: Start, Track, and If, then the rest, including End on the right.',
  },
  {
    beat: 'branch',
    title: 'Branch',
    body: 'Draw connections from port to port. A play control flashes when the path is wired.',
    label: 'A cursor drawing connections between every node, then a brief play icon.',
  },
  {
    beat: 'play',
    title: 'Play',
    body: 'Playback follows the edges, pauses on each node, and stops at End.',
    label: 'A playback marker traveling along connections through each node to End, then a box select that clears the path.',
  },
];

export default function ValueProposition() {
  const reduced = usePrefersReducedMotion();
  const [beat, setBeat] = useState<ValueBeat>('build');
  const [animKey, setAnimKey] = useState(0);
  const [visible, setVisible] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const current = IDEAS[VALUE_BEATS.indexOf(beat)];

  const selectBeat = (next: ValueBeat) => {
    setBeat(next);
    setAnimKey((key) => key + 1);
  };

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let inView = false;
    const sync = () => setVisible(inView && !document.hidden);
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.28;
        sync();
      },
      { threshold: [0, 0.28, 0.6] }
    );
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const ms = reduced ? VALUE_BEAT_MS_REDUCED : VALUE_BEAT_MS[beat];
    const timer = window.setTimeout(() => {
      setBeat((now) => nextValueBeat(now));
      setAnimKey((key) => key + 1);
    }, ms);
    return () => window.clearTimeout(timer);
  }, [beat, animKey, visible, reduced]);

  return (
    <section className="synapse-mkt-section" id="value" aria-labelledby="value-title">
      <h2 id="value-title">A playlist is a list. A Music Path is a graph.</h2>
      <p className="synapse-mkt-lead">
        You draw what can happen next. Playback follows the connections.
      </p>
      <Reveal>
        <div className="synapse-mkt-value" ref={hostRef}>
          <div
            className="synapse-mkt-value-picks"
            role="tablist"
            aria-label="How a music path works"
          >
            {IDEAS.map((item) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={item.beat === beat}
                className={`synapse-mkt-value-pick${item.beat === beat ? ' is-active' : ''}`}
                onClick={() => selectBeat(item.beat)}
              >
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </button>
            ))}
          </div>
          <div
            className="synapse-mkt-value-panel"
            aria-live="polite"
            aria-atomic="true"
          >
            <ValuePathDemo
              key={`${beat}-${animKey}`}
              beat={beat}
              active={visible}
              reduced={reduced}
              label={current.label}
            />
            <div className="synapse-mkt-value-dots">
              {IDEAS.map((item) => (
                <button
                  key={item.beat}
                  type="button"
                  aria-label={item.title}
                  aria-pressed={item.beat === beat}
                  className={`synapse-mkt-value-dot${item.beat === beat ? ' is-active' : ''}`}
                  onClick={() => selectBeat(item.beat)}
                />
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
