# Synapse — Implementation Status

**Audit date:** 2026-08-26  
**Last implementation update:** 2026-09-07 — Style node with smooth theme interpolation; weather/day conditionals; theme-aware logo ink. See `doc/SYNAPSE_EXTENSIVE_FEATURES_HANDOFF.md` §8–12.  
**Scope:** `synapse-mvp/` (primary app). Root `package.json` is leftover deps only — not the runnable app.  
**Method:** Code inspection of `src/`, `package.json`, config, and absences (no backend/env/tests/deploy).

---

## Latest change (post-audit)

Implemented without pushing:

- `src/engine/` — pure `buildPlaybackQueue` + seeded RNG (`createSeededRng`)
- `src/playback/` — `PlaybackAdapter` + `YouTubeIframeAdapter` + `extractYouTubeId`
- `Player.tsx` — drives queue through adapter; bottom YouTube embed + now-playing
- `App.tsx` — Play / Pause / Skip
- Track node + sidebar — `songTitle`, `artist`, `album`; start/end/volume/speed applied on play

**2026-09-02 additional fix pass** (see `doc/SYNAPSE_CURSOR_ADDITIONAL_FIX_HANDOFF.md`):

- Drag a track onto a Sequence/Randomizer **moves** it: id is appended to `data.tracks`, the Track node stays in Zustand but is `hidden` on the canvas, and graph edges to it are stripped. Drag a list item out to restore it at the drop point. Deleting a Sequence restores its tracks nearby. No `parentId` nesting and no second track store.
- Comment → parent dotted lines are portaled into React Flow’s edges pane so they render **behind** nodes. Playback graph edges are unchanged.
- Sequence mode still hides weight UI; engine sequence order is `data.tracks`.

**2026-09-02 UI bug-fix pass** (see `doc/SYNAPSE_CURSOR_BUGFIX_HANDOFF.md`):

- Sequence mode hides weight UI; switching back to RND restores saved weights.
- Comment nodes have no graph handles; annotation links are center-to-center dotted lines (now behind nodes — additional pass).
- Track sidebar start/end use duration-aware clocks; `endTime === 0` means full length.
- Track node collapse/dropdown chevron removed.
- Visualizer uses log-frequency peak mapping (`fftSize` 2048). YouTube iframe audio cannot be tapped (CORS); no fake FFT; mic is user-initiated only.

**2026-09-02 UI/playback marker pass** (see `doc/SYNAPSE_CURSOR_UI_PLAYBACK_FIX_HANDOFF.md`):

- Conditional and Sequence/Randomizer modes use `<select>` dropdowns (inspector + compact on-node). Weights stay on the node when switching SEQ ↔ RND.
- Selected-node settings live in a right-side inspector that slides in for a single selection and closes on empty canvas / delete. Left sidebar is palette + tools only. MiniMap and Remove All sit on the left of the canvas.
- Yellow-orange playback marker follows the current Player node (or chosen start / Start when stopped). Drag onto a playable node rebuilds `buildPlaybackQueue` from that origin; comments are invalid. Start-from is not persisted.
- Off-screen Start nodes show a directional arrow at the minimap edge; click pans to the closest Start.

**2026-09-02 Listen screen** (V2.6 / V2.7 in `doc/SYNAPSE_CURSOR_HANDOFF_V2.md`):

- Header **Studio / Listen** switch. Listen hides the graph editor. Playback stays on the existing engine/adapter.
- Listen is a centered vertical list: now playing, video, large play, song controls, visualizer, upcoming path + split branches. Click a row/branch to jump (`setPlaybackStartNode`).
- Listen mode is not persisted.

**2026-09-04 Themes** (Phase 2 of `doc/SYNAPSE_EXTENSIVE_FEATURES_HANDOFF.md`):

- Header **Settings** tab. Themes: 25 presets, searchable picker, custom editor (preview isolated from the live workspace), Save/Cancel/Reset/Duplicate, JSON import/export, `localStorage` `synapse_theme_state`.
- Schema `{ schemaVersion: 1, type: "synapse-theme" }`. Fonts are allowlisted; imported JSON cannot run code.

