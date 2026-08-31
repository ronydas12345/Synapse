# Synapse — ChatGPT Handoff

**Handoff version:** `0.1.0`  
**App package:** `synapse-mvp` (`synapse-mvp/package.json` → `"version": "0.1.0"`)  
**Git snapshot:** `d6fc1a1` on `main` (ahead of `origin/main` by 1 commit; **do not push** unless the owner asks)  
**Date:** 2026-08-29  
**Runnable app:** `synapse-mvp/` only. Root `package.json` is leftover unused deps.

If older docs disagree with this file, **this file wins**. In particular, `synapse-mvp/IMPLEMENTATION_STATUS.md` still contains a stale “technical debt” section from before playback was extracted; ignore that section.

---

## What this product is

Synapse is a **visual, node-based music sequencer** for YouTube. Users build a **Music Path** (graph) instead of a normal playlist. Vision / PDD context lives in `synapse-mvp/SYNAPSE_CURSOR_HANDOFF.md`. Product notes PDF is untracked at `doc/synapse features.pdf`.

---

## What 0.1.0 added (most recent development)

Commit message: *Add YouTube playback engine and studio UI polish for synapse-mvp.*

This is the first snapshot where the **core loop can actually play YouTube video**:

1. `src/engine/` — pure path walker (`buildPlaybackQueue`) + seeded RNG (`createSeededRng`, Mulberry32) + `pickWeightedIndex`. No DOM, no YouTube.
2. `src/playback/` — `PlaybackAdapter` interface, `YouTubeIframeAdapter`, `extractYouTubeId` (raw 11-char IDs + youtu.be / watch / embed / shorts URLs).
3. `Player.tsx` — builds queue on Play, drives adapter, pause keeps session, skip via `skipRequestId`, bottom “deck” with embed + now-playing + queue index.
4. `App.tsx` — Play / Pause / Skip in the top bar.
5. Track nodes store **`songTitle`, `artist`, `album`** plus `videoId`, start/end, volume, speed. Inspector + canvas apply start/end/volume/speed on play (`speed` % → YouTube `playbackRate`).
6. Studio UI polish: dark theme, Outfit/Syne/IBM Plex Mono fonts, node chrome in `index.css`.

**How to verify:** `cd synapse-mvp && npm install && npm run dev` → Start → Track (paste a YouTube URL or 11-char ID) → Play. Video should appear in the bottom bar.

---

## Stack (current)

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript + Vite 8 |
| Canvas | `@xyflow/react` |
| State | Zustand (`src/store.ts`) |
| Style | Tailwind 4 + custom CSS variables in `src/index.css` |
| Persistence | `localStorage` key `synapse_graph_state` (nodes + edges only, **no path version field**) |
| Backend / auth / tests / deploy | None |

---

## Architecture (do not collapse this)

```
MusicPathEngine (src/engine)     ← graph walk, weights, time-range
        ↓
Queue keys: track:{nodeId} | transition:{nodeId}
        ↓
Player.tsx                       ← session, skip, transitions
        ↓
PlaybackAdapter                  ← YouTubeIframeAdapter today
```

Keep graph logic independent of YouTube so a later B2B audio API can swap the adapter only.

---

## Implemented node types

Toolbox in `Sidebar.tsx`:

| Type | Status |
|---|---|
| `start` | Required. Cannot delete (`id === 'start'`). |
| `track` | YouTube ID/URL, title/artist/album, playCount, start/end/volume/speed. |
| `conditional` (also `splitter`) | Weighted random **or** `timeRange` (hour 0–23). Handles `A`, `B`, … |
| `randomizer` | `sequence` or weighted random over linked track IDs; playCount / forever (capped at 100). Connecting Track → Randomizer auto-adds the track. |
| `transition` | `silence` (timer), custom `audio` (`HTMLAudioElement`), or YouTube `videoId`. |
| `comment` | Annotation; dashed comment edges; cannot be on the playback graph. |
| `end` | Terminal visual node. |

**Missing vs PDD:** dedicated Artist node, Genre node, skip-penalty, cooldown, BPM matching, analytics, named/versioned export, OAuth, Data API metadata cache.

---

## Playback / UX behavior to preserve

- Play with empty queue → `buildPlaybackQueueKeys({ nodes, edges })`. Empty result → status *Nothing to play — connect tracks from Start*.
- Pause mid-path **keeps** the queue (`sessionActiveRef`). Resume continues the same item.
- Path finished / session ended → queue cleared, *Path finished*.
- Skip increments `skipRequestId`; Player stops current media then advances (avoids stale YouTube `ENDED`).
- Tracks without a parsable `videoId` are skipped after a short delay.
- Connection rules: non-branching nodes get one outgoing edge; branching nodes one edge per handle; comments cannot connect as graph edges.

---

## What is still not done (next work, in order)

1. **Engine unit tests** with `createSeededRng` (highest value; engine is now pure).
2. **Named / versioned path JSON** (save/load/duplicate; schema `version` field — PDD wants this).
3. YouTube Data API metadata lookup + local cache (needs API key; do not invent credentials).
4. Artist / Genre nodes, skip-penalty, cooldown, export/share, analytics, auth, billing.

Pitch/EQ fields in the inspector are largely unused; YouTube speed is wired, true pitch/tempo is not.

---

## Files ChatGPT should read first

1. This file (`CHATGPT_HANDOFF.md`) — current snapshot.
2. `synapse-mvp/src/engine/` — path execution.
3. `synapse-mvp/src/playback/` — YouTube adapter.
4. `synapse-mvp/src/Player.tsx` — session + queue driver.
5. `synapse-mvp/src/store.ts` — graph + playback flags.
6. `synapse-mvp/SYNAPSE_CURSOR_HANDOFF.md` — product vision (PDD), not implementation truth.
7. `synapse-mvp/IMPLEMENTATION_STATUS.md` — useful matrix, but **stale in the “technical debt / Player returns null” bullets**.

---

## Constraints for the next assistant

- Do **not** `git push` unless the owner explicitly asks.
- Do **not** rebuild the canvas, Zustand store, or YouTube adapter from scratch.
- Do **not** couple the engine to the IFrame API.
- Prefer one high-value next task (tests or versioned save/load) over implementing the whole PDD.
