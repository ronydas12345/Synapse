import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GameCategory, GameProps } from './types';

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function scoreFromError(error: number, perfect: number, fail: number): number {
  if (error <= perfect) return 100;
  if (error >= fail) return 0;
  return Math.round(100 - ((error - perfect) / (fail - perfect)) * 100);
}

function Shell({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="synapse-game-shell">
      <h3>{title}</h3>
      <p className="synapse-settings-lead">{hint}</p>
      {children}
    </div>
  );
}

function PulseGame({ onComplete, reducedMotion }: GameProps) {
  const [phase, setPhase] = useState<'wait' | 'go' | 'done'>('wait');
  const start = useRef(0);
  useEffect(() => {
    const delay = reducedMotion ? 600 : randInt(900, 2400);
    const t = window.setTimeout(() => {
      start.current = performance.now();
      setPhase('go');
    }, delay);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);
  return (
    <Shell title="Pulse" hint="Wait for the flash. Do not tap early.">
      <button
        type="button"
        className={`synapse-game-stage ${phase === 'go' ? 'is-go' : ''}`}
        disabled={phase === 'done'}
        onClick={() => {
          if (phase === 'wait') {
            onComplete(0);
            setPhase('done');
            return;
          }
          if (phase !== 'go') return;
          const ms = performance.now() - start.current;
          onComplete(scoreFromError(ms, 180, 900));
          setPhase('done');
        }}
      >
        {phase === 'wait' ? 'Wait…' : phase === 'go' ? 'Tap' : 'Done'}
      </button>
    </Shell>
  );
}

function EchoGame({ onComplete }: GameProps) {
  const [seq, setSeq] = useState<number[]>([randInt(0, 3)]);
  const [flash, setFlash] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);
  const [lock, setLock] = useState(true);
  const round = seq.length;

  useEffect(() => {
    let i = 0;
    setLock(true);
    setInput([]);
    const tick = () => {
      setFlash(seq[i]);
      window.setTimeout(() => {
        setFlash(null);
        i += 1;
        if (i < seq.length) window.setTimeout(tick, 220);
        else setLock(false);
      }, 420);
    };
    const start = window.setTimeout(tick, 400);
    return () => window.clearTimeout(start);
  }, [seq]);

  function press(n: number) {
    if (lock) return;
    const next = [...input, n];
    if (seq[next.length - 1] !== n) {
      onComplete(Math.min(100, (round - 1) * 16));
      return;
    }
    if (next.length === seq.length) {
      if (round >= 6) {
        onComplete(100);
        return;
      }
      setSeq([...seq, randInt(0, 3)]);
      return;
    }
    setInput(next);
  }

  return (
    <Shell title="Echo" hint={`Repeat the pattern. Round ${round} of 6.`}>
      <div className="synapse-game-grid">
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            className={`synapse-game-tile ${flash === n ? 'is-on' : ''}`}
            onClick={() => press(n)}
            disabled={lock}
          >
            {n + 1}
          </button>
        ))}
      </div>
    </Shell>
  );
}

function DownbeatGame({ onComplete, reducedMotion }: GameProps) {
  const beats = 8;
  const interval = reducedMotion ? 700 : 600;
  const [count, setCount] = useState(0);
  const taps = useRef<number[]>([]);
  const origin = useRef(0);
  useEffect(() => {
    origin.current = performance.now() + interval;
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c + 1 >= beats) window.clearInterval(id);
        return c + 1;
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [interval]);

  return (
    <Shell title="Downbeat" hint="Tap with each pulse. Eight beats.">
      <p aria-live="polite">Beat {Math.min(count, beats)} / {beats}</p>
      <button
        type="button"
        className="synapse-btn synapse-btn-play"
        onClick={() => {
          taps.current.push(performance.now());
          if (taps.current.length >= beats) {
            const errors = taps.current.map((t, i) =>
              Math.abs(t - (origin.current + i * interval))
            );
            const avg = errors.reduce((a, b) => a + b, 0) / errors.length;
            onComplete(scoreFromError(avg, 40, 280));
          }
        }}
      >
        Tap
      </button>
    </Shell>
  );
}

