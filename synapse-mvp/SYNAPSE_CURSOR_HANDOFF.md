# Synapse — YouTube Music Advanced Shuffler
## Development Handoff / Cursor Project Brief

> **Source of truth:** `Synapse PDD.pdf` supplied with this project.
>
> **Important status note:** The PDD describes the product vision, architecture, features, technical considerations, and rollout strategy, but it does **not** document the current codebase, implemented screens, completed modules, APIs already connected, database schema, or known bugs. Therefore, this document deliberately does **not** claim that any feature is already implemented unless the PDD explicitly says so.
>
> The first job for Cursor is to inspect the existing repository and convert the **UNKNOWN implementation status** below into an accurate code-based status report.

---

# 1. What Is Synapse?

Synapse is envisioned as a visual, node-based music sequencing application built around YouTube Music.

Instead of giving users a conventional random playlist, the product lets power users construct a **Music Path** — a visual graph describing how tracks should be selected and played.

The central concept is:

**Music source → nodes → weighted decisions → conditional paths → track-level controls → playback**

The PDD describes the interface as similar to a visual scripting environment such as Blender's node editor or an advanced audio workstation.

The product is intended to turn music shuffling into an interactive programming experience.

---

# 2. Core Product Vision

The user should eventually be able to:

1. Log in/connect to the relevant YouTube ecosystem.
2. Create a visual Music Path.
3. Drag nodes onto an infinite/zoomable canvas.
4. Connect nodes together.
5. Define rules for what music can play next.
6. Assign probabilities/weights to branches.
7. Control individual tracks at a granular level.
8. Add conditional logic.
9. Prevent repetition through cooldown rules.
10. Potentially match BPM/tempo.
11. Insert transition elements.
12. Save and share Music Paths.
13. Analyze which branches and tracks are actually being selected.
14. Eventually migrate from YouTube playback to a licensed B2B music API.

---

# 3. Current Project Status

## What the supplied PDD proves

The supplied PDD establishes:

- Product concept and positioning.
- Workspace-oriented UI architecture.
- Node-based Music Path concept.
- Weighting system.
- Individual track micro-controls.
- Conditional logic concepts.
- Advanced node concepts.
- Export/import concept.
- Analytics concept.
- YouTube API considerations.
- State-management requirements.
- Three-phase monetization/technical migration strategy.
- Database requirements for future migration.

## What the PDD does NOT prove

The PDD does not establish that any of the following already exists:

- Working frontend.
- Working node editor.
- Working YouTube authentication.
- Working YouTube playback.
- Working database.
- Working API integration.
- Working weighting engine.
- Working path execution engine.
- Working drag/drop system.
- Working track metadata pipeline.
- Working analytics.
- Working export/import.
- Working billing.
- Production deployment.
- Automated tests.
- Security/authentication hardening.

**Therefore Cursor must inspect the actual repository before assigning implementation-complete status.**

---

# 4. Required First Action for Cursor

Before writing substantial new code:

## Audit the existing repository

Inspect:

- `package.json`
- framework and build system
- source directories
- routes/pages
- components
- hooks
- state management
- API routes/server functions
- database configuration
- schema/migrations
- authentication
- YouTube integration
- playback implementation
- node/canvas implementation
- styling/design system
- environment variables
- deployment configuration
- tests
- README/documentation

Then produce an implementation audit with:

| Area | Status | Evidence | Missing Work |
|---|---|---|---|
| App shell | UNKNOWN → audit | repository evidence | — |
| Node canvas | UNKNOWN → audit | repository evidence | — |
| Node types | UNKNOWN → audit | repository evidence | — |
| Path execution | UNKNOWN → audit | repository evidence | — |
| YouTube integration | UNKNOWN → audit | repository evidence | — |
| Playback | UNKNOWN → audit | repository evidence | — |
| Database | UNKNOWN → audit | repository evidence | — |
| Authentication | UNKNOWN → audit | repository evidence | — |
| Weighting | UNKNOWN → audit | repository evidence | — |
| Track controls | UNKNOWN → audit | repository evidence | — |
| Conditional logic | UNKNOWN → audit | repository evidence | — |
| Analytics | UNKNOWN → audit | repository evidence | — |
| Export/import | UNKNOWN → audit | repository evidence | — |
| Billing | UNKNOWN → audit | repository evidence | — |
| Testing | UNKNOWN → audit | repository evidence | — |
| Deployment | UNKNOWN → audit | repository evidence | — |

