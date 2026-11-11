import {
  Dice5,
  GitBranch,
  Music,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../../site/motion';

function RackRow({
  icon,
  title,
  hint,
  active,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  active?: boolean;
}) {
  return (
    <div className={`synapse-how-rack-item${active ? ' is-active' : ''}`}>
      <span className="synapse-how-rack-icon">{icon}</span>
      <span className="synapse-how-rack-copy">
        <strong>{title}</strong>
        <em>{hint}</em>
      </span>
      <Plus className="synapse-how-rack-plus" />
    </div>
  );
}

function SceneAddTrack() {
  return (
    <div className="synapse-how-add">
      <div className="synapse-how-rack">
        <p className="synapse-how-kicker">Module rack</p>
        <p className="synapse-how-rack-heading">Nodes</p>
        <RackRow icon={<Play />} title="Start Node" hint="Drag or click" />
        <RackRow icon={<Music />} title="Track Node" hint="Drag or click" active />
        <RackRow icon={<GitBranch />} title="Conditional" hint="Drag or click" />
        <RackRow icon={<Dice5 />} title="Randomizer/Sequence" hint="Drag or click" />
      </div>
      <div className="synapse-how-inspector">
        <p className="synapse-how-kicker">Track</p>
        <p className="synapse-how-field-label">YouTube Video ID or URL</p>
        <div className="synapse-how-field">
          <Music />
          <span>youtube.com/watch?v=nightdrive</span>
        </div>
        <div className="synapse-how-chip">Add track</div>
        <ul className="synapse-how-results">
          <li className="is-selected">
            <span>Night Drive</span>
            <em>Analog Echoes</em>
          </li>
          <li>
            <span>Glass Harbor</span>
            <em>Low Tide</em>
          </li>
          <li>
            <span>Midnight Static</span>
            <em>Signal Lost</em>
          </li>
        </ul>
      </div>
    </div>
  );
}

function SceneConnect() {
  return (
    <div className="synapse-how-connect">
      <div className="synapse-how-node is-start">
        <span>Start</span>
        <strong>Start</strong>
        <i className="synapse-how-port is-out" />
      </div>
      <div className="synapse-how-wire is-set" />
      <div className="synapse-how-node is-track is-lit">
        <span>Track</span>
        <strong>Night Drive</strong>
        <i className="synapse-how-port is-in" />
        <i className="synapse-how-port is-out" />
      </div>
      <div className="synapse-how-wire is-drawing">
        <span className="synapse-how-cursor" />
      </div>
      <div className="synapse-how-node is-randomizer">
        <span>Randomizer</span>
        <strong>Pool</strong>
        <i className="synapse-how-port is-in" />
      </div>
    </div>
  );
}

function ScenePersonality() {
  return (
    <div className="synapse-how-personality">
      <div className="synapse-how-node is-randomizer is-lit">
        <span>Randomizer</span>
        <strong>Pool</strong>
      </div>
      <div className="synapse-how-inspector">
        <p className="synapse-how-kicker">Randomizer</p>
        <p className="synapse-how-field-label">Playback Mode</p>
        <div className="synapse-how-field synapse-how-select">
          <span>Randomizer</span>
        </div>
        <p className="synapse-how-field-label">Tracks &amp; Weights</p>
        <div className="synapse-how-weight">
          <span>Night Drive</span>
          <b>60%</b>
          <i style={{ width: '60%' }} />
        </div>
        <div className="synapse-how-weight">
          <span>Glass Harbor</span>
          <b>40%</b>
          <i style={{ width: '40%' }} />
        </div>
        <p className="synapse-how-field-label">Theme</p>
        <div className="synapse-how-swatches">
          <i className="is-void is-active" />
          <i className="is-teal" />
          <i className="is-warm" />
        </div>
      </div>
    </div>
  );
}

function ScenePlay() {
  return (
    <div className="synapse-how-play">
      <p className="synapse-how-kicker">Now playing</p>
      <p className="synapse-how-track-title">Night Drive</p>
      <p className="synapse-how-track-artist">Analog Echoes</p>
      <div className="synapse-how-transport">
        <span className="synapse-how-ctrl">
          <SkipBack />
        </span>
        <span className="synapse-how-ctrl is-play">
          <Pause />
        </span>
        <span className="synapse-how-ctrl">
          <SkipForward />
        </span>
      </div>
      <div className="synapse-how-progress">
        <em>1:12</em>
        <span>
          <i className="synapse-how-progress-fill" />
        </span>
        <em>3:48</em>
      </div>
      <p className="synapse-how-next">
        Next from path <strong>Glass Harbor</strong>
      </p>
    </div>
  );
}

const SCENES = [SceneAddTrack, SceneConnect, ScenePersonality, ScenePlay] as const;

export default function HowItWorksScene({
  step,
  label,
}: {
  step: number;
  label: string;
}) {
  const reduced = usePrefersReducedMotion();
  const Scene = SCENES[step] ?? SceneAddTrack;

  return (
    <div
      className={`synapse-mkt-how-scene${reduced ? '' : ' is-motion'}`}
      role="img"
      aria-label={label}
    >
      <div aria-hidden="true">
        <Scene />
      </div>
    </div>
  );
}
