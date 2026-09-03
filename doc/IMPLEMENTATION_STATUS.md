# Synapse — Implementation Status

**Audit date:** 2026-08-26  
**Last implementation update:** 2026-09-02 — additional UI fixes: Sequence **move** in/out (parked hidden nodes) and comment lines behind nodes. See `doc/SYNAPSE_CURSOR_ADDITIONAL_FIX_HANDOFF.md`.  
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

**How to verify:** Start → Track (paste a YouTube URL/ID) → Play. Real video should play in the bottom bar.

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
| App shell | **PARTIAL** | `App.tsx`: top bar (title + Play/Pause), left `Sidebar`, main canvas, bottom `Player` (renders `null`) | Account, OAuth status, Skip, global settings, theme, crossfade, API sync |
| Node canvas | **DONE** | `ReactFlowCanvas.tsx`: zoom/pan, drag-drop add, connect, select, delete, minimap, connection rules | Minor polish; “Remove All” can wipe Start |
| Node types | **PARTIAL** | Toolbox: start, track, conditional, randomizer, transition, comment, end | Artist, Genre nodes; dedicated Splitter label (conditional fills role) |
| Path execution | **PARTIAL** | `src/engine/buildPlaybackQueue.ts` — pure graph walk, weighted + time-range, optional seed | More node types; unit tests |
| YouTube integration | **PARTIAL** | IFrame Player adapter plays by `videoId`; URL→ID helper | OAuth, Data API, metadata cache |
| Playback | **PARTIAL** | YouTube adapter + silence/audio transitions; Play/Pause/Skip | Robust error UX; pitch/tempo/EQ not applied |
| Database | **MISSING** | `localStorage` key `synapse_graph_state` only | Server DB, Song table with title/artist/album |
| Authentication | **MISSING** | — | User accounts, YouTube login |
| Weighting | **PARTIAL** | Engine `pickWeightedIndex` + UI weights; `normalizeSplitters()` | Wire seed from UI/tests; edge-level model |
| Track controls | **PARTIAL** | Sidebar start/end use duration-aware clocks (`endTime === 0` = full length); volume/speed applied | Pitch/tempo/EQ still unused |
| Conditional logic | **PARTIAL** | Conditional `mode: timeRange` (hour-based) implemented in Player | Skip-penalty, cooldown |
| Analytics | **MISSING** | — | Execution events + dashboard |
| Export/import | **MISSING** | Auto local save only; no versioned path file/export/import/share | Versioned JSON format, named paths |
| Billing | **MISSING** | — | Ads / premium (Phase 3) |
| Testing | **PARTIAL** | Vitest: engine, randomizer drop-add, track times, spectrum mapping (`npm test`) | Broader UI/e2e coverage |
| Deployment | **MISSING** | No Vercel/Docker/CI | Hosting + env for API keys later |

### What already works (do not rebuild)

- Workspace layout: toolbox ↔ inspector, React Flow canvas.
- Node CRUD: add (click/drag), select, delete, connect with branching rules.
- Conditional = Path Splitter: weighted random **or** time-of-day ranges.
- Randomizer: sequence vs weighted random over linked track node IDs; play count. Tracks listed on a randomizer are parked (`hidden`) until dragged out.
- Transition node UI: silence / custom audio / YouTube videoId (execution is demo-level).
- Comment nodes + center-to-center dotted annotation lines drawn in the edges pane (behind nodes; not play-path edges; no graph handles).
- Graph persistence to `localStorage` on change; reload restores graph.
- Play/Pause toggles a demo “playback” queue traversal with node highlight.

### Technical debt / smells

- Path engine lives inside `Player.tsx` (violates PDD Principle 1).
- `playbackQueue` comment says “YouTube videoIds” but stores `track:{nodeId}` / `transition:{nodeId}`.
- Track stores only `videoId` — no `song_title` / `artist` / `album` (blocks Phase 2 migration design).
- Micro-control UI writes state that playback never reads.
- Verbose `console.log` in ConditionalNode / storage / canvas connect paths.
- `App.minimal.tsx` leftover debug shell.
- `Player` returns `null` — no now-playing UI, skip, or progress.
- No PlaybackAdapter abstraction.
- Root repo `package.json` duplicates some deps and is unused by the Vite app.

---

## Deliverable B — PDD → Code Mapping

| PDD requirement | Existing code | Status | Missing work | Priority |
|---|---|---|---|---|
| Top bar (account, OAuth, play/pause/skip, settings, theme) | `App.tsx` Play/Pause only | PARTIAL | Rest of controls | P1 |
| Left toolbox | `Sidebar.tsx` `NODE_TYPES` | PARTIAL | Artist, Genre | P1 |
| Contextual inspector | `Sidebar.tsx` selected-node panels | PARTIAL | Structured song metadata; wire controls to player | P1 |
| Zoomable node canvas | `ReactFlowCanvas.tsx` | DONE | — | — |
| Track node | `TrackNode.tsx` + inspector | PARTIAL | title/artist/album; real playback | P0 |
| Artist node | — | MISSING | New node type + resolve-to-track behavior | P2 |
| Genre node | — | MISSING | New node type + resolve behavior | P2 |
| Randomizer node | `RandomizerNode.tsx` + Player | PARTIAL | Stabilize vs Track selection semantics | P1 |
| Path Splitter | `ConditionalNode` (`conditional`/`splitter`) | PARTIAL | Naming/UX clarity; seeded selection | P1 |
| Weighting engine | Inline in `Player.tsx` | PARTIAL | Extract module; normalize UX; tests + seed | P0 |
| Start/end time, volume override | Sidebar fields | SCAFFOLD | Apply in PlaybackAdapter | P1 |
| Tempo/pitch | Sidebar fields | SCAFFOLD | Feasibility after YouTube adapter | P3 |
| Time-of-day trigger | Conditional `timeRange` | PARTIAL | Dedicated node optional; polish | P2 |
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