Do not rebuild working functionality merely because this document lists it.

---

# 5. UI Architecture

The PDD specifies three major workspace regions.

## 5.1 Top Bar

Should contain:

- User account.
- OAuth status / YouTube Music login status.
- Global Play.
- Pause.
- Skip.
- Global settings.
- Dark/light mode.
- Default crossfade.
- API synchronization frequency.

## 5.2 Left Sidebar

The sidebar has two modes.

### Mode A — Toolbox

Drag-and-drop node library:

- Add Track
- Add Artist
- Add Genre
- Add Randomizer Node
- Add Path Splitter

### Mode B — Settings Inspector

When a node is selected, the sidebar becomes a contextual inspector.

The inspector should expose settings appropriate to the selected node.

Example:

**Track Node**
- Track metadata.
- Start time.
- End time.
- Volume override.
- Tempo/pitch settings if supported.

**Artist Node**
- Artist selection.
- Weight.
- Constraints.

**Genre Node**
- Genre selection.
- Weight.
- Constraints.

**Splitter Node**
- Branches.
- Percentage weights.

## 5.3 Main Canvas

The primary workspace is a:

- zoomable workspace
- potentially infinite canvas
- node graph
- connection editor
- Music Path builder

Users connect nodes to describe the listening path.

---

# 6. MVP Node System

The PDD's foundational examples include:

### Track Node

Represents a specific song.

Expected future metadata:

- YouTube identifier/reference.
- Song title.
- Artist.
- Album.

Important database requirement from the PDD:

**Do not store only the YouTube URL.**

Store:

- `song_title`
- `artist`
- `album`

as distinct fields.

This is specifically intended to make the later Phase 2 migration to another music API easier.

### Artist Node

Represents an artist-based selection rule.

Possible future behavior:

> Select a track by this artist according to configured rules.

### Genre Node

Represents a genre-based selection rule.

Possible future behavior:

> Select music belonging to this genre.

### Randomizer Node

Introduces randomized selection.

### Path Splitter Node

Chooses between branches according to weights.

Example:

```text
                 ┌── 70% → Upbeat Pop
Splitter ────────┤
                 └── 30% → Lo-Fi
```

---

# 7. Weighting Engine

One of the most important pieces of product logic.

The PDD requires percentage-based branch selection.

Example:

- Pop = 70%
- Lo-fi = 30%

The engine should:

1. Read all valid outgoing branches.
2. Read their configured weights.
3. Validate weights.
4. Normalize if the UX permits non-100 totals.
5. Select a branch probabilistically.
6. Continue path execution.

The architecture should make weighting deterministic/testable when a random seed is supplied.

This is important for debugging.

---

# 8. Track-Level Micro Controls

The PDD specifies three important controls.

## 8.1 Custom Start/End

Users can configure:

- custom start time
- custom end time

Purpose:

- skip long intros
- skip silence
- control the useful portion of a track

## 8.2 Volume Normalization Override

A track may have a custom volume adjustment.

Purpose:

- boost quieter songs
- reduce louder songs
- improve consistency across a Music Path

## 8.3 Tempo/Pitch

Potentially support:

- BPM/tempo adjustment
- pitch adjustment

This is explicitly conditional on whether the selected playback framework supports it.

Cursor should verify technical feasibility before implementing this as a guaranteed capability.

---

# 9. Advanced Conditional Logic

These are advanced features beyond the basic node system.

## 9.1 Time-of-Day Trigger

Example:

```text
Current time > 10:00 PM
        ↓
Ambient / Acoustic Path
```

The node checks local time and chooses a branch.

## 9.2 Skip-Penalty Logic

If the user skips a track very quickly, for example within 15 seconds:

- reduce the future weight of the song and/or artist.

This creates adaptive behavior.

The system should define:

- skip threshold
- penalty amount
- decay/recovery behavior
- scope: track vs artist vs both
- persistence

These details are not fully specified in the PDD and should be designed before implementation.

## 9.3 Cooldown Timer

Prevent an artist from appearing again within a configured interval.

Example:

