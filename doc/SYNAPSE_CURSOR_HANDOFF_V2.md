# Synapse — Cursor Handoff v2

**Document:** `SYNAPSE_CURSOR_HANDOFF_V2.md`  
**Handoff version:** `0.2.0`  
**Date:** 2026-08-29  
**Project:** `synapse-mvp`  
**Current application version:** `0.1.0`  
**Current git snapshot:** `d6fc1a1` on `main`  
**Important:** Do **not** `git push` unless explicitly requested by the project owner.

---

# 1. Purpose of This Handoff

This document is the **Version 2 implementation handoff for Cursor**.

It combines:

1. The future-feature requirements from `synapse features.pdf`.
2. The implementation audit in `IMPLEMENTATION_STATUS.md`.
3. The most recent development state in `CHATGPT_HANDOFF.md`.
4. The original product/architecture guidance in `SYNAPSE_CURSOR_HANDOFF.md`.

## Source-of-truth priority

If documents disagree, use this order:

1. **Actual repository code**
2. **`CHATGPT_HANDOFF.md`** — most recent known development state
3. **`synapse features.pdf`** — future feature requirements
4. **`IMPLEMENTATION_STATUS.md`** — useful historical audit, but stale where it conflicts with the current handoff
5. **`SYNAPSE_CURSOR_HANDOFF.md`** — product vision and architectural context

The current codebase must always be inspected before changing or rebuilding functionality.

---

# 2. What Synapse Is

Synapse is a **visual, node-based music sequencer** for YouTube.

It is not intended to be a conventional playlist or a simple shuffle button.

Users construct a **Music Path**: a graph that determines how music is selected, branched, modified, transitioned, and played.

Core mental model:

```text
Music Source
    ↓
Nodes
    ↓
Rules / Weights / Conditions
    ↓
Track Selection
    ↓
Track Controls / Transitions
    ↓
Playback
    ↓
Analytics
```

The long-term goal is a visual programming environment for music playback.

---

# 3. Current State — 0.1.0

The latest handoff states that the current application can execute the core path and play YouTube video through an adapter.

## Current stack

| Layer | Current implementation |
|---|---|
| UI | React 19 + TypeScript + Vite 8 |
| Canvas | `@xyflow/react` |
| State | Zustand (`src/store.ts`) |
| Styling | Tailwind 4 + custom CSS variables |
| Persistence | `localStorage` |
| Playback | `PlaybackAdapter` + `YouTubeIframeAdapter` |
| Path engine | `src/engine/` |
| Backend | None |
| Database | None |
| Authentication | None |
| Automated tests | None |
| Deployment | None |

## Current architecture

Do **not** collapse this architecture.

```text
MusicPathEngine
    ↓
Queue Keys
    ↓
Player.tsx
    ↓
PlaybackAdapter
    ↓
YouTubeIframeAdapter
```

The engine must remain independent of YouTube.

The long-term architecture should allow:

```text
MusicPathEngine
    ↓
Track Selection
    ↓
PlaybackAdapter
    ├── YouTubeIframeAdapter
    └── B2BMusicProviderAdapter
```

This separation is required for the eventual migration away from YouTube.

---

# 4. Already Implemented — Preserve These

Do not rebuild these from scratch unless inspection proves they are actually broken.

## 4.1 Graph editor

The current application already has:

- Zoomable node canvas.
- Node creation.
- Drag/drop behavior.
- Node selection.
- Node deletion.
- Node connections.
- Branching connections.
- React Flow canvas.
- Zustand state.
- Local graph persistence.
- Start node protection.

## 4.2 Current node types

| Node | Current state | Function |
|---|---|---|
| Start | Implemented | Entry point of a Music Path |
| Track | Implemented | Represents a specific YouTube track |
| Conditional / Splitter | Implemented | Chooses between branches using weights or time ranges |
| Randomizer | Implemented | Selects among linked tracks using sequence or weighted random behavior |
| Transition | Implemented | Inserts silence, custom audio, or YouTube media |
| Comment | Implemented | Adds non-playback annotations to a graph |
| End | Implemented | Terminal node |

## 4.3 Current Track metadata

Track nodes currently support:

