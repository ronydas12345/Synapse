import { usePathStore } from './store';
import { useEffect, useRef, useCallback } from 'react';

export default function Player() {
  const { nodes, edges, isPlaying, playbackQueue, currentTrackIndex, setCurrentTrackIndex, setIsPlaying, setCurrentPlayingNodeId, setPlaybackQueue } = usePathStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Helper function to randomly select a track from a randomizer based on weights
  const selectFromRandomizer = (randomizerId: string): string | null => {
    const randomizerNode = nodes.find((n) => n.id === randomizerId);
    if (!randomizerNode || !randomizerNode.data?.tracks) {
      return null;
    }

    const tracks = (randomizerNode.data.tracks as string[]) || [];
    if (tracks.length === 0) return null;

    const weights = (randomizerNode.data.weights as number[]) || Array(tracks.length).fill(100 / tracks.length);

    // Create weighted random selection
    const totalWeight = weights.reduce((a: number, b: number) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < tracks.length; i++) {
      random -= (weights[i] as number);
      if (random <= 0) {
        return tracks[i];
      }
    }

    return tracks[tracks.length - 1];
  };

  // Build playback queue by traversing the graph
  const buildPlaybackQueue = (): string[] => {
    const queue: string[] = [];
    const visited = new Set<string>();

    const traverse = (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Only mark nodes as visited if they're not splitters (splitters can be entered from different paths)
      const isSplitter = node.type === 'splitter';
      if (!isSplitter && visited.has(nodeId)) return;
      if (!isSplitter) visited.add(nodeId);

      if (node.type === 'track') {
        const playCount = Math.max(1, (node.data?.playCount as number) || 1);
        // Add track to queue playCount times
        for (let i = 0; i < playCount; i++) {
          queue.push(`track:${nodeId}`);
        }
      } else if (node.type === 'randomizer') {
        const mode = (node.data?.mode as string) || 'sequence';
        const tracks = (node.data?.tracks as string[]) || [];
        let playCount = (node.data?.playCount as number) || 1;
        const isForever = node.data?.isForever as boolean;
        
        // If forever, limit to reasonable number (otherwise we'd loop forever)
        if (isForever) {
          playCount = 1;
        }
        
        // Cap playCount to prevent massive queues
        playCount = Math.min(playCount, 100);
        
        if (mode === 'sequence') {
          // Play tracks in order, repeated playCount times
          for (let i = 0; i < playCount; i++) {
            tracks.forEach((trackId) => {
              queue.push(`track:${trackId}`);
            });
          }
        } else {
          // Randomizer mode: randomly select tracks based on weights
          for (let i = 0; i < playCount; i++) {
            const selectedTrack = selectFromRandomizer(nodeId);
            if (selectedTrack) {
              queue.push(`track:${selectedTrack}`);
            }
          }
        }
      } else if (node.type === 'splitter' || node.type === 'conditional') {
        // For conditionals/splitters, select one path based on mode
        const mode = (node.data?.mode as string) || 'random';
        const weights = (node.data?.weights as number[]) || [1, 1];
        const pathTimeRanges = (node.data?.pathTimeRanges as Array<Array<{start: number, end: number}>>) || 
          Array(weights.length).fill(null).map(() => [{ start: 0, end: 23 }]);
        const totalWeight = weights.reduce((a: number, b: number) => a + b, 0) || 1;
        
        let selectedPathIndex = -1;
        
        if (mode === 'timeRange') {
          // Check current hour against each path's time ranges
          const currentHour = new Date().getHours();
          
          // Find first matching path based on time ranges
          for (let i = 0; i < pathTimeRanges.length; i++) {
            const ranges = pathTimeRanges[i] || [];
            const isInRange = ranges.some((range) => {
              if (range.start <= range.end) {
                return currentHour >= range.start && currentHour <= range.end;
              } else {
                // Handle wrap-around (e.g., 22:00 to 06:00)
                return currentHour >= range.start || currentHour <= range.end;
              }
            });
            
            if (isInRange) {
              selectedPathIndex = i;
              break;
            }
          }
          
          // If no path matches, default to first path
          if (selectedPathIndex === -1) {
            selectedPathIndex = 0;
          }
        } else {
          // Weighted random selection
          let random = Math.random() * totalWeight;
          selectedPathIndex = 0;
          
          for (let i = 0; i < weights.length; i++) {
            random -= (weights[i] as number);
            if (random <= 0) {
              selectedPathIndex = i;
              break;
            }
          }
        }
        
        // Find the outgoing edge for this specific path
        const pathId = String.fromCharCode(65 + selectedPathIndex); // A, B, C, etc.
        const outgoingEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === pathId);
        
        if (outgoingEdge) {
          traverse(outgoingEdge.target);
        }
      } else if (node.type === 'transition') {
        queue.push(`transition:${nodeId}`);
      }

      // Find outgoing edges and continue traversal (skip for splitters/conditionals since they handle their own path)
      if (node.type !== 'splitter' && node.type !== 'conditional') {
        edges.forEach((edge) => {
          if (edge.source === nodeId) {
            traverse(edge.target);
          }
        });
      }
    };

    // Start from the start node
    const startNode = nodes.find((n) => n.type === 'start');
    if (startNode) {
      traverse(startNode.id);
    }

    return queue;
  };

  const playNext = useCallback(() => {
    if (playbackQueue.length === 0) {
      setIsPlaying(false);
      setCurrentPlayingNodeId(null);
      setPlaybackQueue([]);
      return;
    }

    if (currentTrackIndex < playbackQueue.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      // Reached end - stop playback
      setIsPlaying(false);
      setCurrentTrackIndex(0);
      setCurrentPlayingNodeId(null);
      setPlaybackQueue([]);
    }
  }, [currentTrackIndex, playbackQueue.length, setCurrentTrackIndex, setIsPlaying, setCurrentPlayingNodeId, setPlaybackQueue]);

  // Initialize or rebuild playback queue when graph changes or play starts
  useEffect(() => {
    if (isPlaying && playbackQueue.length === 0) {
      const queue = buildPlaybackQueue();
      setPlaybackQueue(queue);
      if (queue.length === 0) {
        setIsPlaying(false);
      }
    }
  }, [isPlaying, playbackQueue.length, nodes, edges, setPlaybackQueue, setIsPlaying]);

  // Clear queue when stopping to force rebuild on next play
  useEffect(() => {
    if (!isPlaying && playbackQueue.length > 0) {
      setPlaybackQueue([]);
      setCurrentTrackIndex(0);
    }
  }, [isPlaying, setPlaybackQueue, setCurrentTrackIndex, playbackQueue.length]);

  useEffect(() => {
    if (isPlaying && playbackQueue.length > 0 && playbackQueue[currentTrackIndex]) {
      // Create audio context for demo playback
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      // Resume context if needed
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop any existing oscillator
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }

      const queueItem = playbackQueue[currentTrackIndex];
      const [itemType, itemId] = queueItem.split(':');
      
      // Update the currently playing node
      setCurrentPlayingNodeId(itemId);
      
      let trackDuration = 2000; // default 2 seconds

      if (itemType === 'transition') {
        // Handle transition node
        const transitionNode = nodes.find((n) => n.id === itemId);
        if (transitionNode?.data?.type === 'silence') {
          trackDuration = ((transitionNode.data.duration as number) || 1) * 1000;
        } else if (transitionNode?.data?.type === 'youtube') {
          // YouTube transition - use default duration or could be estimated from actual video
          trackDuration = 2000; // default 2 seconds for YouTube transition
          // Create demo audio signal for YouTube transition
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          oscillatorRef.current = osc;

          osc.connect(gain);
          gain.connect(ctx.destination);

          // Different frequency for transition audio
          osc.frequency.setValueAtTime(540 + currentTrackIndex * 40, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 2);

          osc.start(now);
          osc.stop(now + Math.min(2, trackDuration / 1000));
        } else if (transitionNode?.data?.type === 'audio') {
          // Handle custom audio file
          if (transitionNode?.data?.audioFile) {
            // Create audio element for playing the custom audio file
            if (!audioElementRef.current) {
              audioElementRef.current = new Audio();
            }
            audioElementRef.current.src = transitionNode.data.audioFile as string;
            audioElementRef.current.play().catch(err => console.error('Failed to play audio:', err));
            
            // Use audio element's duration if available
            audioElementRef.current.onloadedmetadata = () => {
              trackDuration = (audioElementRef.current?.duration || 2) * 1000;
            };
            
            // Fallback if metadata isn't loaded
            trackDuration = 2000;
          } else {
            trackDuration = 2000;
          }
        }
        // Silence transition - no audio needed, just wait
      } else if (itemType === 'track') {
        // Handle track node - demo audio
        const trackNode = nodes.find((n) => n.id === itemId);
        const duration = (trackNode?.data?.duration as number) || 0;
        if (duration > 0) {
          trackDuration = duration * 1000;
        } else {
          trackDuration = 2000;
        }

        // For demo purposes, create a simple audio signal
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillatorRef.current = osc;

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Vary frequency based on track index for distinction
        osc.frequency.setValueAtTime(440 + currentTrackIndex * 50, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2);

        osc.start(now);
        osc.stop(now + Math.min(2, trackDuration / 1000));
      }

      // Schedule next track
      const timeout = setTimeout(() => {
        playNext();
      }, trackDuration);

      return () => {
        clearTimeout(timeout);
        // Stop any audio element
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.currentTime = 0;
        }
      };
    } else if (!isPlaying) {
      // When paused, stop the oscillator and audio element
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
    }
  }, [currentTrackIndex, isPlaying, playbackQueue, playNext, nodes, setCurrentPlayingNodeId]);

  // For actual audio playback, return an empty fragment
  // Real implementation would need valid audio sources
  return null;
}