```text
Artist: Artist X
Cooldown: 45 minutes
```

The path engine should treat the artist as temporarily unavailable.

---

# 10. Advanced Node Types

## 10.1 Transition Node

Potentially inserts:

- sound effect
- silence
- DJ voiceover

between tracks.

## 10.2 BPM Matching Node

Attempts to choose the next track based on a tempo similar to the currently playing track.

This should be treated as an advanced feature because it depends on reliable BPM metadata and/or audio capabilities.

---

# 11. Path Persistence

Users should eventually be able to:

- save Music Paths
- reopen Music Paths
- duplicate Music Paths
- export Music Paths
- import Music Paths
- share Music Paths

The PDD mentions saving paths as either a file or link.

A portable path format should be designed early.

Suggested conceptual structure:

```json
{
  "version": 1,
  "name": "Late Night Focus",
  "nodes": [],
  "edges": [],
  "settings": {}
}
```

Do not lock the exact schema until the existing codebase has been audited.

---

# 12. Analytics

The PDD proposes a listening analytics dashboard.

It should eventually answer questions such as:

- Which branches trigger most often?
- Which songs win weighted selections?
- Which artists appear most frequently?
- Which paths are rarely reached?
- How often do users skip tracks?
- Which branches lead to skips?

Analytics should be designed around actual path execution events rather than page-view analytics alone.

---

# 13. Technical Architecture

The PDD explicitly identifies several technical considerations.

## 13.1 YouTube API

YouTube Data API v3 has quota/rate-limit constraints.

Therefore:

**Cache metadata locally.**

Do not make an API call every time the user:

- drags a node
- selects a node
- changes a visual property
- reconnects nodes

Metadata should be cached and reused.

## 13.2 State Management

The application needs robust state management because it contains:

- drag/drop
- node selection
- node editing
- contextual inspector
- graph connections
- playback state
- path execution state

The PDD mentions:

- Redux
- Zustand
- Vuex

as possible approaches.

Cursor should use the state architecture already present in the repository if it is sound rather than introducing a second state-management system unnecessarily.

---

# 14. Playback Architecture

## Phase 1

The PDD specifies:

**YouTube IFrame Player API**

as the audio engine.

The core MVP should therefore separate:

```text
Path Logic
    ↓
Track Selection
    ↓
Playback Adapter
    ↓
YouTube IFrame Player
```

This separation is strategically important.

Do not make the graph engine directly dependent on YouTube-specific playback APIs.

---

# 15. Future Playback Migration

The PDD proposes a three-phase rollout.

## Phase 1 — Proof of Concept

Target:

**0–10,000 MAU**

Audio engine:

**YouTube IFrame Player API**

Primary objectives:

- build node-based UI
- perfect weighting algorithms
- acquire users

The product may use lightweight UI banner ads to offset basic infrastructure costs.

---

# 16. Phase 2 — Commercial Transition

Target:

**10,000 MAU**

Potential audio providers mentioned:

- 7digital
- Feed.fm

The concept is to move away from YouTube as the primary audio engine.

The new B2B API would potentially support:

- raw audio playback
- licensed streaming
- custom pre-roll
- custom mid-roll

The PDD proposes a **90-day migration window**.

During this window:

```text
YouTube Playback
       +
New B2B Playback
       ↓
Migration / Auto Matching
```

Existing YouTube nodes should be matched to equivalent tracks in the new provider catalog.

If an exact match cannot be found:

**mark the node yellow**

and allow the user to manually replace it.

---

# 17. Phase 2 Migration Data Requirement

This is one of the most important architectural requirements.

A Song Node must store structured metadata:

```text
Song Title
Artist
Album
```

rather than only:

```text
YouTube URL
```

Reason:

The future migration engine can search the new provider using text metadata.

This requirement should influence the database schema from the beginning.

---

# 18. Phase 3 — Premium

Target:

**50,000+ MAU**

Potential pricing:

**$3.99–$5.99/month**

Potential premium benefits:

- ad-free listening
- unlimited cloud Music Paths
- export/save capabilities
- advanced nodes
- BPM matching
- advanced time-of-day logic

The PDD's intended economic model is:

**Free users → advertising**

**Premium users → subscription**

with infrastructure/licensing costs covered by the corresponding revenue.