- `videoId`
- `songTitle`
- `artist`
- `album`
- `playCount`
- `start`
- `end`
- `volume`
- `speed`

The structured `songTitle`, `artist`, and `album` fields are important and must be preserved.

Do not redesign tracks around a YouTube URL alone.

## 4.4 Current playback behavior

Preserve:

- Play.
- Pause.
- Skip.
- Current-track display.
- Queue index.
- YouTube IFrame playback.
- Pause/resume of the active session.
- Queue persistence during pause.
- Skip request handling.
- Track completion handling.
- Skipping invalid/unparseable video IDs.
- Track start/end/volume behavior.
- YouTube playback speed behavior.

## 4.5 Current path engine

`src/engine/` contains the pure path execution logic.

Current concepts include:

- `buildPlaybackQueue`
- `createSeededRng`
- `pickWeightedIndex`
- Weighted selection.
- Time-range selection.

The engine should remain testable without a browser or YouTube.

---

# 5. Feature Status

The following classification is the starting point for Version 2.

| Feature | Status | Priority |
|---|---|---|
| Node canvas | DONE | — |
| Track node | DONE / PARTIAL | P0 |
| Weighted branching | DONE | P0 |
| Randomizer | DONE | P0 |
| YouTube playback | DONE / PARTIAL | P0 |
| Play / Pause / Skip | DONE / PARTIAL | P0 |
| Structured track metadata | DONE | P0 |
| Track start/end | IMPLEMENTED | P1 |
| Track volume | IMPLEMENTED | P1 |
| Track playback speed | IMPLEMENTED | P1 |
| Engine tests | MISSING | P0 |
| Named paths | MISSING | P1 |
| Versioned path format | MISSING | P1 |
| Duplicate paths | MISSING | P1 |
| Export paths | MISSING | P1/P2 |
| Import paths | MISSING | P1/P2 |
| YouTube metadata lookup | MISSING | P1 |
| Metadata cache | MISSING | P1 |
| Artist node | MISSING | P2 |
| Genre node | MISSING | P2 |
| Time-of-day behavior | PARTIAL | P2 |
| Skip penalty | MISSING | P2 |
| Cooldown | MISSING | P2 |
| Advanced transitions | PARTIAL | P2 |
| BPM matching | MISSING | P3 |
| True tempo/pitch | MISSING / technically uncertain | P3 |
| User profiles | MISSING | P2 |
| Profile statistics | MISSING | P2/P3 |
| Public/private profiles | MISSING | P2 |
| Public/private playlists | MISSING | P2 |
| Playlist sharing | MISSING | P2 |
| Public workshop | MISSING | P2 |
| Google OAuth | MISSING | P2 |
| Firebase/RBAC authentication | MISSING | P2 |
| Cloud playlist storage | MISSING | P2 |
| Settings | MISSING / PARTIAL | P1/P2 |
| Light/dark mode | PARTIAL / current dark theme | P1 |
| Playing/editing screen separation | MISSING | P2 |
| Future-song visualization | MISSING | P2 |
| Audio visualizer | MISSING | P2 |
| Large play button | MISSING | P2 |
| Song controls in playing screen | PARTIAL | P2 |
| Analytics | MISSING | P3 |
| Banner ads | MISSING | P3 |
| Mid-roll ads | MISSING | P3 |
| Mid-roll warning marker | MISSING | P3 |
| Premium system | MISSING | P3 |
| B2B music API migration | Future | P3 |
| Production deployment | MISSING | P3 |

---

# 6. Version 2 Development Strategy

Do not attempt to implement every feature simultaneously.

Build Version 2 in layers:

```text
V2.1 — Reliability
    ↓
V2.2 — Path Management
    ↓
V2.3 — Metadata
    ↓
V2.4 — Advanced Nodes
    ↓
V2.5 — Player / Studio UX
    ↓
V2.6 — Accounts + Profiles + Cloud
    ↓
V2.7 — Workshop + Sharing
    ↓
V2.8 — Analytics
    ↓
V2.9 — Monetization
    ↓
V3 — Licensed Music Provider Migration
```

---

# 7. V2.1 — Reliability and Core Engineering

## 7.1 Engine unit tests

**Priority: P0**

Create tests for:

- Straight-line paths.
- Branching paths.
- Weighted selection.
- Seeded deterministic selection.
- Invalid weights.
- Missing connections.
- Time-range conditions.
- Randomizer behavior.
- End nodes.
- Transition nodes.
- Cycles / runaway paths.
- Invalid track nodes.

The engine must be independently testable.

## 7.2 Path execution safety

Add protections against:

- Infinite graph loops.
- Invalid node references.
- Missing targets.
- Broken edges.
- Invalid configurations.
- Impossible paths.

The engine should fail gracefully instead of freezing the application.

## 7.3 Playback error handling

Improve UX for:

- Invalid YouTube IDs.
- Deleted/private videos.
- Playback failures.
- Network failures.
- Unsupported media.
- Track completion problems.

Do not allow a single broken track to permanently stop the path.

---

# 8. V2.2 — Named and Versioned Music Paths

The current graph is persisted anonymously in `localStorage`.

Replace this with a proper path model while preserving local persistence as a fallback.

## Required functionality

Users should be able to:

- Create a named Music Path.
- Rename a Music Path.
- Save a Music Path.
- Load a Music Path.
- Duplicate a Music Path.
- Delete a Music Path.
- Create multiple Music Paths.
- Switch between Music Paths.
- Recover the last active path.

## Versioned format

Use a portable format conceptually similar to:

```json
{
  "version": 1,
  "id": "path-id",
  "name": "Late Night Focus",
  "nodes": [],
  "edges": [],
  "settings": {}
}
```

Do not blindly adopt this exact schema if the repository's existing types suggest a better structure.

The important requirements are:

- Explicit version.
- Stable path identity.
- Named path.
- Nodes.
- Edges.
- Path settings.

## Migration requirement

If the old `synapse_graph_state` format exists, provide a migration path instead of silently losing user graphs.

---

# 9. V2.3 — YouTube Metadata System

## Goal

When a user enters a YouTube video, Synapse should be able to populate:

- Song title.
- Artist.
- Album.

The feature described in the product notes specifically calls for autofilling album, artist, and track information for each track node.

## Requirements

- YouTube Data API integration.
- API credentials loaded through environment configuration.
- No credentials hardcoded in source.
- Metadata cache.
- Avoid repeated API requests.
- Graceful behavior when API access is unavailable.

## Cache behavior

Cache metadata by a stable identifier such as:

```text
youtubeVideoId
```

Do not request metadata every time a node is:

- dragged.
- selected.
- moved.
- visually edited.
- connected.

The API quota must be treated as a limited resource.

## Metadata model

Preserve structured fields:

```text
youtube_id
song_title
artist
album
metadata
```

This is also required for future migration to a different music provider.

---

# 10. V2.4 — Advanced Music Nodes

## 10.1 Artist Node

**Purpose:** select music based on an artist rather than one fixed track.

Expected behavior:

```text
Artist Node
    ↓
Resolve eligible tracks
    ↓
Select according to configured rules
```

Settings should eventually include:

- Artist.
- Weight.
- Constraints.
- Cooldown interaction.
- Skip-penalty interaction.

Do not hardcode a specific music catalog into the node.

## 10.2 Genre Node

**Purpose:** select tracks belonging to a genre.

Settings:

- Genre.
- Weight.
- Constraints.

Genres should support a searchable selection where a metadata source is available.

## 10.3 Path Splitter

The existing conditional/splitter implementation should remain.

Improve:

- Naming clarity.
- Branch labels.
- Weight editing.
- Weight validation.
- Deterministic testing.
- Visual representation.

## 10.4 Time-of-Day Trigger

The current conditional time-range functionality should be retained and improved.

Example:

```text
Before 10 PM
    ↓
Normal Music

After 10 PM
    ↓
Ambient / Acoustic
```

Eventually this may become a dedicated node.

---

# 11. V2.5 — Adaptive Logic

## 11.1 Skip Penalty

Purpose:

If a user skips a track quickly, reduce the chance of selecting it again.

Example conceptual behavior:

```text
Track played
    ↓
Skipped within threshold
    ↓
Penalty applied
    ↓
Future selection weight reduced
```

The implementation must define:

- Skip threshold.
- Penalty amount.
- Recovery/decay.
- Track vs artist scope.
- Persistence.
- Maximum penalty.