function NextNoteGame({ onComplete }: GameProps) {
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const puzzle = useMemo(() => {
    const start = randInt(1, 8);
    const step = randInt(1, 4);
    const seq = [start, start + step, start + step * 2];
    return { seq, answer: start + step * 3, distractors: [start + step * 2 + 1, start + step * 4, start] };
  }, [round]);
  const options = useMemo(
    () => [...new Set([puzzle.answer, ...puzzle.distractors])].sort(() => Math.random() - 0.5),
    [puzzle]
  );
  return (
    <Shell title="Next Note" hint={`Sequence: ${puzzle.seq.join(', ')}, ?`}>
      <div className="synapse-game-options">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => {
              const nextCorrect = correct + (n === puzzle.answer ? 1 : 0);
              if (round + 1 >= 5) onComplete(nextCorrect * 20);
              else {
                setCorrect(nextCorrect);
                setRound(round + 1);
              }
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </Shell>
  );
}

function HoldGame({ onComplete, reducedMotion }: GameProps) {
  const [pos, setPos] = useState(0);
  const dir = useRef(1);
  useEffect(() => {
    const step = reducedMotion ? 4 : 2.2;
    const id = window.setInterval(() => {
      setPos((p) => {
        const next = p + dir.current * step;
        if (next >= 100 || next <= 0) dir.current *= -1;
        return Math.min(100, Math.max(0, next));
      });
    }, 16);
    return () => window.clearInterval(id);
  }, [reducedMotion]);
  return (
    <Shell title="Hold" hint="Stop the marker on the highlighted band.">
      <div className="synapse-game-track" aria-hidden="true">
        <span className="synapse-game-target" />
        <span className="synapse-game-marker" style={{ left: `${pos}%` }} />
      </div>
      <button
        type="button"
        className="synapse-btn synapse-btn-play"
        onClick={() => onComplete(scoreFromError(Math.abs(pos - 50), 4, 36))}
      >
        Stop
      </button>
    </Shell>
  );
}

function OddPathGame({ onComplete }: GameProps) {
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const set = useMemo(() => {
    const tiles = ['●', '●', '●', '▲'];
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return tiles;
  }, [round]);
  return (
    <Shell title="Odd Path" hint="Tap the tile that does not belong.">
      <div className="synapse-game-grid">
        {set.map((label, i) => (
          <button
            key={`${round}-${i}`}
            type="button"
            className="synapse-game-tile"
            onClick={() => {
              const next = correct + (label === '▲' ? 1 : 0);
              if (round + 1 >= 5) onComplete(next * 20);
              else {
                setCorrect(next);
                setRound(round + 1);
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </Shell>
  );
}

function MatchGame({ onComplete }: GameProps) {
  const glyphs = useMemo(() => {
    const pair = ['◆', '●', '▲', '■'][randInt(0, 3)];
    const rest = ['◇', '○', '△'].slice(0, 4);
    const tiles = [pair, pair, rest[0], rest[1], rest[2], '□'];
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return { tiles, pair };
  }, []);
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <Shell title="Match" hint="Find the two matching tiles.">
      <div className="synapse-game-grid is-six">
        {glyphs.tiles.map((g, i) => (
          <button
            key={i}
            type="button"
            className={`synapse-game-tile ${picked.includes(i) ? 'is-on' : ''}`}
            onClick={() => {
              if (picked.includes(i) || picked.length >= 2) return;
              const next = [...picked, i];
              setPicked(next);
              if (next.length === 2) {
                const ok =
                  glyphs.tiles[next[0]] === glyphs.pair &&
                  glyphs.tiles[next[1]] === glyphs.pair;
                onComplete(ok ? 100 : 20);
              }
            }}
          >
            {g}
          </button>
        ))}
      </div>
    </Shell>
  );
}

function playTone(freq: number) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.value = 0.08;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  window.setTimeout(() => {
    osc.stop();
    void ctx.close();
  }, 420);
}

function PitchPickGame({ onComplete }: GameProps) {
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const tones = useMemo(() => {
    const low = randInt(220, 340);
    const high = low + randInt(40, 120);
    return Math.random() > 0.5 ? [low, high] : [high, low];
  }, [round]);
  const higher = Math.max(tones[0], tones[1]);
  return (
    <Shell title="Pitch Pick" hint="Play both tones, then choose the higher one.">
      <div className="synapse-game-options">
        {tones.map((freq, i) => (
          <button
            key={`${round}-p-${i}`}
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => playTone(freq)}
          >
            Play {i === 0 ? 'A' : 'B'}
          </button>
        ))}
      </div>
      <div className="synapse-game-options">
        {tones.map((freq, i) => (
          <button
            key={`${round}-c-${i}`}
            type="button"
            className="synapse-btn synapse-btn-play"
            onClick={() => {
              const next = correct + (freq === higher ? 1 : 0);
              if (round + 1 >= 5) onComplete(next * 20);
              else {
                setCorrect(next);
                setRound(round + 1);
              }
            }}
          >
            {i === 0 ? 'A is higher' : 'B is higher'}
          </button>
        ))}
      </div>
    </Shell>
  );
}

function FollowGame({ onComplete }: GameProps) {
  const [seq, setSeq] = useState<number[]>([randInt(1, 4)]);
  const [input, setInput] = useState('');
  const [show, setShow] = useState(true);
  useEffect(() => {
    setShow(true);
    setInput('');
    const t = window.setTimeout(() => setShow(false), 900 + seq.length * 280);
    return () => window.clearTimeout(t);
  }, [seq]);
  return (
    <Shell title="Follow" hint="Memorize the digits, then type them.">
      <p className="synapse-game-seq" aria-live="polite">
        {show ? seq.join(' ') : '•'.repeat(seq.length)}
      </p>
      <input
        className="synapse-settings-input"
        inputMode="numeric"
        value={input}
        disabled={show}
        onChange={(event) => setInput(event.target.value.replace(/\D/g, '').slice(0, 8))}
        aria-label="Sequence"
      />
      <button
        type="button"
        className="synapse-btn synapse-btn-play"
        disabled={show}
        onClick={() => {
          if (input !== seq.join('')) {
            onComplete(Math.min(100, (seq.length - 1) * 20));
            return;
          }
          if (seq.length >= 5) onComplete(100);
          else setSeq([...seq, randInt(1, 4)]);
        }}
      >
        Check
      </button>
    </Shell>
  );
}

function PinpointGame({ onComplete, reducedMotion }: GameProps) {
  const [size, setSize] = useState(100);
  useEffect(() => {
    const step = reducedMotion ? 3 : 1.6;
    const id = window.setInterval(() => {
      setSize((s) => {
        if (s <= 8) {
          window.clearInterval(id);
          return 8;
        }
        return s - step;
      });
    }, 16);
    return () => window.clearInterval(id);
  }, [reducedMotion]);
  return (
    <Shell title="Pinpoint" hint="Tap the circle before it vanishes. Smaller is better.">
      <button
        type="button"
        className="synapse-game-target-btn"
        style={{ width: `${size}%`, paddingTop: `${Math.max(size * 0.4, 18)}%` }}
        onClick={() => onComplete(scoreFromError(100 - size, 8, 70))}
      >
        Tap
      </button>
    </Shell>
  );
}

function SwiftGame({ onComplete }: GameProps) {
  const [left, setLeft] = useState(Math.random() > 0.5);
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0);
  const [leftMs, setLeftMs] = useState(20000);
  const done = useRef(false);
  useEffect(() => {
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const remain = 20000 - (performance.now() - t0);
      setLeftMs(remain);
      if (remain <= 0) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (leftMs > 0 || done.current) return;
    done.current = true;
    onComplete(tries === 0 ? 0 : Math.round((hits / tries) * 100));
  }, [leftMs, hits, tries, onComplete]);
  return (
    <Shell title="Swift" hint="Tap Left or Right to match the prompt. 20 seconds.">
      <p aria-live="polite">{left ? 'LEFT' : 'RIGHT'} · {Math.max(0, Math.ceil(leftMs / 1000))}s</p>
      <div className="synapse-game-options">
        {([true, false] as const).map((isLeft) => (
          <button
            key={String(isLeft)}
            type="button"
            className="synapse-btn synapse-btn-play"
            onClick={() => {
              setHits((h) => h + (isLeft === left ? 1 : 0));
              setTries((t) => t + 1);
              setLeft(Math.random() > 0.5);
            }}
          >
            {isLeft ? 'Left' : 'Right'}
          </button>
        ))}
      </div>
    </Shell>
  );
}

export const GAME_COMPONENTS: Record<string, (props: GameProps) => ReactNode> = {
  pulse: (props) => <PulseGame {...props} />,
  echo: (props) => <EchoGame {...props} />,
  downbeat: (props) => <DownbeatGame {...props} />,
  nextnote: (props) => <NextNoteGame {...props} />,
  hold: (props) => <HoldGame {...props} />,
  oddpath: (props) => <OddPathGame {...props} />,
  match: (props) => <MatchGame {...props} />,
  pitchpick: (props) => <PitchPickGame {...props} />,
  follow: (props) => <FollowGame {...props} />,
  pinpoint: (props) => <PinpointGame {...props} />,
  swift: (props) => <SwiftGame {...props} />,
};

export const GAME_CATEGORIES: Record<string, GameCategory> = {
  pulse: 'reaction',
  echo: 'memory',
  downbeat: 'rhythm',
  nextnote: 'pattern',
  hold: 'timing',
  oddpath: 'logic',
  match: 'visual',
  pitchpick: 'audio',
  follow: 'sequence',
  pinpoint: 'precision',
  swift: 'speed',
};
