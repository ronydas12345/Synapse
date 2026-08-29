import { usePathStore } from './store';
import { useEffect, useRef, useCallback, useState } from 'react';
import type { Node } from '@xyflow/react';
import { buildPlaybackQueueResult, parseQueueKey } from './engine';
import {
  YouTubeIframeAdapter,
  extractYouTubeId,
  type PlayableMedia,
} from './playback';

function nodeToPlayable(node: Node | undefined, nodeId: string): PlayableMedia | null {
  if (!node) return null;
  const videoId = extractYouTubeId(String(node.data?.videoId || ''));
  if (!videoId) return null;

  const startTime = Number(node.data?.startTime) || 0;
  const endTime = Number(node.data?.endTime) || 0;
  const volume = node.data?.volume != null ? Number(node.data.volume) : 100;
  const speedPct = node.data?.speed != null ? Number(node.data.speed) : 100;

  return {
    videoId,
    startTime,
    endTime: endTime > startTime ? endTime : undefined,
    volume,
    playbackRate: speedPct / 100,
    nodeId,
  };
}

export default function Player() {
  const {
    nodes,
    edges,
    isPlaying,
    playbackQueue,
    currentTrackIndex,
    skipRequestId,
    setCurrentTrackIndex,
    setIsPlaying,
    setCurrentPlayingNodeId,
    setPlaybackQueue,
  } = usePathStore();

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [playerReady, setPlayerReady] = useState(false);

  const ytContainerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<YouTubeIframeAdapter | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const advancingRef = useRef(false);
  /** Mid-path session: pause keeps queue; finish/clear ends session. */
  const sessionActiveRef = useRef(false);
  /** Last queue key we started loading (not merely resumed). */
  const activeItemKeyRef = useRef<string | null>(null);
  const advanceRef = useRef<() => void>(() => {});

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current != null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopLocalAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.onended = null;
      audioElementRef.current.currentTime = 0;
    }
  };

  const advance = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    activeItemKeyRef.current = null;

    const state = usePathStore.getState();
    const { playbackQueue: queue, currentTrackIndex: index } = state;

    if (queue.length === 0) {
      state.setIsPlaying(false);
      state.setCurrentPlayingNodeId(null);
      advancingRef.current = false;
      return;
    }

    if (index < queue.length - 1) {
      state.setCurrentTrackIndex(index + 1);
    } else {
      sessionActiveRef.current = false;
      state.setIsPlaying(false);
      state.setCurrentTrackIndex(0);
      state.setCurrentPlayingNodeId(null);
      state.setPlaybackQueue([]);
      adapterRef.current?.stop();
      setStatusMessage('Path finished');
    }

    window.setTimeout(() => {
      advancingRef.current = false;
    }, 50);
  }, []);

  advanceRef.current = advance;

  // Skip button: stop current media first (kills stale YouTube ENDED), then advance once
  useEffect(() => {
    if (skipRequestId === 0) return;

    clearSilenceTimer();
    stopLocalAudio();
    adapterRef.current?.stop();
    activeItemKeyRef.current = null;
    advancingRef.current = false;

    const state = usePathStore.getState();
    if (state.playbackQueue.length === 0) return;

    if (!state.isPlaying) {
      state.setIsPlaying(true);
    }
    advanceRef.current();
  }, [skipRequestId]);

  // Mount YouTube once (do not recreate when callbacks change)
  useEffect(() => {
    const adapter = new YouTubeIframeAdapter();
    adapterRef.current = adapter;
    adapter.setOnEnded(() => advanceRef.current());
    adapter.setOnError((message) =>
      setStatusMessage(`${message} — skipping`)
    );

    let cancelled = false;
    const el = ytContainerRef.current;
    if (el) {
      adapter
        .ready(el)
        .then(() => {
          if (!cancelled) setPlayerReady(true);
        })
        .catch((err) => {
          if (!cancelled) {
            setStatusMessage(
              err instanceof Error ? err.message : 'YouTube player failed to load'
            );
          }
        });
    }

    return () => {
      cancelled = true;
      setPlayerReady(false);
      clearSilenceTimer();
      stopLocalAudio();
      adapter.destroy();
      adapterRef.current = null;
    };
  }, []);

  // Reset session flags when queue is cleared externally (e.g. Skip on last item)
  useEffect(() => {
    if (playbackQueue.length === 0) {
      sessionActiveRef.current = false;
      activeItemKeyRef.current = null;
    }
  }, [playbackQueue.length]);

  // Build queue when Play starts with an empty queue
  useEffect(() => {
    if (!isPlaying) return;
    if (playbackQueue.length > 0) return;

    const result = buildPlaybackQueueResult({ nodes, edges });
    const keys = result.items.map((item) => item.key);
    if (keys.length === 0) {
      setIsPlaying(false);
      setStatusMessage(
        result.haltReason === 'no_start'
          ? 'Nothing to play — add a Start node'
          : 'Nothing to play — connect tracks from Start'
      );
      return;
    }
    sessionActiveRef.current = true;
    activeItemKeyRef.current = null;
    setCurrentTrackIndex(0);
    setPlaybackQueue(keys);
    setStatusMessage(
      result.haltReason === 'max_queue' || result.haltReason === 'max_steps'
        ? 'Path truncated to prevent a runaway graph'
        : ''
    );
  }, [
    isPlaying,
    playbackQueue.length,
    nodes,
    edges,
    setPlaybackQueue,
    setIsPlaying,
    setCurrentTrackIndex,
  ]);

  // Pause without wiping queue; clear only when session ended
  useEffect(() => {
    if (isPlaying) return;

    clearSilenceTimer();
    stopLocalAudio();
    adapterRef.current?.pause();

    if (!sessionActiveRef.current) {
      activeItemKeyRef.current = null;
      if (playbackQueue.length > 0) {
        setPlaybackQueue([]);
        setCurrentTrackIndex(0);
        setCurrentPlayingNodeId(null);
      }
    }
  }, [
    isPlaying,
    playbackQueue.length,
    setPlaybackQueue,
    setCurrentTrackIndex,
    setCurrentPlayingNodeId,
  ]);

  // Drive / resume current queue item
  useEffect(() => {
    if (!isPlaying || playbackQueue.length === 0) return;

    const key = playbackQueue[currentTrackIndex];
    if (!key) return;

    // Same item after Pause → Resume
    if (activeItemKeyRef.current === key) {
      const parsedSame = parseQueueKey(key);
      if (parsedSame?.kind === 'track') {
        adapterRef.current?.resume();
        setStatusMessage((prev) => prev || 'Resumed');
      }
      return;
    }

    const parsed = parseQueueKey(key);
    if (!parsed) {
      advance();
      return;
    }

    const { kind, nodeId } = parsed;
    setCurrentPlayingNodeId(nodeId);
    clearSilenceTimer();
    stopLocalAudio();
    advancingRef.current = false;
    activeItemKeyRef.current = key;

    const node = nodes.find((n) => n.id === nodeId);

    if (kind === 'transition') {
      adapterRef.current?.stop();
      const tType = (node?.data?.type as string) || 'silence';

      if (tType === 'silence') {
        const ms = Math.max(0.1, Number(node?.data?.duration) || 1) * 1000;
        setStatusMessage(`Silence (${(ms / 1000).toFixed(1)}s)`);
        silenceTimerRef.current = window.setTimeout(() => advance(), ms);
        return () => clearSilenceTimer();
      }

      if (tType === 'audio' && node?.data?.audioFile) {
        setStatusMessage('Playing transition audio');
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
        }
        const audio = audioElementRef.current;
        audio.src = String(node.data.audioFile);
        audio.onended = () => advance();
        audio.play().catch(() => {
          setStatusMessage('Transition audio failed — skipping');
          advance();
        });
        return () => stopLocalAudio();
      }

      const media = nodeToPlayable(node, nodeId);
      if (media && adapterRef.current && playerReady) {
        setStatusMessage('Playing transition');
        adapterRef.current.play(media).catch(() => {
          setStatusMessage('Transition video failed — skipping');
          advance();
        });
        return;
      }

      setStatusMessage('Empty transition — skipping');
      silenceTimerRef.current = window.setTimeout(() => advance(), 400);
      return () => clearSilenceTimer();
    }

    const media = nodeToPlayable(node, nodeId);
    if (!media) {
      setStatusMessage('Track missing video ID — skipping');
      silenceTimerRef.current = window.setTimeout(() => advance(), 400);
      return () => clearSilenceTimer();
    }

    if (!adapterRef.current || !playerReady) {
      // Allow retry when player becomes ready
      activeItemKeyRef.current = null;
      setStatusMessage('Waiting for YouTube player…');
      return;
    }

    const title =
      (node?.data?.songTitle as string) ||
      (node?.data?.label as string) ||
      media.videoId;
    setStatusMessage(`Playing: ${title}`);

    let cancelled = false;
    adapterRef.current.play(media).catch(() => {
      if (!cancelled) {
        setStatusMessage('Playback failed — skipping');
        window.setTimeout(() => advance(), 400);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    isPlaying,
    playbackQueue,
    currentTrackIndex,
    nodes,
    playerReady,
    advance,
    setCurrentPlayingNodeId,
  ]);

  const currentNode = (() => {
    const key = playbackQueue[currentTrackIndex];
    const parsed = key ? parseQueueKey(key) : null;
    if (!parsed) return null;
    return nodes.find((n) => n.id === parsed.nodeId) ?? null;
  })();

  const displayTitle =
    (currentNode?.data?.songTitle as string) ||
    (currentNode?.data?.label as string) ||
    (currentNode?.data?.videoId as string) ||
    '';
  const displayArtist = (currentNode?.data?.artist as string) || '';

  return (
    <div className="synapse-deck">
      <div
        ref={ytContainerRef}
        className="synapse-deck-screen"
        aria-label="YouTube player"
      />
      <div className="synapse-deck-meta">
        <p className="synapse-deck-title">
          {displayTitle || (isPlaying ? 'Starting…' : 'Ready')}
        </p>
        {displayArtist ? (
          <p className="synapse-deck-sub">{displayArtist}</p>
        ) : null}
        <p className="synapse-deck-status">
          {statusMessage ||
            (playerReady ? 'YouTube player ready' : 'Loading YouTube player…')}
        </p>
        {playbackQueue.length > 0 ? (
          <div className="synapse-deck-queue">
            Queue {currentTrackIndex + 1} / {playbackQueue.length}
          </div>
        ) : null}
      </div>
    </div>
  );
}
