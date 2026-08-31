# Changelog

All notable changes to the Synapse app (`synapse-mvp`) are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-08-30

Now-playing credits. Local feature branch `feature/now-playing-metadata`; not pushed unless requested.

### Added

- Track nodes always show title, artist, and album in both collapsed and expanded states.
- Bottom player bar shows title, artist, and album for the current queue item.
- Shared `getTrackDisplayMeta` helper so node canvas and player stay consistent.
- Larger bottom play bar (video preview + title/artist/album type).
- Auto-fill song title, artist, and album from a YouTube ID (oEmbed + iTunes album lookup, optional `VITE_YOUTUBE_API_KEY`, local cache). Track nodes no longer display the generic “Track” label as a title.

## [0.2.0] — 2026-08-29

V2.1 Reliability. Local tag only; not pushed unless requested.

### Added

- Vitest harness (`npm test`) for the pure Music Path engine, covering seeded RNG, weighted splitters, time-range branches, randomizers, transitions, and cycles.
- Queue and traverse caps so runaway graphs halt instead of freezing the UI.
- Stable halt reasons (`no_start`, `max_steps`, `max_queue`) from `buildPlaybackQueueResult`.

### Fixed

- Conditional/splitter nodes are visited once, matching cycle protection on other node types.
- YouTube IFrame errors (invalid ID, private/deleted, embed blocked) skip to the next queue item instead of stalling behind the load-suppress window.
- Production `tsc -b` unused-local and index-type errors in the canvas and comment edges.

## [0.1.0] — 2026-08-29

YouTube IFrame playback adapter, path engine extraction, structured track metadata, studio UI.
