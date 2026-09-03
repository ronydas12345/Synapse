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
- Deck transport beside now-playing credits: play/pause, previous/next, ±5/±10 second seek, and a progress scrubber.
- Audio visualizer using a real AnalyserNode. YouTube iframes block CORS audio tap, so the visualizer listens to this tab’s audio after a one-click share (the same mix coming out of the video).
- Visualizer capture works in Firefox/Safari via microphone fallback (those browsers cannot capture tab audio). Sharing status in the visualizer is collapsible; Stop ends capture so the browser sharing bar goes away. Canvas minimap can be minimized.

### Changed

- Track inspector hides EQ and Pitch & Tempo behind a collapsed “Experimental / not yet applied” disclosure; those sliders still save on the node but currently do not affect YouTube playback.
- Dragging a track onto a randomizer/sequence **moves** it into that node’s ordered `data.tracks` list (the canvas node is hidden/parked, not copied). Drag a list item out to restore the Track at the drop point. Connecting a track edge parks it the same way. Sequence mode hides weights; weighted mode keeps them.
- Track nodes no longer have an expand/collapse control. Comment annotations are center-to-center dotted lines with no graph handles, drawn in the React Flow edges pane **behind** nodes.
- Start/end inspectors use the real video duration (once known) with clock-style fields. Unset end still means play to the end.
- Visualizer bars use log-frequency peak mapping (`fftSize` 2048) so high-frequency bins are not skipped. Firefox still cannot tap YouTube iframe audio (CORS); tab share or mic remains the real FFT source — no fake spectrum.

### Fixed

- Track → Sequence drag-drop **moves** the track (no duplicate canvas copy, persists). List reorder and drag-out restore are two-way.
- Comment → parent dotted lines render behind nodes.
- Invalid saved start/end times are clamped when duration loads.

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