**2026-09-05 pages + profile** (V2.6 / V2.8 in `doc/SYNAPSE_CURSOR_HANDOFF_V2.md`):

- URLs: `/edit`, `/listen`, `/settings`, `/profile` (`/` redirects to `/edit`). Player stays mounted across pages.
- Local profile: `@username`, display name, optional sections, public/private flag, listen counts from playback. No Firebase yet.
- Deferred at the time: Style node (now shipped 2026-09-07), overlays, Workshop publish, connection-style setting, remaining Settings categories.

**2026-09-06 playlist files** (`doc/SYNAPSE_CURSOR_HANDOFF.md` §11, `doc/SYNAPSE_EXTENSIVE_FEATURES_HANDOFF.md` §18–19):

- Settings **Import / Export** writes and reads `.synapse` JSON (playlist graph, custom themes used by Style nodes and the current Settings theme, optional package + manifest). ZIP packages and overlay assets are not supported yet; import explains skipped overlays instead of silently dropping playlist content.
- Schema `{ schemaVersion: 1, type: "synapse-playlist" | "synapse-package" }`. Legacy `{ version, name, nodes, edges, settings }` still parses. Node types are allowlisted; paths cannot traverse.

**2026-09-07 weather + day splitters** (`doc/SYNAPSE_EXTENSIVE_FEATURES_HANDOFF.md` §10–12):

- Conditional node modes **Weather** and **Day / Date** in the inspector and on-node picker. Weather uses Open-Meteo behind a provider interface, Profile coords or geolocation, 20-minute cache, and Other / Unknown when data is missing. Day / Date rules are structured (equals / one-of / range / specific dates / annual range / catch-all).
- Logo ink is black on light themes and light grey on dark themes.

**2026-09-07 style node** (`doc/SYNAPSE_EXTENSIVE_FEATURES_HANDOFF.md` §8–9):

- Toolbox **Style** node selects a saved theme and optional visual layers (workspace, text, nodes, player, fonts, chrome). Playback queue kind `style:{id}`. Player interpolates CSS variables; Settings `activeId` is not persisted from the node. Missing themes skip. Path end / stop restores the user theme. `prefers-reduced-motion` snaps.

**How to verify:** Start → Track (paste a YouTube URL/ID) → Play. Real video should play in the bottom bar. Select a node to open the right inspector. Drag the yellow-orange marker onto another track while paused, then Play. Settings → Import / Export: export the current playlist, re-import it (name becomes a copy if it already exists). Conditional: set Weather or Day / Date, assign states/rules per path, press Play. Style: Start → Track → Style (pick Cherry Tree) → Track → Play; the workspace should ease into that theme, then restore your Settings theme when the path ends.

---

## Deliverable A — Codebase Audit

### Stack

| Item | Finding |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Canvas | `@xyflow/react` (React Flow) |
| State | Zustand (`src/store.ts`) |
| Styling | Tailwind CSS 4 + PostCSS |
| Backend / DB / Auth | None |
| Env / secrets | None |
| Tests | Vitest (`npm test`) |
| Deployment config | None |

### Area status matrix

