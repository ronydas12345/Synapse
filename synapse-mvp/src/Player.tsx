import { usePathStore } from './store';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { Node } from '@xyflow/react';
import { buildPlaybackQueueResult, parseQueueKey } from './engine';
import {
  YouTubeIframeAdapter,
  extractYouTubeId,
  clampSeek,
  type PlayableMedia,
} from './playback';
import { getTrackDisplayMeta } from './trackMetadata';
import { clampTrackTimes } from './playback/trackTimes';
import DeckTransport from './components/DeckTransport';
import AudioVisualizer from './components/AudioVisualizer';
import PlayingScreen from './components/PlayingScreen';
import { buildListenRows } from './listenPath';
import { useProfileStore } from './profile/profileStore';

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
    previousRequestId,
    setCurrentTrackIndex,
    setIsPlaying,
    setCurrentPlayingNodeId,
    setPlaybackQueue,
    requestSkip,
    requestPrevious,
    updateNodeData,
    playbackOriginRequestId,
    uiMode,
    selectedPlaybackStartNodeId,
    setPlaybackStartNode,
  } = usePathStore();

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [playerReady, setPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vizAudio, setVizAudio] = useState<HTMLAudioElement | null>(null);

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
    setVizAudio(null);
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

  useEffect(() => {
    if (previousRequestId === 0) return;

    const state = usePathStore.getState();
    if (state.playbackQueue.length === 0) return;

    const key = state.playbackQueue[state.currentTrackIndex];
    const parsed = key ? parseQueueKey(key) : null;
    const node = parsed
      ? state.nodes.find((n) => n.id === parsed.nodeId)
      : undefined;
    const start = Number(node?.data?.startTime) || 0;
    const audio = audioElementRef.current;
    const current = audio?.src
      ? audio.currentTime
      : adapterRef.current?.getCurrentTime() ?? 0;

    if (current - start > 3 || state.currentTrackIndex <= 0) {
      if (audio?.src) {
        audio.currentTime = start;
        setCurrentTime(start);
      } else {
        adapterRef.current?.seekTo(start);
        setCurrentTime(start);
      }
      return;
    }

    clearSilenceTimer();
    stopLocalAudio();
    adapterRef.current?.stop();
    activeItemKeyRef.current = null;
    advancingRef.current = false;
    if (!state.isPlaying) state.setIsPlaying(true);
    state.setCurrentTrackIndex(state.currentTrackIndex - 1);
  }, [previousRequestId]);

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

    const startNodeId =
      usePathStore.getState().selectedPlaybackStartNodeId ?? undefined;
    const result = buildPlaybackQueueResult({ nodes, edges }, { startNodeId });
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

  // Marker drop: rebuild origin. Playing → restart; paused → stay paused; stopped → remember only.
  useEffect(() => {
    if (playbackOriginRequestId === 0) return;

    const state = usePathStore.getState();
    const startId = state.selectedPlaybackStartNodeId;
    if (!startId) return;

    clearSilenceTimer();
    stopLocalAudio();
    adapterRef.current?.stop();
    activeItemKeyRef.current = null;
    advancingRef.current = false;

    if (!state.isPlaying && !sessionActiveRef.current) {
      return;
    }

    const result = buildPlaybackQueueResult(
      { nodes: state.nodes, edges: state.edges },
      { startNodeId: startId }
    );
    const keys = result.items.map((item) => item.key);
    const first = keys[0] ? parseQueueKey(keys[0]) : null;

    sessionActiveRef.current = keys.length > 0 ? true : sessionActiveRef.current;
    state.setCurrentTrackIndex(0);
    state.setPlaybackQueue(keys);
    state.setCurrentPlayingNodeId(first?.nodeId ?? (keys.length > 0 ? startId : null));
    setStatusMessage(
      result.haltReason === 'max_queue' || result.haltReason === 'max_steps'
        ? 'Path truncated to prevent a runaway graph'
        : keys.length === 0
          ? 'Nothing to play from that node'
          : state.isPlaying
            ? 'Starting from selected node'
            : 'Start position updated'
    );
  }, [playbackOriginRequestId]);

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

    if (!node) {
      setStatusMessage(kind === 'transition' ? 'Transition missing — skipping' : 'Track missing — skipping');
      silenceTimerRef.current = window.setTimeout(() => advance(), 400);
      return () => clearSilenceTimer();
    }

    if (kind === 'track') {
      useProfileStore.getState().recordListen();
    }

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
        setVizAudio(audio);
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

    const title = getTrackDisplayMeta(node?.data).title || media.videoId;
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

  useEffect(() => {
    const tick = () => {
      const audio = audioElementRef.current;
      if (audio?.src && !Number.isNaN(audio.duration)) {
        setCurrentTime(audio.currentTime);
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        return;
      }
      const adapter = adapterRef.current;
      if (!adapter) return;
      setCurrentTime(adapter.getCurrentTime());
      setDuration(adapter.getDuration());
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [isPlaying, currentTrackIndex, playerReady]);

  const currentParsed = (() => {
    const key = playbackQueue[currentTrackIndex];
    return key ? parseQueueKey(key) : null;
  })();
  const currentNode = currentParsed
    ? nodes.find((n) => n.id === currentParsed.nodeId) ?? null
    : null;
  const currentNodeId = currentNode?.id;
  const nodeStartTime = Number(currentNode?.data?.startTime) || 0;
  const nodeEndTime = Number(currentNode?.data?.endTime) || 0;
  const storedDuration = Number(currentNode?.data?.duration) || 0;

  useEffect(() => {
    if (currentParsed?.kind !== 'track' || !currentNodeId) return;
    if (!(duration > 0)) return;
    const clamped = clampTrackTimes(nodeStartTime, nodeEndTime, duration);
    const durationDrift = Math.abs(storedDuration - duration) > 0.5;
    const startDrift = Math.abs(clamped.startTime - nodeStartTime) > 0.05;
    const endDrift =
      nodeEndTime > 0 && Math.abs((clamped.endTime || 0) - nodeEndTime) > 0.05;
    if (!durationDrift && !startDrift && !endDrift) return;
    updateNodeData(currentNodeId, {
      duration,
      startTime: clamped.startTime,
      ...(nodeEndTime > 0 ? { endTime: clamped.endTime } : {}),
    });
  }, [
    duration,
    currentParsed?.kind,
    currentNodeId,
    nodeStartTime,
    nodeEndTime,
    storedDuration,
    updateNodeData,
  ]);

  const nowPlaying =
    currentParsed?.kind === 'transition'
      ? {
          title: 'Transition',
          artist: String(currentNode?.data?.type || 'silence'),
          album: '',
        }
      : currentNode
        ? getTrackDisplayMeta(currentNode.data)
        : null;

  const seekStart = Number(currentNode?.data?.startTime) || 0;
  const seekEnd = Number(currentNode?.data?.endTime) || 0;
  const queueActive = playbackQueue.length > 0;
  const listen = uiMode === 'listen';

  const previewQueue = useMemo(() => {
    if (playbackQueue.length > 0) return playbackQueue;
    const startNodeId = selectedPlaybackStartNodeId ?? undefined;
    return buildPlaybackQueueResult({ nodes, edges }, { startNodeId }).items.map(
      (item) => item.key
    );
  }, [playbackQueue, nodes, edges, selectedPlaybackStartNodeId]);

  const listenRows = useMemo(
    () =>
      buildListenRows({
        nodes,
        edges,
        queue: previewQueue,
        currentIndex: playbackQueue.length > 0 ? currentTrackIndex : -1,
      }),
    [nodes, edges, previewQueue, playbackQueue.length, currentTrackIndex]
  );

  const handleSeekBy = (delta: number) => {
    const audio = audioElementRef.current;
    if (audio?.src) {
      audio.currentTime = clampSeek(
        audio.currentTime,
        delta,
        audio.duration || 0,
        seekStart,
        seekEnd
      );
      setCurrentTime(audio.currentTime);
      return;
    }
    adapterRef.current?.seekBy(delta, seekStart, seekEnd);
    setCurrentTime(adapterRef.current?.getCurrentTime() ?? 0);
  };

  const handleSeekTo = (seconds: number) => {
    const audio = audioElementRef.current;
    if (audio?.src) {
      audio.currentTime = seconds;
      setCurrentTime(seconds);
      return;
    }
    adapterRef.current?.seekTo(seconds);
    setCurrentTime(seconds);
  };

  return (
    <div className={`synapse-deck ${listen ? 'is-listen' : ''}`}>
      <div
        ref={ytContainerRef}
        className="synapse-deck-screen"
        aria-label="YouTube player"
      />
      {listen ? (
        <PlayingScreen
          nowPlaying={nowPlaying}
          isPlaying={isPlaying}
          queueActive={queueActive}
          currentTime={currentTime}
          duration={duration}
          statusMessage={statusMessage}
          queueLabel={
            queueActive
              ? `Queue ${currentTrackIndex + 1} / ${playbackQueue.length}`
              : ''
          }
          pathHeading="Playlist"
          rows={listenRows}
          vizAudio={vizAudio}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onPrevious={() => requestPrevious()}
          onNext={() => requestSkip()}
          onSeekBy={handleSeekBy}
          onSeekTo={handleSeekTo}
          onJump={(id) => setPlaybackStartNode(id)}
        />
      ) : (
        <>
          <div className="synapse-deck-main">
            <div className="synapse-deck-meta">
              <p className="synapse-deck-title">
                {nowPlaying?.title || (isPlaying ? 'Starting…' : 'Ready')}
              </p>
              {nowPlaying && currentParsed?.kind === 'track' ? (
                <>
                  <p
                    className={`synapse-deck-sub ${nowPlaying.artist ? '' : 'is-empty'}`}
                  >
                    {nowPlaying.artist || 'No artist'}
                  </p>
                  <p
                    className={`synapse-deck-album ${nowPlaying.album ? '' : 'is-empty'}`}
                  >
                    {nowPlaying.album || 'No album'}
                  </p>
                </>
              ) : nowPlaying?.artist ? (
                <p className="synapse-deck-sub">{nowPlaying.artist}</p>
              ) : null}
              <p className="synapse-deck-status">
                {statusMessage ||
                  (playerReady ? 'YouTube player ready' : 'Loading YouTube player…')}
              </p>
              {queueActive ? (
                <div className="synapse-deck-queue">
                  Queue {currentTrackIndex + 1} / {playbackQueue.length}
                </div>
              ) : null}
            </div>
            <DeckTransport
              isPlaying={isPlaying}
              disabled={!queueActive}
              currentTime={currentTime}
              duration={duration}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onPrevious={() => requestPrevious()}
              onNext={() => requestSkip()}
              onSeekBy={handleSeekBy}
              onSeekTo={handleSeekTo}
            />
          </div>
          <AudioVisualizer isPlaying={isPlaying} mediaElement={vizAudio} />
        </>
      )}
    </div>
  );
}