These details are not fully specified by the product requirements, so design them before implementation.

## 11.2 Cooldown

Purpose:

Prevent repeated artists/tracks from appearing too frequently.

Example:

```text
Artist X
Cooldown: 45 minutes
```

During the cooldown window, the engine treats the entity as temporarily unavailable.

Cooldown should be compatible with:

- Artist nodes.
- Track nodes.
- Randomizer.
- Splitter.
- Skip penalty.

## 11.3 Dynamic weighting

Eventually allow the effective weight of a branch or track to depend on runtime state.

Potential inputs:

- Recent plays.
- Skips.
- Cooldowns.
- Time.
- User preferences.

Keep the base configured weight separate from dynamic modifiers.

---

# 12. V2.6 — Playing Screen vs Editing Screen

The product requirements call for a dedicated separation between:

1. **Editing / Studio**
2. **Playing / Listening**

## Editing screen

Optimized for:

- Graph construction.
- Node configuration.
- Connecting branches.
- Editing metadata.
- Managing Music Paths.

## Playing screen

Optimized for:

- Current track.
- Large play/pause control.
- Skip.
- Song controls.
- Visualizer.
- Upcoming songs.
- Current path position.
- Branch/splitting visualization.
- Returning to desired branches.

The playing screen should not require the user to operate the graph editor while listening.

---

# 13. V2.7 — Player Experience

## Bottom / main player

Display:

- Current song title.
- Artist.
- Album.
- Current video.
- Play/pause.
- Skip.
- Progress.
- Queue position.

## Future queue visualization

Show upcoming path decisions rather than only a linear playlist.

Example:

```text
CURRENT
   ↓
Splitter
   ├── 70% → Track A
   └── 30% → Track B
              ↓
          Track C
```

Where the exact future route is already known, visualize it.

Where it is not known until execution, show the possible branches.

## Audio visualizer

Provide a visual representation of currently playing audio where technically possible.

The visualizer should be tied to playback state and should not be allowed to interfere with path execution.

---

# 14. V2.8 — User Profiles

The product notes require a profile system capable of capturing music-related information.

## Required profile fields

### Mandatory

- Unique `@username`.
- Display Name.

### Optional

- Profile picture.
- Location.
- Bio.
- Favorite genres.
- Favorite songs.
- Public playlists.
- Total listens.
- Average listens.
- Activity graph.

## Profile editing

Users should be able to:

- Edit profile.
- Add/remove optional sections.
- Reorder optional sections where practical.
- Control profile visibility.

Do not require optional fields.

---

# 15. V2.9 — Public / Private Music Paths and Playlists

Users should be able to choose whether a Music Path or playlist is:

- Public.
- Private.

## Public content

Public Music Paths should expose:

- Name.
- Description where supported.
- Creator.
- Preview/graph information where appropriate.
- Track information where legally/technically appropriate.
- Play/use action.

## Private content

Private paths should not appear in:

- Public profiles.
- Workshop discovery.
- Public search.

Access control must be enforced by the backend once cloud storage exists.

---

# 16. V2.10 — Sharing

Users should be able to:

- Share Music Paths.
- View another user's public profile.
- Open public playlists.
- Copy/duplicate a public Music Path into their own workspace.

A shared path must not grant edit access to the owner's original path.

Conceptual flow:

```text
Public Path
    ↓
View
    ↓
Use / Duplicate
    ↓
User's independent copy
```

---

# 17. V2.11 — Authentication and Cloud Storage

The product notes specify:

- RBAC-based authentication using Firebase.
- Google OAuth.
- Cloud storage for playlists.

## Authentication goals

Users should be able to:

- Create/sign into an account.
- Connect Google.
- Maintain a persistent identity.
- Sign out.
- Protect private content.

## RBAC

At minimum, design around:

```text
User
Admin
```

Do not build complicated roles until required.

## Cloud data

A future backend should support:

```text
User
MusicPath
PathNode
PathEdge
Song
Playlist
ExecutionEvent
```

Do not throw away the existing graph model merely to introduce a backend.

---

# 18. V2.12 — Public Workshop

Create a public discovery area where users can browse:

- Public Music Paths.
- Public playlists.
- Public profiles.

Potential discovery controls:

- Search.
- Genre.
- Creator.
- Popularity.
- Recent.
- Most used.
- Trending.

The workshop should consume public data rather than exposing private database records.

---

# 19. V2.13 — Profile Statistics

Capture music-related statistics such as:

- Total listens.
- Average listens.
- Listening activity over time.
- Most-played artists.
- Most-played tracks.
- Most-used Music Paths.

Use actual playback/path execution events as the source of truth.

Do not calculate analytics from page views alone.

---

# 20. V2.14 — Analytics Dashboard

Analytics should eventually answer:

- Which branches are selected most?
- Which tracks are selected most?
- Which artists appear most?
- Which paths are rarely reached?
- How often are tracks skipped?
- Which branches lead to skips?
- Which Music Paths are used most?

## Event model

Conceptually:

```text
ExecutionEvent
- path_id
- node_id
- song_id
- event_type
- timestamp
- metadata
```

Potential event types:

```text
PATH_STARTED
BRANCH_SELECTED
TRACK_STARTED
TRACK_COMPLETED
TRACK_SKIPPED
TRANSITION_STARTED
PATH_COMPLETED
```

---

# 21. V2.15 — Transition System

The existing Transition node supports:

- Silence.
- Custom audio.
- YouTube media.

Improve the node so transitions are reliable and configurable.

Potential transition uses:

- Silence.
- Sound effects.
- DJ-style voiceover.
- Intro/outro audio.
- Custom transition clips.

The transition system must remain behind the playback abstraction where possible.

---

# 22. V2.16 — BPM Matching

**Priority: P3**

The BPM feature should attempt to select tracks with a similar tempo.

Conceptual flow:

```text
Current Track BPM
       ↓
BPM Matching Node
       ↓
Find compatible candidates
       ↓
Select next track
```

This requires reliable BPM metadata.

Do not implement fake BPM matching based on guessed values.

If reliable BPM data is unavailable, mark the feature BLOCKED rather than pretending it works.

---

# 23. V2.17 — Tempo and Pitch

The current inspector contains speed-related controls, but true pitch/tempo processing is not fully implemented.

YouTube playback speed is already wired.

True independent:

- Tempo.
- Pitch.

should only be implemented if the playback technology supports it reliably.

Do not build a misleading UI that claims independent pitch shifting when the underlying player cannot provide it.

---

# 24. V2.18 — Settings

Create a settings area supporting:

- Light/dark mode.
- User preferences.
- Switching between Music Paths.
- Default crossfade.
- API synchronization frequency.
- Playback preferences.
- Account settings.
- Privacy settings.

Settings should have a clear separation between:

```text
Account
Appearance
Playback
Music Path
Privacy
Advanced
```

Do not create settings for functionality that does not yet exist.

---

# 25. V2.19 — Ads

The product notes specify:

- Banner ads.
- Ads between songs.
- A yellow warning marker before a mid-roll advertisement.

This is a future monetization feature.

## Mid-roll UX

Before an ad plays:

```text
[Yellow marker]
Advertisement coming up
```

The user should receive advance notice.

Do not add advertising until the core listening experience is stable.

---

# 26. V2.20 — Premium

The original product vision describes a future premium tier.

Potential premium functionality includes:

- Ad-free listening.
- Unlimited cloud Music Paths.
- Export/save capabilities.
- Advanced nodes.
- BPM matching.
- Advanced time-of-day logic.

Do not implement billing before authentication, cloud storage, and entitlement checks are stable.

---

# 27. Future Music Provider Migration

The long-term architecture must support migration away from YouTube.

The conceptual rollout is:

```text
Phase 1
YouTube IFrame
0–10k MAU

        ↓

Phase 2
Licensed B2B music provider
~10k MAU

        ↓

Phase 3
Premium product
50k+ MAU
```

Potential B2B providers identified in the product documentation include:

- 7digital.
- Feed.fm.

These are future architectural considerations, not a requirement to integrate them immediately.

## Migration requirement

Structured track metadata is essential:

```text
Song Title
Artist
Album
```

When migrating, the system can search the new provider using these fields.

If an exact equivalent cannot be found:

```text
Track Node → YELLOW / NEEDS MATCH
```

The user can then manually replace the track.

---

