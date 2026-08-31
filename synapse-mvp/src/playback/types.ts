export interface PlayableMedia {
  videoId: string;
  /** Seconds from start of video. */
  startTime?: number;
  /** Absolute end second; 0 / omitted = play to natural end. */
  endTime?: number;
  /** 0–100 YouTube volume scale (clamped). */
  volume?: number;
  /** Playback rate 0.25–2; mapped from speed % elsewhere. */
  playbackRate?: number;
  nodeId: string;
}

export interface PlaybackAdapter {
  /** Mount / ensure player exists inside container. */
  ready(container: HTMLElement): Promise<void>;
  play(media: PlayableMedia): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  destroy(): void;
  getCurrentTime?(): number;
  getDuration?(): number;
  seekTo?(seconds: number): void;
  seekBy?(delta: number, start?: number, end?: number): void;
  setOnEnded(cb: (() => void) | null): void;
  setOnError(cb: ((message: string) => void) | null): void;
}
