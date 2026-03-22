import { usePathStore } from './store';
import { useEffect, useRef } from 'react';

export default function Player() {
  const { nodes, edges, isPlaying, playbackQueue, currentTrackIndex, setCurrentTrackIndex, setIsPlaying } = usePathStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

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
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (node.type === 'track') {
        queue.push(nodeId);
      } else if (node.type === 'randomizer') {
        // Randomly select one track from the randomizer
        const selectedTrack = selectFromRandomizer(nodeId);
        if (selectedTrack) {
          traverse(selectedTrack);
        }
      }

      // Find outgoing edges and continue traversal
      edges.forEach((edge) => {
        if (edge.source === nodeId) {
          traverse(edge.target);
        }
      });
    };

    // Start from the start node
    const startNode = nodes.find((n) => n.type === 'start');
    if (startNode) {
      traverse(startNode.id);
    }

    return queue;
  };

  const playNext = () => {
    if (playbackQueue.length === 0) {
      setIsPlaying(false);
      return;
    }

    if (currentTrackIndex < playbackQueue.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else {
      // Reached end - stop playback
      setIsPlaying(false);
      setCurrentTrackIndex(0);
    }
  };

  // Initialize or rebuild playback queue when graph changes
  useEffect(() => {
    if (isPlaying && playbackQueue.length === 0) {
      const queue = buildPlaybackQueue();
      // setPlaybackQueue(queue); // This would require adding it to store
      if (queue.length === 0) {
        setIsPlaying(false);
      }
    }
  }, [isPlaying]);

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

      // For demo purposes, we'll create a simple audio signal
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
      osc.stop(now + 2);

      // Track playback duration
      const trackDuration = 2000; // 2 seconds per demo track

      // Schedule next track
      const timeout = setTimeout(() => {
        playNext();
      }, trackDuration);

      return () => {
        clearTimeout(timeout);
      };
    } else if (!isPlaying) {
      // When paused, stop the oscillator
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
    }
  }, [currentTrackIndex, isPlaying, playbackQueue, playNext]);

  // For actual audio playback, return an empty fragment
  // Real implementation would need valid audio sources
  return null;
}