# 28. Database Direction

Once cloud functionality is introduced, the conceptual domain model should include:

## User

```text
id
auth_information
username
display_name
profile
settings
created_at
```

## MusicPath

```text
id
user_id
name
description
version
visibility
created_at
updated_at
```

## PathNode

```text
id
path_id
type
position
configuration
```

## PathEdge

```text
id
path_id
source_node_id
target_node_id
weight
configuration
```

## Song

```text
id
youtube_id
song_title
artist
album
metadata
```

## ExecutionEvent

```text
id
path_id
node_id
song_id
event_type
timestamp
metadata
```

This is a conceptual model. Inspect the existing repository before selecting a database technology or replacing current structures.

---

# 29. Architecture Rules

## Rule 1 — Do not rebuild working systems

Before modifying:

- Canvas.
- Zustand.
- Playback adapter.
- Path engine.

inspect the implementation.

## Rule 2 — Keep engine and playback separate

Never make `MusicPathEngine` depend directly on YouTube APIs.

## Rule 3 — Structured metadata

Never make the database depend solely on YouTube URLs.

## Rule 4 — Cache external API data

YouTube metadata requests must be cached.

## Rule 5 — Keep node behavior modular

Each node type should have:

- Identity.
- Configuration.
- Validation.
- Execution behavior.
- UI representation.

## Rule 6 — Keep the engine deterministic when requested

Seeded randomness must remain possible for:

- Testing.
- Debugging.
- Reproducing bugs.

## Rule 7 — Version saved data

Saved Music Paths must have a version.

## Rule 8 — Do not hardcode secrets

API keys, Firebase credentials, and other secrets belong in appropriate environment/configuration mechanisms.

## Rule 9 — Graceful degradation

If an external service is unavailable, the application should remain usable where possible.

## Rule 10 — Do not claim functionality that is only visual

A button or inspector field does not mean its underlying behavior is implemented.

---

# 30. Recommended Implementation Order

Cursor should work through the following order unless repository inspection reveals a more urgent blocker.

## P0 — Core reliability

- [ ] Inspect current repository.
- [ ] Run the current application.
- [ ] Run/build existing code.
- [ ] Add engine unit tests.
- [ ] Test weighted selection.
- [ ] Test seeded RNG.
- [ ] Test path execution.
- [ ] Harden invalid graph handling.
- [ ] Harden playback errors.

## P1 — Path management

- [ ] Named Music Paths.
- [ ] Multiple paths.
- [ ] Save/load.
- [ ] Duplicate.
- [ ] Versioned JSON.
- [ ] Migration from old localStorage format.
- [ ] Import/export foundation.

## P1 — Metadata

- [ ] YouTube metadata lookup.
- [ ] Album/artist/title autofill.
- [ ] Local metadata cache.
- [ ] API quota protection.

## P2 — Advanced path logic

- [ ] Artist node.
- [ ] Genre node.
- [ ] Time-of-day UX.
- [ ] Skip penalty.
- [ ] Cooldown.
- [Dynamic weighting].

## P2 — Listening experience

- [ ] Separate editing and playing screens.
- [ ] Future-path visualization.
- [ ] Improved player.
- [ ] Progress controls.
- [ ] Audio visualizer.
- [ ] Large play button.
- [ ] Improved queue/path display.

## P2 — Social/cloud

- [ ] Firebase authentication.
- [ ] Google OAuth.
- [ ] User profile.
- [ ] Public/private paths.
- [ ] Public/private playlists.
- [ ] Cloud persistence.
- [ ] Sharing.
- [Public workshop].

## P3 — Analytics

- [ ] Execution event model.
- [ ] Listening statistics.
- [ ] Branch statistics.
- [ ] Track/artist statistics.
- [ ] Analytics dashboard.

## P3 — Monetization

- [ ] Banner ads.
- [ ] Mid-roll ads.
- [ ] Warning markers.
- [ ] Premium entitlements.
- [ ] Subscription system.

## P3 — Advanced playback

- [ ] BPM metadata.
- [ ] BPM matching.
- [ ] True tempo/pitch if technically supported.
- [ ] Future B2B playback adapter.

---

# 31. Immediate Cursor Mission

Do **not** start by implementing the entire feature list.

