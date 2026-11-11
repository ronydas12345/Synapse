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
    body: 'Drop nodes onto the canvas and connect them.',
    label: 'A Start node, then a Track node dragged onto the canvas and connected.',
  },
  {
    beat: 'branch',
    title: 'Branch',
    body: 'Conditions, randomizers, and transitions determine what happens next.',
    label: 'Branches drawing from a Conditional to other tracks, a transition, and a randomizer.',
  },
  {
    beat: 'play',
    title: 'Play',
    body: 'Press Play. The path chooses the next song.',
    label: 'The full path with a playback marker following the graph.',
  },
];

export default function ValueProposition() {
  const reduced = usePrefersReducedMotion();
  const [beat, setBeat] = useState<ValueBeat>('build');
  const [visible, setVisible] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const current = IDEAS[VALUE_BEATS.indexOf(beat)];

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
    const timer = window.setTimeout(() => setBeat((now) => nextValueBeat(now)), ms);
    return () => window.clearTimeout(timer);
  }, [beat, visible, reduced]);

  return (
    <section className="synapse-mkt-section" id="value" aria-labelledby="value-title">
      <h2 id="value-title">A playlist is a list. A Music Path is a graph.</h2>
      <p className="synapse-mkt-lead">
        You draw what can happen next. Playback follows the connections.
      </p>
      <Reveal>
        <div className="synapse-mkt-value" ref={hostRef}>
          <div className="synapse-mkt-value-picks" role="list" aria-label="How a music path works">
            {IDEAS.map((item) => (
              <div
                key={item.title}
                role="listitem"
                className={`synapse-mkt-value-pick${item.beat === beat ? ' is-active' : ''}`}
                aria-current={item.beat === beat ? 'true' : undefined}
              >
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
            ))}
          </div>
          <div
            className="synapse-mkt-value-panel"
            aria-live="polite"
            aria-atomic="true"
          >
            <ValuePathDemo
              beat={beat}
              active={visible}
              reduced={reduced}
              label={current.label}
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