| Area | Status | Evidence | Missing work |
|---|---|---|---|
| App shell | **PARTIAL** | `App.tsx`: `/edit`, `/listen`, `/settings`, `/profile`; canvas, inspector, `Player` | OAuth, public profiles |
| Node canvas | **DONE** | `ReactFlowCanvas.tsx`: zoom/pan, drag-drop add, connect, select, delete, minimap, connection rules | Minor polish; “Remove All” can wipe Start |
| Node types | **PARTIAL** | Toolbox: start, track, conditional, randomizer, transition, style, comment, end | Artist, Genre nodes; dedicated Splitter label (conditional fills role) |
| Path execution | **PARTIAL** | `src/engine/buildPlaybackQueue.ts` — pure graph walk, weighted + time-range, optional seed | More node types; unit tests |
| YouTube integration | **PARTIAL** | IFrame Player adapter plays by `videoId`; URL→ID helper | OAuth, Data API, metadata cache |
| Playback | **PARTIAL** | YouTube adapter + silence/audio transitions; Play/Pause/Skip | Robust error UX; pitch/tempo/EQ not applied |
| Database | **MISSING** | `localStorage` key `synapse_graph_state` only | Server DB, Song table with title/artist/album |
| Authentication | **MISSING** | — | User accounts, YouTube login |
| Weighting | **PARTIAL** | Engine `pickWeightedIndex` + UI weights; `normalizeSplitters()` | Wire seed from UI/tests; edge-level model |
| Track controls | **PARTIAL** | Sidebar start/end use duration-aware clocks (`endTime === 0` = full length); volume/speed applied | Pitch/tempo/EQ still unused |
| Conditional logic | **PARTIAL** | Weighted, time-range, weather, and day/date modes; Open-Meteo via provider | Skip-penalty, cooldown |
| Analytics | **MISSING** | — | Execution events + dashboard |
| Export/import | **PARTIAL** | Settings `.synapse` playlist/package JSON (`src/playlists/format.ts`); themes still have their own JSON | ZIP container, overlay assets, share links |
| Billing | **MISSING** | — | Ads / premium (Phase 3) |
| Testing | **PARTIAL** | Vitest: engine, randomizer, track times, spectrum, listen path, theme parse, playlist files (`npm test`) | Broader UI/e2e coverage |
| Deployment | **MISSING** | No Vercel/Docker/CI | Hosting + env for API keys later |

### What already works (do not rebuild)

- Workspace layout: toolbox ↔ inspector, React Flow canvas.
- Node CRUD: add (click/drag), select, delete, connect with branching rules.
- Conditional = Path Splitter: weighted random, time-of-day, weather (user location), or day/date rules.
- Randomizer: sequence vs weighted random over linked track node IDs; play count. Tracks listed on a randomizer are parked (`hidden`) until dragged out.
- Transition node UI: silence / custom audio / YouTube videoId (execution is demo-level).
- Style node: saved theme + optional layers; Player interpolates CSS; canvas Settings/Path theme toggle; Settings theme is restored when the path ends.
- Interactive tutorial (`?` in the header): data-driven sections, spotlight, resume/skip, observes existing store events.
- Comment nodes + center-to-center dotted annotation lines drawn in the edges pane (behind nodes; not play-path edges; no graph handles).
- Graph persistence to `localStorage` on change; reload restores graph.
- Play/Pause toggles a demo “playback” queue traversal with node highlight.

### Technical debt / smells

- Path engine still shares `Player.tsx` with the YouTube adapter loop (queue build itself is in `src/engine/`).
- Root repo `package.json` duplicates some deps and is unused by the Vite app.

---

## Deliverable B — PDD → Code Mapping

| PDD requirement | Existing code | Status | Missing work | Priority |
|---|---|---|---|---|
| Top bar (account, OAuth, play/pause/skip, settings, theme) | `App.tsx` Studio/Listen/Settings + Play/Pause/Skip | PARTIAL | Account, OAuth | P1 |
| Left toolbox | `Sidebar.tsx` `NODE_TYPES` | PARTIAL | Artist, Genre | P1 |
| Contextual inspector | `InspectorPanel.tsx` + `NodeInspector.tsx` | PARTIAL | Structured song metadata; wire remaining unused controls | P1 |
| Zoomable node canvas | `ReactFlowCanvas.tsx` | DONE | — | — |
| Track node | `TrackNode.tsx` + inspector | PARTIAL | title/artist/album; real playback | P0 |
| Artist node | — | MISSING | New node type + resolve-to-track behavior | P2 |
| Genre node | — | MISSING | New node type + resolve behavior | P2 |
| Randomizer node | `RandomizerNode.tsx` + Player | PARTIAL | Stabilize vs Track selection semantics | P1 |
| Path Splitter | `ConditionalNode` (`conditional`/`splitter`) | PARTIAL | Naming/UX clarity; seeded selection | P1 |
| Weighting engine | Inline in `Player.tsx` | PARTIAL | Extract module; normalize UX; tests + seed | P0 |
| Start/end time, volume override | Sidebar fields | SCAFFOLD | Apply in PlaybackAdapter | P1 |
| Tempo/pitch | Sidebar fields | SCAFFOLD | Feasibility after YouTube adapter | P3 |
| Time-of-day trigger | Conditional `timeRange` | DONE | Dedicated node optional | P2 |
| Weather splitter | Conditional `weather` + `src/weather/` | DONE | Manual weather override | P2 |
| Day/date splitter | Conditional `day` structured rules | DONE | Week-of-month polish | P2 |
| Skip penalty | — | MISSING | Design + implement | P2 |
| Cooldown | — | MISSING | Design + implement | P2 |
| Transition node | `TransitionNode.tsx` | PARTIAL | Real silence/SFX/YT between tracks | P2 |
| BPM matching | — | MISSING | Needs BPM metadata | P3 |
| Save/load paths | `localStorage` auto | PARTIAL | Named paths, version field, duplicate | P1 |
| Export/import/share | — | MISSING | Versioned JSON + share links | P2 |
| Analytics | — | MISSING | Event model + UI | P3 |
| YouTube metadata + cache | — | MISSING | Data API + cache layer | P1 |
| YouTube IFrame Player | — | MISSING | PlaybackAdapter + YT adapter | P0 |
| Structured Song metadata | Only `videoId` | MISSING | Schema on node + future DB | P0 |
| State management | Zustand | DONE | Keep; avoid second store | — |
| Auth / billing / DB | — | MISSING | Post-MVP / Phase 2–3 | P3 |