Start with:

### Step 1 — Audit

Inspect:

```text
synapse-mvp/package.json
synapse-mvp/src/
synapse-mvp/src/engine/
synapse-mvp/src/playback/
synapse-mvp/src/Player.tsx
synapse-mvp/src/store.ts
synapse-mvp/src/Sidebar.tsx
synapse-mvp/src/App.tsx
```

Also inspect:

- Tests.
- Environment files.
- Build configuration.
- Existing persistence.
- Existing types.

### Step 2 — Verify current behavior

Run:

```bash
cd synapse-mvp
npm install
npm run dev
```

Verify at minimum:

```text
Start → Track → Play
Start → Splitter → Track A / Track B → Play
Pause → Resume
Skip
```

### Step 3 — Add tests

Highest-value immediate engineering task:

**Test `src/engine/` thoroughly using the seeded RNG.**

### Step 4 — Implement versioned path persistence

After tests pass:

- Named paths.
- Versioned schema.
- Save/load.
- Duplicate.
- Migration from current localStorage.

### Step 5 — Implement metadata

Then:

- YouTube metadata lookup.
- Cache.
- Autofill title/artist/album.

### Step 6 — Continue down the roadmap

Do not jump to authentication, ads, analytics, or BPM matching while the local core remains unstable.

---

# 32. Definition of a Strong V2 Core

Before calling the core of Version 2 complete, a user should be able to:

1. Open Synapse.
2. Create multiple Music Paths.
3. Name and save them.
4. Reload them without losing graph configuration.
5. Add Track, Randomizer, and Splitter nodes.
6. Connect nodes.
7. Configure branch weights.
8. Execute a path reliably.
9. Play YouTube tracks.
10. Pause and resume.
11. Skip tracks.
12. See current-track metadata.
13. Automatically populate metadata where API access is available.
14. Use start/end/volume/speed controls.
15. Have invalid tracks fail gracefully.
16. Export/import a versioned path.
17. Duplicate an existing path.
18. Run the path engine through automated tests.

Only after this foundation is reliable should social, analytics, monetization, and provider migration receive major development effort.

---

# 33. Final Product Mental Model

Synapse should ultimately feel like:

```text
                    ┌─────────────────┐
                    │  Time Trigger   │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Path Splitter   │
                    └──────┬───┬──────┘
                         70%  30%
                          ↓    ↓
                    ┌─────┐  ┌─────┐
                    │ Pop │  │Lo-Fi│
                    └──┬──┘  └──┬──┘
                       └────┬───┘
                            ↓
                     Track Selection
                            ↓
                      Transition
                            ↓
                         Playback
                            ↓
                        Analytics
```

The graph is the core product.

The player executes the graph.

The account system stores and shares the graph.

The analytics system learns from execution.

The future provider abstraction allows the playback system to change without rewriting the graph.

---

# 34. Version 2 Success Criteria

Version 2 should prioritize **making Synapse a reliable product**, not merely adding the largest number of UI features.

The development philosophy is:

```text
Reliable Core
    ↓
Persistent Music Paths
    ↓
Accurate Metadata
    ↓
Smarter Selection
    ↓
Better Listening UX
    ↓
Accounts / Profiles / Sharing
    ↓
Analytics
    ↓
Monetization
    ↓
Licensed Music Infrastructure
```

Every new feature should strengthen the Music Path concept rather than turn Synapse into a conventional playlist application.

---

# 35. Source Notes

The product feature document specifies, among other things:

- Track metadata autofill.
- Current-track metadata display.
- Firebase/RBAC authentication.
- Google OAuth.
- Music-focused user profiles.
- Public/private playlists and profiles.
- Sharing.
- Settings.
- Ads and mid-roll warnings.
- Public workshop.
- Separate playing/editing experiences.
- Future-song visualization.
- Audio visualization and playback controls.

The latest development handoff establishes that the application is currently at version `0.1.0`, with a working YouTube playback adapter, pure path engine, structured track metadata, and current node implementations. It also explicitly identifies engine tests, versioned path persistence, metadata lookup/cache, and later advanced/social features as remaining work.

This Version 2 document should therefore be treated as the **development roadmap and implementation handoff**, while the repository remains the final authority on what is actually implemented.
