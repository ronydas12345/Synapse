import type { TrackCredits } from './types';

const STORAGE_KEY = 'synapse_yt_metadata_v1';
const TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type CachedCredits = TrackCredits & {
  videoId: string;
  fetchedAt: number;
  source: string;
};

function readAll(): Record<string, CachedCredits> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedCredits>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, CachedCredits>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // quota / private mode
  }
}

export function getCachedCredits(videoId: string): CachedCredits | null {
  if (!videoId) return null;
  const entry = readAll()[videoId];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) return null;
  return entry;
}

export function setCachedCredits(
  videoId: string,
  credits: TrackCredits,
  source: string
): void {
  if (!videoId) return;
  const all = readAll();
  all[videoId] = {
    ...credits,
    videoId,
    fetchedAt: Date.now(),
    source,
  };
  writeAll(all);
}
