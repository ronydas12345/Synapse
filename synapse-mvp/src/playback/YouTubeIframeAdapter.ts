import type { PlaybackAdapter, PlayableMedia } from './types';

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: Record<string, unknown>
      ) => YtPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YtPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  cueVideoById(args: {
    videoId: string;
    startSeconds?: number;
    endSeconds?: number;
  }): void;
  loadVideoById(args: {
    videoId: string;
    startSeconds?: number;
    endSeconds?: number;
  }): void;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  destroy(): void;
  getPlayerState(): number;
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API requires a browser'));
  }
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (window.YT?.Player) resolve();
    };

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      finish();
    };

    if (window.YT?.Player) {
      resolve();
      return;
    }

    if (!document.querySelector('script[data-synapse-yt]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.dataset.synapseYt = '1';
      tag.onerror = () => {
        apiPromise = null;
        reject(new Error('Failed to load YouTube IFrame API'));
      };
      document.head.appendChild(tag);
    }

    let tries = 0;
    const poll = window.setInterval(() => {
      tries += 1;
      if (window.YT?.Player) {
        window.clearInterval(poll);
        resolve();
      } else if (tries > 100) {
        window.clearInterval(poll);
        apiPromise = null;
        reject(new Error('Timed out loading YouTube IFrame API'));
      }
    }, 100);
  });

  return apiPromise;
}

function clampVolume(volume?: number): number {
  const pct = volume ?? 100;
  return Math.max(0, Math.min(100, Math.round(pct > 100 ? pct / 2 : pct)));
}

function clampRate(rate?: number): number {
  if (rate == null) return 1;
  return Math.max(0.25, Math.min(2, rate));
}

/**
 * YouTube IFrame Player API adapter.
 * Mount into a dedicated host element that React will not reconcile away.
 */
export class YouTubeIframeAdapter implements PlaybackAdapter {
  private player: YtPlayer | null = null;
  private host: HTMLElement | null = null;
  private mountEl: HTMLDivElement | null = null;
  private onEnded: (() => void) | null = null;
  private onError: ((message: string) => void) | null = null;
  private readyPromise: Promise<void> | null = null;
  /** Bumped on every play/stop so stale ENDED events cannot skip the next track. */
  private playSession = 0;
  private ignoreEnded = false;
  private hasStarted = false;
  private suppressTimer: number | null = null;

  setOnEnded(cb: (() => void) | null): void {
    this.onEnded = cb;
  }

  setOnError(cb: ((message: string) => void) | null): void {
    this.onError = cb;
  }

  private bumpSessionAndSuppress(ms = 1200): number {
    this.playSession += 1;
    this.ignoreEnded = true;
    this.hasStarted = false;
    if (this.suppressTimer != null) {
      window.clearTimeout(this.suppressTimer);
    }
    const session = this.playSession;
    this.suppressTimer = window.setTimeout(() => {
      if (this.playSession === session) {
        this.ignoreEnded = false;
      }
    }, ms);
    return session;
  }

  private emitEndedForSession(session: number): void {
    queueMicrotask(() => {
      if (this.playSession !== session) return;
      if (this.ignoreEnded) return;
      this.onEnded?.();
    });
  }

  async ready(container: HTMLElement): Promise<void> {
    this.host = container;
    await loadYouTubeApi();

    if (this.player) return;

    if (!this.readyPromise) {
      this.readyPromise = new Promise<void>((resolve, reject) => {
        try {
          container.innerHTML = '';
          const mount = document.createElement('div');
          mount.style.width = '100%';
          mount.style.height = '100%';
          container.appendChild(mount);
          this.mountEl = mount;

          this.player = new window.YT!.Player(mount, {
            height: '100%',
            width: '100%',
            playerVars: {
              autoplay: 0,
              controls: 1,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              enablejsapi: 1,
              origin: window.location.origin,
            },
            events: {
              onReady: () => resolve(),
              onStateChange: (event: { data: number }) => {
                // ENDED = 0
                if (event.data === 0) {
                  if (this.ignoreEnded) return;
                  if (!this.hasStarted) return;
                  const session = this.playSession;
                  this.hasStarted = false;
                  this.emitEndedForSession(session);
                }
                // PLAYING = 1
                if (event.data === 1) {
                  this.hasStarted = true;
                  this.ignoreEnded = false;
                }
              },
              onError: (event: { data: number }) => {
                const code = event.data;
                const messages: Record<number, string> = {
                  2: 'Invalid YouTube video ID',
                  5: 'HTML5 player error',
                  100: 'Video not found or private',
                  101: 'Embedding disabled by owner',
                  150: 'Embedding disabled by owner',
                };
                const session = this.playSession;
                this.onError?.(messages[code] ?? `YouTube error ${code}`);
                this.hasStarted = false;
                // Only auto-advance for the active session
                this.emitEndedForSession(session);
              },
            },
          });
        } catch (err) {
          this.readyPromise = null;
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    }

    await this.readyPromise;
  }

  async play(media: PlayableMedia): Promise<void> {
    if (!this.host) {
      throw new Error('YouTube adapter not ready — call ready(container) first');
    }
    await this.ready(this.host);
    if (!this.player) throw new Error('YouTube player missing');

    // Invalidate any ENDED from the previous video before loading the next
    this.bumpSessionAndSuppress(1500);

    const startSeconds = Math.max(0, media.startTime ?? 0);
    const endSeconds =
      media.endTime && media.endTime > startSeconds ? media.endTime : undefined;

    this.player.loadVideoById({
      videoId: media.videoId,
      startSeconds,
      ...(endSeconds != null ? { endSeconds } : {}),
    });
    this.player.setVolume(clampVolume(media.volume));
    try {
      this.player.setPlaybackRate(clampRate(media.playbackRate));
    } catch {
      // Some videos reject non-1 rates
    }
    this.player.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  resume(): void {
    this.player?.playVideo();
  }

  stop(): void {
    this.bumpSessionAndSuppress(1500);
    try {
      this.player?.stopVideo();
    } catch {
      // ignore
    }
  }

  destroy(): void {
    this.onEnded = null;
    this.onError = null;
    if (this.suppressTimer != null) {
      window.clearTimeout(this.suppressTimer);
      this.suppressTimer = null;
    }
    try {
      this.player?.destroy();
    } catch {
      // ignore
    }
    this.player = null;
    this.readyPromise = null;
    this.mountEl = null;
    if (this.host) {
      this.host.innerHTML = '';
    }
    this.host = null;
  }
}