---

# 19. Recommended Development Priority

The PDD itself does not provide a granular engineering backlog, so the following is a practical ordering derived from the documented product requirements.

## Stage 0 — Repository Audit

- [ ] Inspect current repository.
- [ ] Identify implemented functionality.
- [ ] Identify framework.
- [ ] Identify existing node editor.
- [ ] Identify existing playback.
- [ ] Identify database.
- [ ] Identify authentication.
- [ ] Identify deployment.
- [ ] Identify incomplete/broken functionality.
- [ ] Create actual implementation-status matrix.

**Do this before rebuilding anything.**

---

## Stage 1 — Working Product Shell

- [ ] Workspace layout.
- [ ] Top navigation.
- [ ] Left toolbox.
- [ ] Contextual inspector.
- [ ] Main graph canvas.
- [ ] Zoom/pan.
- [ ] Node selection.
- [ ] Node creation.
- [ ] Node deletion.
- [ ] Node connection.
- [ ] Save graph state locally.

---

## Stage 2 — Core Music Path

- [ ] Track node.
- [ ] Artist node.
- [ ] Genre node.
- [ ] Randomizer node.
- [ ] Splitter node.
- [ ] Path execution engine.
- [ ] Weighted branch selection.
- [ ] Validation.
- [ ] Playback queue generation.

---

## Stage 3 — YouTube Integration

- [ ] Authentication/OAuth if required by the chosen integration.
- [ ] YouTube metadata lookup.
- [ ] Metadata cache.
- [ ] YouTube IFrame Player.
- [ ] Play/pause.
- [ ] Skip.
- [ ] Current-track state.
- [ ] Track completion detection.

---

## Stage 4 — Micro Controls

- [ ] Start time.
- [ ] End time.
- [ ] Volume override.
- [ ] Validate tempo/pitch feasibility.
- [ ] Implement tempo/pitch only if technically supported.

---

## Stage 5 — Smart Logic

- [ ] Time-of-day node.
- [ ] Skip penalty.
- [ ] Cooldown.
- [ ] Dynamic weighting.
- [ ] State persistence.

---

## Stage 6 — Path Management

- [ ] Save paths.
- [ ] Load paths.
- [ ] Duplicate paths.
- [ ] Export.
- [ ] Import.
- [ ] Version path format.
- [ ] Shareable links.

---

## Stage 7 — Analytics

- [ ] Path execution events.
- [ ] Branch selection events.
- [ ] Track selection events.
- [ ] Skip events.
- [ ] Dashboard.
- [ ] Branch popularity.
- [ ] Track/artist frequency.

---

## Stage 8 — Production Readiness

- [ ] Error handling.
- [ ] API quota protection.
- [ ] Caching.
- [ ] Security review.
- [ ] Authentication review.
- [ ] Database indexes.
- [ ] Logging.
- [ ] Monitoring.
- [ ] Automated tests.
- [ ] Deployment.
- [ ] Backup/recovery strategy.

---

# 20. Architecture Principles

Cursor should preserve these principles while implementing the product.

### Principle 1 — Separate graph logic from playback

The Music Path engine should not be tightly coupled to YouTube.

Use an abstraction such as:

```text
MusicPathEngine
       ↓
TrackSelection
       ↓
PlaybackAdapter
       ↓
YouTubeAdapter
```

Later:

```text
MusicPathEngine
       ↓
TrackSelection
       ↓
PlaybackAdapter
       ↓
B2BMusicProviderAdapter
```

### Principle 2 — Store structured track metadata

Never design the database around only YouTube URLs.

### Principle 3 — Cache API metadata

Avoid unnecessary YouTube API requests.

### Principle 4 — Make node behavior modular

Each node type should have:

- identity
- configuration
- validation
- execution behavior
- UI representation

### Principle 5 — Make the path engine testable

The selection algorithm should be executable without a browser or real YouTube playback.

### Principle 6 — Version saved paths

A future migration will be much easier if path files have a version number.

---

# 21. Suggested Domain Model

This is a conceptual model, not a mandate to replace an existing database schema.

## User

```text
id
account/auth information
created_at
settings
```

## MusicPath

