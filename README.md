# Synapse

**Visual Music Paths.** Synapse is a browser app for building playback as a graph instead of a fixed song list. You place nodes on a canvas, connect them with rules, and press Play. The engine walks the graph and decides what comes next.

Current app version: **0.3.0** (`synapse-mvp/package.json`). There is no account system and no cloud save. Paths, themes, settings, and profile live in this browser’s `localStorage`. Track nodes play **YouTube** videos; Synapse does not host an audio library.

Workshop publishing, Pro checkout, collaborative editing, and image/GIF overlays are **not shipped**. The marketing pages describe those honestly as planned or preview-only.

---

## Contents

- [What you can do today](#what-you-can-do-today)
- [What is not in this release](#what-is-not-in-this-release)
- [Quick start](#quick-start)
- [Using the app](#using-the-app)
  - [Routes](#routes)
  - [Build a path](#build-a-path)
  - [Node types](#node-types)
  - [Playback](#playback)
  - [Listen](#listen)
  - [Themes and Style nodes](#themes-and-style-nodes)
  - [Settings](#settings)
  - [Profile](#profile)
  - [Tutorial](#tutorial)
- [Playlist and theme files](#playlist-and-theme-files)
- [Architecture](#architecture)
- [Local data and privacy](#local-data-and-privacy)
- [Development](#development)
- [Repository layout](#repository-layout)
- [Related docs](#related-docs)

---

## What you can do today

- Draw a **Music Path** on a zoomable canvas (React Flow): Start, tracks, branches, sequences, transitions, Style cues, comments, End.
- Play YouTube tracks with start/end times, per-track volume and speed, deck transport (play/pause, previous/next, seek, scrub).
- Branch with **weighted random**, **time of day**, **weather** (Open-Meteo + profile location or geolocation), or **day/date** rules.
- Park tracks inside a **randomizer** (sequence or weighted pool, with play-count limits).
- Insert **silence**, a custom audio clip, or a YouTube clip as a transition.
- Apply **preset and custom themes**; use **Style nodes** so the look changes as the path plays, without overwriting the Settings theme.
- Switch **Settings theme** vs **Path theme** on the canvas without moving the playback marker.
- Hold **Shift** while dragging nodes for alignment guides and snap.
- Pick connection **arrow types** and visualizer **bar counts** on the theme.
- Use **Listen** mode (`/listen`) as an indented path list instead of the graph editor.
- Keep a **local playlist library**, export/import `.synapse` JSON (graph + dependent custom themes).
- Keep a **local profile** (`@username`, optional sections, listen counts).
- Open the **tutorial** from `?` in the header.

## What is not in this release

- Accounts, OAuth, YouTube login, or public cloud profiles.
- Workshop search, publish, or share links (preview pages only).
- Pro billing, ads, or paid feature gating.
- ZIP playlist packages, overlay images, GIFs, or animated canvas overlays.
- Pitch, tempo, and EQ on YouTube playback (inspector fields exist; they are not applied).
- Artist / Genre node types.
- Server-side database or multi-device sync.

---

## Quick start

The runnable app is **`synapse-mvp/`**. The root `package.json` is leftover unused dependencies — do not install or run from the repo root.

```bash
cd synapse-mvp
npm install
npm run dev
```

Vite prints a local URL (typically `http://localhost:5173`). Open `/` for the marketing homepage or `/edit` for the editor.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b` then production bundle |
| `npm run preview` | Serve the production build |
| `npm test` | Vitest once |
| `npm run test:watch` | Vitest watch |
| `npm run lint` | ESLint |

**Optional env** (in `synapse-mvp/.env`, never commit keys):

```
VITE_YOUTUBE_API_KEY=
```

Track titles still fill from oEmbed and iTunes album lookup without this key. The Data API key can improve YouTube metadata when present.

Requires a current Node.js (the app is ESM, Vite 8, React 19).

---

## Using the app

### Routes

| Path | What it is |
| --- | --- |
| `/` | Marketing homepage |
| `/workshop` | Workshop **preview** (publishing is not live) |
| `/pricing` | Pricing copy; checkout is not open |
| `/changelog` | In-app changelog |
| `/faq`, `/privacy`, `/terms`, `/cookies` | FAQ and legal |
| `/edit` | Graph editor (Studio) |
| `/listen` | Listen screen |
| `/settings` | Themes, appearance, playlists, import/export, and other local settings |
| `/profile` | Local profile |

Marketing routes do **not** mount the YouTube player. Workspace routes (`/edit`, `/listen`, `/settings`, `/profile`) keep the player mounted so playback can continue while you switch those pages.

The header **Open Synapse** control goes to the workspace. The `?` button opens the tutorial (workspace).

### Build a path

1. Open `/edit`.
2. Drag a **Track** from the left toolbox onto the canvas. Paste a YouTube URL or video ID. Title, artist, and album can auto-fill.
3. Connect **Start → Track** (and onward). Click a node to open the right inspector.
4. Add conditionals, randomizers, transitions, or Style nodes as needed.
5. Press **Play**. The yellow-orange **playback marker** follows the current item. Drag it onto a playable node (while stopped or as documented in the tutorial) to rebuild the queue from that origin.

Tips:

- **Shift** while dragging: alignment guides (edges, midlines, 45°, equal spacing) and snap.
- Comments do not sit on the play path. They use center-to-center dotted lines drawn **behind** nodes, with no graph handles.
- Drag a track **onto** a randomizer/sequence to **move** it into that node’s list (the canvas Track is parked/`hidden`, not copied). Drag a list item out to restore it.
- Connecting a track into a randomizer parks it the same way. Deleting a sequence restores its tracks nearby.
- An off-screen Start shows a direction arrow near the minimap; click to pan to it.
- Unset track **end** means play to the real video end. Start/end fields use the duration once YouTube reports it.

### Node types

| Type | Role |
| --- | --- |
| **Start** | Walk origin when the marker is not dropped elsewhere. |
| **Track** | One YouTube video: `videoId`, credits, start/end, volume, speed, play count. |
| **Conditional** | Path splitter. Modes: weighted random, time-of-day hour ranges, weather states, day/date rules (equals, one-of, range, specific dates, annual windows, catch-all). |
| **Randomizer / Sequence** | Ordered list (`sequence`) or weighted pool (`random`) of parked track ids, with play-count limits. |
| **Transition** | Silence, custom audio, or YouTube clip between playable items. |
| **Style** | Cue a saved theme (preset or custom), optional layers, delay, duration, easing. Interpolates CSS; does **not** persist Settings `activeId`. |
| **Comment** | Notes only. |
| **End** | Stops the walk. Settings theme is restored when the path ends or you stop. |

The engine only queues **track**, **transition**, and **style** items (`track:{id}`, `transition:{id}`, `style:{id}`). Comments are skipped. Missing Style themes are skipped. Graphs that loop are capped (`max_steps` / `max_queue`) instead of freezing the UI.

### Playback

`Player.tsx` drives `buildPlaybackQueue` through a `PlaybackAdapter`. YouTube uses `YouTubeIframeAdapter` (IFrame API). Invalid, private, deleted, or embed-blocked videos skip to the next queue item.

The deck lives in the bottom bar. The visualizer uses a real `AnalyserNode`. YouTube iframes block CORS audio tap, so the visualizer listens after you share **this tab’s audio** (or microphone on Firefox/Safari). There is no fake spectrum. Stop capture to dismiss the browser sharing bar.

YouTube volume/speed and start/end are applied. Experimental EQ / pitch & tempo sliders in the inspector are **not** applied to playback.

`prefers-reduced-motion` snaps Style interpolations instead of easing.

### Listen

`/listen` hides the graph. The path is one indented list (nested branches under their parent). A marker shows the current song. After a conditional, the chosen fork stays visible with the other paths listed so you can jump. Click a song or branch to start from that node. Wide layouts put controls on the left and the path on the right; narrow layouts stack them.

### Themes and Style nodes

Settings → **Themes**: 25 searchable presets, custom editor with an isolated live preview, Save / Cancel / Reset / Duplicate, JSON import/export.

Theme JSON schema: `{ schemaVersion: 1, type: "synapse-theme" }`. Fonts are **allowlisted**. Imported JSON cannot run code. Overlay fields are ignored for now.

Theme `style` includes corner radius, grid/shadow intensity, **arrow type** (`bezier`, `simpleBezier`, `straight`, `rectangular`, `rounded`, `triangular`), and **visualizer bar count** (12 / 16 / 24 / 28 / 32 / 48). Changing a preset field opens a custom copy until you Save.

**Style nodes** pick a saved theme and optional layers (workspace, text, nodes, player, fonts, chrome). Playback interpolates CSS variables. Jumping or skipping to a node applies Style cues already on the path to that node. Canvas **Settings theme / Path theme** toggles the Settings look versus the path look without moving the marker and without writing the Settings theme.

### Settings

Local, versioned store (`synapse_app_settings`). Sections that exist in this build include themes, appearance (motion), playlists, general, canvas, connections, nodes, playback (master volume), visualizer visibility, environment (weather/geo), import/export, tutorial, account (link to local profile), privacy/data, and support. Workshop and Pro sections state that those products are **not available**.

Do not expect settings for features that are not implemented (no fake crossfade, no overlay controls that do nothing).

### Profile

`/profile`: required `@username` and display name; optional picture, location, bio, genres, songs, playlists, listen stats, activity graph. Sections can be reordered. Visibility is stored locally only. Track starts increment local listen counts. Location (or browser geolocation) feeds weather conditionals.

### Tutorial

`?` in the header: full tour or jump to a topic, spotlight on real UI, action steps that listen to the app store. Progress is in `localStorage`. Esc exits. Unshipped features are labeled as previews.

---

## Playlist and theme files

**Settings → Import / Export** (and per-playlist export in the playlists section).

| Kind | Type field | Contents |
| --- | --- | --- |
| Playlist | `synapse-playlist` | Graph + `themeId` + any **custom** themes the path depends on (Style nodes and the current Settings theme). |
| Package | `synapse-package` | Same graph, a manifest, and those custom themes. |
| Theme | `synapse-theme` | One theme; import under Themes, not Playlists. |

File extension: `.synapse` (JSON). Schema version `1`.

- **Presets** are referenced by id and are not duplicated in the file.
- **Custom** themes used by Style nodes are embedded so another browser can play the same looks.
- On import, colliding custom theme ids are renamed; Style node `themeId` values are remapped.
- Node types are **allowlisted**. Paths cannot traverse the filesystem. Functions are stripped from node data. Names cannot carry HTML.
- ZIP archives are rejected with a clear error. Overlay image/GIF entries are skipped with a **notice**; the graph is still imported.
- Duplicate playlist names become “copy”.
- Legacy `{ version, name, nodes, edges, settings }` still parses.

---

## Architecture

Synapse is a Vite + React 19 + TypeScript SPA. There is no backend in this repo.

| Piece | Location | Role |
| --- | --- | --- |
| Canvas | `src/components/ReactFlowCanvas.tsx` | Graph UI, connections, alignment, minimap |
| App state | `src/store.ts` | Zustand: nodes, edges, playlist library, playback flags |
| Path engine | `src/engine/buildPlaybackQueue.ts` | Pure graph walk, seeded RNG, caps |
| Playback | `src/playback/` | `PlaybackAdapter`, `YouTubeIframeAdapter`, YouTube id helper |
| Player | `src/Player.tsx` | Queue execution, Style interpolation, deck |
| Themes | `src/theme/` | Parse, presets, apply CSS variables, edge type, visualizer bars |
| Style nodes | `src/styleNode/` | Parse, layer merge, lerp, upstream collection |
| Conditionals | `src/conditional/`, `src/weather/` | Date/weather match, Open-Meteo provider |
| Playlists | `src/playlists/` | Library + sanitize/serialize `.synapse` |
| Settings | `src/settings/` | Versioned local settings |
| Profile | `src/profile/` | Local profile store |
| Tutorial | `src/tutorial/` | Catalog, spotlight, storage |
| Marketing | `src/pages/` | Home, workshop preview, legal, changelog |
| Routing | `src/app/routes.ts` | History API paths (no React Router) |

**Constraints worth knowing when you change code:**

- Do not persist Settings theme from Style playback (`setActiveId` is not for Style cues).
- Do not unmount `.synapse-deck-screen` (YouTube iframe); it stays the first child of `.synapse-deck`.
- Do not load/unload YouTube for settings UI.
- Imported theme/playlist JSON must not execute code; fonts stay on the allowlist.
- Do not invent cloud, Workshop publish, or billing APIs in the UI.

---

## Local data and privacy

Everything Synapse stores for the app is on-device. Playing a track still uses YouTube (their cookies/player apply). Weather uses Open-Meteo when a location is available.

| `localStorage` key | Data |
| --- | --- |
| `synapse_path_library` | Named Music Paths (nodes/edges) |
| `synapse_graph_state` | Legacy single-graph key (migrated into the library) |
| `synapse_theme_state` | Active theme id + custom themes |
| `synapse_app_settings` | App settings |
| `synapse_profile_state` | Local profile |
| `synapse_yt_metadata_v1` | Cached track credits |
| `synapse_tutorial_progress` | Tutorial progress |
| `synapse_geo_denied` | Geolocation denied flag (session-related weather helpers) |

Settings → **Privacy / Data** lists these keys and can clear metadata/weather caches or wipe Synapse’s local data. Clearing site data in the browser has the same effect. There is no Synapse server copy to restore from.

---

## Development

Stack: React 19, TypeScript, Vite 8, Zustand, `@xyflow/react`, Tailwind CSS 4, Vitest, Lucide icons.

Tests live next to the modules they cover (`*.test.ts`). Prefer `npm test` in `synapse-mvp/` before a release. `npm run build` must pass `tsc -b`.

**Do not commit** `.env`, tokens, or `env.txt.txt`. The Google Sheet agile webhook is documented in `scripts/google-apps-script/README.md` and is unrelated to running the player.

Changelog for the app: `synapse-mvp/CHANGELOG.md` (also mirrored under `doc/CHANGELOG.md`). In-app page: `/changelog`.

---

## Repository layout

```
Synapse/
  README.md                 ← this file
  synapse-mvp/              ← the Vite app (run here)
    src/engine/             Music Path walk
    src/playback/           YouTube adapter
    src/components/         canvas, inspector, nodes, settings UI
    src/pages/              marketing + legal
    src/playlists/          .synapse format + library
    src/theme/              presets + apply
    public/                 favicon, OG image
  doc/                      handoff notes, implementation status
  scripts/google-apps-script/  optional sprint-sheet webhook
```

---

## Related docs

| Doc | Use |
| --- | --- |
| `synapse-mvp/CHANGELOG.md` | User-facing history |
| `doc/IMPLEMENTATION_STATUS.md` | Audit-style status vs the original PDD |
| `doc/SYNAPSE_EXTENSIVE_FEATURES_HANDOFF.md` | Product feature intent (includes unshipped items) |
| `doc/SYNAPSE_CURSOR_HANDOFF.md` / `_V2.md` | Earlier engineering handoffs |
| `scripts/google-apps-script/README.md` | Agile spreadsheet webhook |

When in doubt, **the running code in `synapse-mvp/src` is the source of truth**, not a handoff that still lists a feature as missing.
