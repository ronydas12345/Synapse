import { useEffect, useMemo, useRef } from 'react';
import { extractYouTubeId } from './playback';
import { lookupTrackCredits } from './metadata';
import { usePathStore } from './store';

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function needsTitle(value: unknown): boolean {
  const text = asText(value);
  return !text || text.toLowerCase() === 'track';
}

/**
 * Fills empty songTitle / artist / album when a Track node's video ID changes.
 * Does not run on drag, select, or connect — only when the lookup key changes.
 */
export default function TrackMetadataAutofill() {
  const nodes = usePathStore((s) => s.nodes);
  const updateNodeData = usePathStore((s) => s.updateNodeData);
  const inFlight = useRef(new Set<string>());

  const signature = useMemo(() => {
    return nodes
      .filter((n) => n.type === 'track')
      .map((n) => {
        const videoId = extractYouTubeId(String(n.data?.videoId || ''));
        const applied = String(n.data?.metadataVideoId || '');
        const force = n.data?.metadataRefreshRequested ? '1' : '0';
        return `${n.id}:${videoId}:${applied}:${force}`;
      })
      .join('|');
  }, [nodes]);

  useEffect(() => {
    const { nodes: currentNodes, updateNodeData: update } = usePathStore.getState();

    for (const node of currentNodes) {
      if (node.type !== 'track') continue;
      const videoId = extractYouTubeId(String(node.data?.videoId || ''));
      if (!videoId) continue;

      const force = Boolean(node.data?.metadataRefreshRequested);
      if (!force && asText(node.data?.metadataVideoId) === videoId) continue;

      const missingTitle = needsTitle(node.data?.songTitle);
      const missingArtist = !asText(node.data?.artist);
      const missingAlbum = !asText(node.data?.album);
      if (!force && !missingTitle && !missingArtist && !missingAlbum) {
        if (asText(node.data?.metadataVideoId) !== videoId) {
          updateNodeData(node.id, {
            metadataVideoId: videoId,
            metadataStatus: 'ready',
          });
        }
        continue;
      }

      const flightKey = `${node.id}:${videoId}`;
      if (inFlight.current.has(flightKey)) continue;
      inFlight.current.add(flightKey);

      update(node.id, { metadataStatus: 'loading' });

      void lookupTrackCredits(videoId)
        .then((credits) => {
          const latest = usePathStore
            .getState()
            .nodes.find((n) => n.id === node.id);
          if (!latest) return;
          const latestId = extractYouTubeId(String(latest.data?.videoId || ''));
          if (latestId !== videoId) return;

          const shouldOverwrite = Boolean(latest.data?.metadataRefreshRequested);
          const patch: Record<string, unknown> = {
            metadataVideoId: videoId,
            metadataStatus: credits ? 'ready' : 'error',
            metadataRefreshRequested: false,
          };
          if (credits) {
            if (shouldOverwrite || needsTitle(latest.data?.songTitle)) {
              patch.songTitle = credits.songTitle;
            }
            if (shouldOverwrite || !asText(latest.data?.artist)) {
              patch.artist = credits.artist;
            }
            if (shouldOverwrite || !asText(latest.data?.album)) {
              patch.album = credits.album;
            }
          }
          update(node.id, patch);
        })
        .catch(() => {
          update(node.id, {
            metadataVideoId: videoId,
            metadataStatus: 'error',
            metadataRefreshRequested: false,
          });
        })
        .finally(() => {
          inFlight.current.delete(flightKey);
        });
    }
  }, [signature, updateNodeData]);

  return null;
}