```text
id
user_id
name
description
version
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

Again: **inspect the existing implementation first.**

---

# 22. Definition of Done for MVP

The MVP should not be considered complete merely because the node editor looks good.

A real MVP should allow a user to:

1. Open the application.
2. Create a Music Path.
3. Add music-related nodes.
4. Connect nodes.
5. Configure branch weights.
6. Execute the path.
7. Select a track according to the configured rules.
8. Play the resulting track through the supported playback system.
9. Skip/play/pause.
10. Save the path.
11. Reload the path without losing its configuration.

---

# 23. Cursor Instructions

When continuing development:

### First

**Audit. Do not assume.**

### Second

Create a file such as:

```text
IMPLEMENTATION_STATUS.md
```

containing:

- completed features
- partially completed features
- broken features
- missing features
- technical debt
- blockers
- recommended next task

### Third

Map every existing feature to the PDD.

### Fourth

Prioritize functionality that makes the core loop work:

```text
Create Path
   ↓
Add Nodes
   ↓
Connect Nodes
   ↓
Configure Weights
   ↓
Execute Path
   ↓
Select Track
   ↓
Play Track
```

### Fifth

Only after the core loop works reliably should advanced functionality be prioritized.

---

# 24. Current Status Classification

Use these labels when auditing the repository:

- **DONE** — implemented and working.
- **PARTIAL** — some implementation exists but is incomplete.
- **BROKEN** — implementation exists but does not currently work.
- **SCAFFOLD** — structural code exists but feature behavior is not implemented.
- **MISSING** — no meaningful implementation found.
- **UNKNOWN** — cannot determine without further inspection/testing.
- **BLOCKED** — implementation depends on an external service, credential, API limitation, or unresolved technical decision.

Do not mark something DONE merely because a UI element exists.

---

# 25. Immediate Cursor Mission

The first development session should produce:

## Deliverable A — Codebase Audit

A precise status report of what already exists.

## Deliverable B — PDD Mapping

Every PDD requirement mapped to:

```text
PDD requirement
→ existing code
→ current status
→ missing work
→ priority
```

## Deliverable C — MVP Gap List

A short prioritized list:

```text
P0 — prevents core product from working
P1 — required for MVP
P2 — important post-MVP
P3 — advanced/future
```

## Deliverable D — Next Implementation Step

Select the single highest-value next engineering task rather than attempting to implement the entire PDD at once.

---

# 26. Final Product Mental Model

The most important thing to understand about Synapse is that it is **not simply a better shuffle button**.

It is intended to become a:

> **Visual programming environment for music playback.**

The user's Music Path is effectively a small music program:

```text
             ┌───────────────┐
             │  Time Trigger │
             └───────┬───────┘
                     │
             ┌───────▼───────┐
             │ Path Splitter │
             └───┬───────┬───┘
              70%│       │30%
                 │       │
        ┌────────▼─┐   ┌─▼────────┐
        │ Pop Node │   │ Lo-Fi    │
        └────┬─────┘   └────┬─────┘
             │              │
             └──────┬───────┘
                    ▼
              Track Selection
                    │
                    ▼
                Playback
```

That graph — rather than the individual UI controls — is the core intellectual property and product experience.

---

# 27. Source

Primary source used for this document:

**Synapse PDD — Product Definition Document: YouTube Music Advanced Shuffler**

The PDD describes the product as a visual, node-based music sequencing application integrated with YouTube Music, including weighted Music Paths and granular track controls. fileciteturn0file0L2-L12

The PDD also defines the workspace architecture, including the top bar, dynamic toolbox/inspector, and main path canvas. fileciteturn0file0L13-L27

The core requirements include node-based pathing, weighted branches, and track-level controls. fileciteturn0file0L28-L41

Advanced concepts include time-of-day logic, skip penalties, cooldowns, transition nodes, BPM matching, path sharing, and listening analytics. fileciteturn0file0L42-L63

The technical section calls out YouTube API quota limitations, metadata caching, and robust frontend state management. fileciteturn0file0L64-L71

The rollout plan defines YouTube IFrame playback for Phase 1, a potential B2B music API transition in Phase 2, and premium subscriptions in Phase 3. fileciteturn0file0L72-L118

The PDD specifically requires storing song title, artist, and album separately rather than relying only on the YouTube URL to make future API migration easier. fileciteturn0file0L119-L122
