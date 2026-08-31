import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioWaveform } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  mediaElement: HTMLAudioElement | null;
}

type DisplayMediaExtra = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: string;
  systemAudio?: string;
};

async function captureTabAudio(): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { width: 16, height: 16, frameRate: 1 },
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    systemAudio: 'include',
  } as DisplayMediaExtra);

  for (const track of stream.getVideoTracks()) {
    track.stop();
    stream.removeTrack(track);
  }

  if (stream.getAudioTracks().length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('Share this tab and turn on audio');
  }

  return stream;
}

/**
 * Frequency bars from a real AnalyserNode.
 * YouTube iframes block CORS audio tap, so YouTube uses tab-audio capture
 * (the same mix the speakers play). Local HTMLAudioElement connects directly.
 */
export default function AudioVisualizer({
  isPlaying,
  mediaElement,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const elementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);

  const ensureGraph = useCallback(async () => {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctxRef.current) {
      ctxRef.current = new Ctx();
      const analyser = ctxRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      analyserRef.current = analyser;
    }
    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume();
    }
    return { ctx: ctxRef.current, analyser: analyserRef.current! };
  }, []);

  const detachSource = useCallback(() => {
    try {
      sourceRef.current?.disconnect();
    } catch {
      // already disconnected
    }
    sourceRef.current = null;
  }, []);

  const attachStream = useCallback(
    async (stream: MediaStream) => {
      const { ctx, analyser } = await ensureGraph();
      detachSource();
      const source = ctx.createMediaStreamSource(stream);
      try {
        analyser.disconnect();
      } catch {
        // not connected
      }
      source.connect(analyser);
      sourceRef.current = source;
      streamRef.current = stream;
      setListening(true);
      setError('');
    },
    [detachSource, ensureGraph]
  );

  const enableCapture = useCallback(async () => {
    try {
      setError('');
      const stream = await captureTabAudio();
      stream.getAudioTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          setListening(false);
          streamRef.current = null;
        });
      });
      await attachStream(stream);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not capture tab audio';
      setError(
        message.toLowerCase().includes('denied') ||
          message.toLowerCase().includes('not allowed')
          ? 'Permission denied'
          : message
      );
      setListening(false);
    }
  }, [attachStream]);

  useEffect(() => {
    if (!mediaElement) return;
    let cancelled = false;
    void (async () => {
      try {
        const { ctx, analyser } = await ensureGraph();
        if (cancelled) return;
        detachSource();
        if (!elementSourceRef.current || elementSourceRef.current.mediaElement !== mediaElement) {
          elementSourceRef.current = ctx.createMediaElementSource(mediaElement);
        }
        elementSourceRef.current.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = elementSourceRef.current;
        setListening(true);
      } catch {
        // createMediaElementSource throws if called twice on the same element
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mediaElement, detachSource, ensureGraph]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gfx = canvas.getContext('2d');
    if (!gfx) return;

    const bins = new Uint8Array(128);
    const draw = () => {
      rafRef.current = window.requestAnimationFrame(draw);
      const analyser = analyserRef.current;
      if (analyser && listening) {
        analyser.getByteFrequencyData(bins);
      } else {
        bins.fill(0);
      }

      const { width, height } = canvas;
      gfx.clearRect(0, 0, width, height);
      gfx.fillStyle = 'rgba(8, 10, 16, 0.92)';
      gfx.fillRect(0, 0, width, height);

      const barCount = 28;
      const gap = 3;
      const barW = (width - gap * (barCount + 1)) / barCount;
      const step = Math.max(1, Math.floor(bins.length / barCount));

      for (let i = 0; i < barCount; i++) {
        const value = listening && isPlaying ? bins[i * step] ?? 0 : 0;
        const h = Math.max(2, (value / 255) * (height - 8));
        const x = gap + i * (barW + gap);
        const y = height - h - 4;
        const t = i / barCount;
        gfx.fillStyle = `rgba(${Math.round(62 + t * 170)}, ${Math.round(207 - t * 40)}, ${Math.round(191 - t * 80)}, 0.92)`;
        if (typeof gfx.roundRect === 'function') {
          gfx.beginPath();
          gfx.roundRect(x, y, barW, h, 2);
          gfx.fill();
        } else {
          gfx.fillRect(x, y, barW, h);
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, listening]);

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(rafRef.current);
      detachSource();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxRef.current?.close();
    };
  }, [detachSource]);

  return (
    <div className="synapse-visualizer">
      <canvas ref={canvasRef} className="synapse-visualizer-canvas" />
      {!listening ? (
        <button
          type="button"
          className="synapse-visualizer-arm"
          onClick={() => void enableCapture()}
        >
          <AudioWaveform className="w-4 h-4" />
          <span>
            {error ||
              (isPlaying
                ? 'Click to visualize this tab’s audio'
                : 'Visualizer — click when playing')}
          </span>
        </button>
      ) : null}
    </div>
  );
}
