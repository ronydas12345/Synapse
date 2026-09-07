import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioWaveform, ChevronDown, Mic, Monitor } from 'lucide-react';
import {
  browserCaptureProfile,
  capturePlaybackAudio,
  type CaptureMode,
} from '../playback/captureAudio';
import {
  mapSpectrumBars,
  VISUALIZER_BAR_COUNT,
  VISUALIZER_FFT_SIZE,
} from '../playback/spectrumBars';
import { cssToRgb, lerpRgb, rgba } from '../theme/color';

interface AudioVisualizerProps {
  isPlaying: boolean;
  mediaElement: HTMLAudioElement | null;
}

/**
 * Frequency bars from a real AnalyserNode.
 * YouTube iframes block CORS audio tap. Chromium can share tab audio;
 * Firefox/Safari fall back to the microphone. Collapse the in-app
 * sharing message; Stop ends capture so the browser sharing bar goes away.
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
  const [captureMode, setCaptureMode] = useState<CaptureMode | null>(null);
  const [statusCollapsed, setStatusCollapsed] = useState(false);
  const profile = browserCaptureProfile();

  const ensureGraph = useCallback(async () => {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctxRef.current) {
      ctxRef.current = new Ctx();
      const analyser = ctxRef.current.createAnalyser();
      analyser.fftSize = VISUALIZER_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.55;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -28;
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

  const stopCapture = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    detachSource();
    setListening(false);
    setCaptureMode(null);
    setStatusCollapsed(false);
  }, [detachSource]);

  const attachStream = useCallback(
    async (stream: MediaStream, mode: CaptureMode) => {
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
      setCaptureMode(mode);
      setStatusCollapsed(false);
      setError('');
    },
    [detachSource, ensureGraph]
  );

  const enableCapture = useCallback(
    async (mode: CaptureMode) => {
      try {
        setError('');
        const stream = await capturePlaybackAudio(mode);
        stream.getAudioTracks().forEach((track) => {
          track.addEventListener('ended', () => {
            setListening(false);
            setCaptureMode(null);
            streamRef.current = null;
          });
        });
        await attachStream(stream, mode);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not start visualizer';
        const denied =
          message.toLowerCase().includes('denied') ||
          message.toLowerCase().includes('not allowed');
        setError(denied ? 'Permission denied' : message);
        setListening(false);
      }
    },
    [attachStream]
  );

  useEffect(() => {
    if (!mediaElement) return;
    let cancelled = false;
    void (async () => {
      try {
        const { ctx, analyser } = await ensureGraph();
        if (cancelled) return;
        detachSource();
        if (
          !elementSourceRef.current ||
          elementSourceRef.current.mediaElement !== mediaElement
        ) {
          elementSourceRef.current = ctx.createMediaElementSource(mediaElement);
        }
        elementSourceRef.current.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = elementSourceRef.current;
        setListening(true);
        setCaptureMode(null);
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

    const analyser = analyserRef.current;
    const bins = new Uint8Array(analyser?.frequencyBinCount ?? 1024);
    const draw = () => {
      rafRef.current = window.requestAnimationFrame(draw);
      const an = analyserRef.current;
      if (an && listening) {
        if (bins.length !== an.frequencyBinCount) {
          // analyser fft size changed
        }
        an.getByteFrequencyData(bins);
      } else {
        bins.fill(0);
      }

      const { width, height } = canvas;
      const theme = getComputedStyle(canvas);
      const bg = cssToRgb(
        theme.getPropertyValue('--player-bg') || theme.getPropertyValue('--bg-deep'),
        '#080a10'
      );
      const accent = cssToRgb(theme.getPropertyValue('--accent'), '#3ecfbf');
      const warm = cssToRgb(theme.getPropertyValue('--accent-warm'), '#e8a45c');
      gfx.clearRect(0, 0, width, height);
      gfx.fillStyle = rgba(bg, 0.92);
      gfx.fillRect(0, 0, width, height);

      const sampleRate = an?.context.sampleRate || 44100;
      const fftSize = an?.fftSize || VISUALIZER_FFT_SIZE;
      const bars = mapSpectrumBars(bins, VISUALIZER_BAR_COUNT, sampleRate, fftSize);
      const gap = 3;
      const barW = (width - gap * (VISUALIZER_BAR_COUNT + 1)) / VISUALIZER_BAR_COUNT;

      for (let i = 0; i < VISUALIZER_BAR_COUNT; i++) {
        const value = listening && isPlaying ? bars[i] ?? 0 : 0;
        const h = Math.max(2, (value / 255) * (height - 8));
        const x = gap + i * (barW + gap);
        const y = height - h - 4;
        const t = i / Math.max(1, VISUALIZER_BAR_COUNT - 1);
        gfx.fillStyle = rgba(lerpRgb(accent, warm, t), 0.92);
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
      stopCapture();
      void ctxRef.current?.close();
    };
  }, [stopCapture]);

    const shareLabel =
    captureMode === 'microphone'
      ? 'Listening via microphone'
      : 'Sharing tab audio with Synapse';

  return (
    <div className="synapse-visualizer">
      <canvas ref={canvasRef} className="synapse-visualizer-canvas" />
      {listening && captureMode && !statusCollapsed ? (
        <div className="synapse-share-status">
          <span className="synapse-share-status-text">{shareLabel}</span>
          <button
            type="button"
            className="synapse-share-status-btn"
            title="Collapse this message"
            aria-label="Collapse sharing message"
            onClick={() => setStatusCollapsed(true)}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="synapse-share-status-btn"
            title="Stop sharing (also hides the browser sharing bar)"
            aria-label="Stop sharing"
            onClick={stopCapture}
          >
            Stop
          </button>
        </div>
      ) : null}
      {listening && captureMode && statusCollapsed ? (
        <button
          type="button"
          className="synapse-share-status is-chip"
          title="Show sharing message"
          onClick={() => setStatusCollapsed(false)}
        >
          Sharing
        </button>
      ) : null}
      {!listening ? (
        <div className="synapse-visualizer-arm">
          <AudioWaveform className="w-4 h-4" />
          <span>
            {error ||
              (isPlaying
                ? profile.label
                : 'Visualizer — start playback, then connect audio')}
          </span>
          <div className="synapse-visualizer-actions">
            <button
              type="button"
              className="synapse-ctrl synapse-ctrl-seek"
              onClick={() => void enableCapture('display')}
            >
              <Monitor className="w-3.5 h-3.5" />
              {profile.preferMic ? 'Window' : 'Tab'}
            </button>
            <button
              type="button"
              className="synapse-ctrl synapse-ctrl-seek"
              onClick={() => void enableCapture('microphone')}
            >
              <Mic className="w-3.5 h-3.5" />
              Mic
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