---

## Deliverable C — MVP Gap List

### P0 — Blocks core product loop

1. **No real playback** — tracks do not play YouTube audio; oscillator demo only.
2. **No PlaybackAdapter separation** — engine + demo audio tangled in `Player.tsx`.
3. **Track identity incomplete** — `videoId` only; missing `song_title` / `artist` / `album`.
4. **Path engine not testable** — no pure module, no seeded RNG.

### P1 — Required for MVP definition of done

5. Skip control + current-track UI.
6. Apply start/end time and volume on playback.
7. Named save/load (versioned path JSON), not only anonymous localStorage.
8. YouTube metadata lookup + local cache (when API credentials exist).
9. Top-bar completeness (skip, status); harden Start-node persistence.
10. Extract weighting/path execution for unit tests.

### P2 — Important post-MVP

11. Artist / Genre nodes.
12. Skip-penalty + cooldown.
13. Transition nodes with real media.
14. Export / import / shareable links.
15. Time-of-day UX polish / dedicated trigger node.

### P3 — Advanced / future

16. BPM matching, pitch/tempo (if player supports).
17. Analytics dashboard.
18. Auth, cloud DB, billing, Phase 2 B2B migration.
19. Production hardening, monitoring, CI.

---

## Deliverable D — Next Implementation Step

### Single highest-value task (done locally)

**Extracted `MusicPathEngine` + `YouTubeIframeAdapter` — tracks with a `videoId` play via YouTube IFrame.**

### Next highest-value task

1. Engine unit tests with `createSeededRng`.
2. Named / versioned path save-load JSON.
3. YouTube metadata cache (when API key available).

### Explicit non-goals until asked

- Do **not** `git push` (someone else’s project).
- Artist/Genre nodes, analytics, OAuth, billing, BPM.

---

## Core loop scorecard (MVP DoD)

| Step | Status |
|---|---|
| Open application | DONE |
| Create Music Path | PARTIAL (anonymous local graph) |
| Add music-related nodes | PARTIAL (Track exists) |
| Connect nodes | DONE |
| Configure branch weights | DONE |
| Execute the path | PARTIAL (demo queue) |
| Select track by rules | PARTIAL |
| Play via supported engine | **PARTIAL** (YouTube IFrame) |
| Skip / play / pause | **PARTIAL** (works; no scrubber) |
| Save path | PARTIAL |
| Reload path | DONE |

**Verdict:** Strong visual graph MVP shell; **playback and YouTube Phase 1 are the critical gap.**

---

## Recommended stage after next task

Once YouTube play works for a simple Start → Track → End path:

1. Start → Conditional (weights) → two Tracks (prove weighting live).
2. Wire start/end/volume.
3. Versioned save/load JSON.
4. Then P1 metadata cache / OAuth as credentials allow.
