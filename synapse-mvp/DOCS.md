Synapse is a browser app: a **Music Path** is a directed graph of nodes. Playback walks that graph and plays YouTube videos through the IFrame API. Synapse does not host an audio library.

This page is the programming reference. Short answers live in the [FAQ](/faq). Shipped product changes live in the [changelog](/changelog).

## Graph model

A path is a React Flow graph:

```ts
type Graph = {
  nodes: Node[]  // id, type, position, data, optional hidden
  edges: Edge[]  // id, source, target, optional sourceHandle / targetHandle
}
```

Rules:

- Exactly one `start` node. Adding a second Start is rejected.
- Playback follows outgoing edges. Branching nodes pick one outgoing handle.
- `comment` nodes are annotations. They are not queued.
- Hidden track nodes are parked inside a Sequence or Randomizer (`data.tracks`), not copied.
- Import caps: 400 nodes, 800 edges, 8 MB of JSON. ZIP archives are rejected. Imported JSON never runs as code.

`splitter` is accepted in files as a legacy alias of `conditional`.

## Node types

| `type` | Role | In the queue |
| --- | --- | --- |
| `start` | Walk origin | No |
| `track` | YouTube video | `track:{id}` |
| `conditional` | Branch | No (picks a path, then continues) |
| `randomizer` | Ordered or weighted pool | Nested tracks, then continue |
| `transition` | Gap between songs | `transition:{id}` |
| `style` | Theme cue on the walk | `style:{id}` |
| `comment` | Note on the canvas | No |
| `end` | Stop the walk | No |

Every node may have `data.name` (inspector Name). Track nodes use `songTitle` as the display title; the extra Name field is not shown on tracks.

### start

```ts
{ label: 'Start', name: string }
```

One per graph. If `buildPlaybackQueue` is called without `startNodeId`, the walk begins here.

### track

```ts
{
  videoId: string
  songTitle: string
  artist: string
  album: string
  startTime: number  // seconds
  endTime: number    // 0 = play to the real duration
  duration: number   // filled when the video metadata loads
  volume: number
  speed: number
  playCount: number
}
```

`videoId` is a YouTube id (or a URL the editor parses down to an id). Title / artist / album can auto-fill from oEmbed plus an iTunes album lookup.

Dragging a track onto a Sequence or Randomizer **moves** it into that node’s `data.tracks` list and hides the canvas node. Drag the list item out to restore it.

### conditional

```ts
{
  numPaths: number
  weights: number[]           // mode === 'random'
  mode: 'random' | 'timeRange' | 'weather' | 'day'
  pathTimeRanges?: { start: number; end: number }[][]  // hours 0–23
}
```

Outgoing handles are `"0"`, `"1"`, … `numPaths - 1`.

| `mode` | How a path is chosen |
| --- | --- |
| `random` | Weighted pick (`weights[i]`) |
| `timeRange` | Local hour in `pathTimeRanges[i]` |
| `weather` | Normalized weather enum (below) |
| `day` | Day / date clauses (`all` or `any`) |

Weather is a closed enum. The engine never sees provider strings:

`clear` · `partlyCloudy` · `cloudy` · `drizzle` · `rain` · `thunderstorm` · `snow` · `sleet` · `fog` · `windy` · `other`

Location comes from the profile, or browser geolocation, then a short cache. Unknown maps to `other`.

Day / date clauses may be a single value, a list, a range, a calendar date, a date range, or a repeating annual window. Calendar fields: `weekday` (0–6, Sunday = 0), `dayOfMonth`, `month`, `quarter`, `year`, `weekOfYear`, `hour`.

### randomizer

```ts
{
  tracks: { nodeId: string }[]
  weights: number[]
  playCount: number  // visits before the walk continues
  mode: 'sequence' | 'weighted'
}
```

Sequence plays `tracks` in order. Weighted picks by `weights`. `playCount` is how many times this node is visited in one queue build (capped at 100). There is no separate “forever” flag.

### transition

```ts
{
  type: 'silence' | 'audio' | 'youtube'
  duration: number
  audioFile: string | null  // data URL when type is audio
  videoId: string           // when type is youtube
}
```

### style

```ts
{
  themeId: string
  layers: Array<'workspace' | 'text' | 'nodes' | 'player' | 'typography' | 'chrome'>
  durationMs: number  // default 600, max 5000
  delayMs: number     // default 0, max 60000
  easing: 'linear' | 'ease' | 'easeInOut'
}
```

Style cues already on the path to a jumped-to node are applied immediately. Settings → Themes is independent of the path theme; the canvas **Settings theme** / **Path theme** toggle switches which look you see without moving the playback marker. Respects `prefers-reduced-motion`.

### comment

```ts
{ text: string, linkedNodeId: string | null }
```

Drawn as a center-to-center dotted line with no graph handles, behind nodes.

### end

Stops the walk. Unconnected graphs also halt when there is nowhere left to go.

## Playback engine

```ts
function buildPlaybackQueue(
  graph: { nodes: Node[]; edges: Edge[] },
  options?: BuildQueueOptions
): QueueItem[]

function buildPlaybackQueueResult(
  graph: { nodes: Node[]; edges: Edge[] },
  options?: BuildQueueOptions
): { items: QueueItem[]; haltReason: BuildQueueHaltReason }
```

```ts
type QueueItem = {
  kind: 'track' | 'transition' | 'style'
  nodeId: string
  key: string  // `${kind}:${nodeId}`
}

type BuildQueueHaltReason = 'ok' | 'no_start' | 'max_steps' | 'max_queue'

type BuildQueueOptions = {
  rng?: () => number
  currentHour?: number          // 0–23, default local now
  now?: Date                    // day/date conditionals
  weatherState?: WeatherState   // default 'other'
  maxQueueItems?: number        // default 500
  maxTraverseSteps?: number     // default 2000
  maxPlayCount?: number         // default 100
  startNodeId?: string          // walk from this node instead of Start
}
```

- Invalid `startNodeId` types (for example `comment`) yield an empty queue. Missing ids fall back to Start.
- Origins that may start a walk: `start`, `track`, `conditional`, `splitter`, `randomizer`, `transition`, `style`, `end`.
- Conditionals are visited once per build (same cycle protection as other nodes).
- YouTube IFrame errors (bad id, private/deleted, embed blocked) skip to the next queue item. Player-init and play failures offer Retry.
- **Play from here** (Track node or inspector) sets `startNodeId` and rebuilds the queue. It does not change the saved graph.
- **Pause** keeps the queue. **Stop** ends the session. The deck **loop** button repeats the current song without rebuilding the path.
- Edit shows a validation summary (`validateGraph`) for missing Start, dangling edges, unreachable playback nodes, empty sequences, and tracks without a video. Comments are ignored. Warnings do not block save.
- Seeded `rng` makes weighted picks deterministic in tests.

## File format

Export Settings → Import / Export as `.synapse` JSON.

### `synapse-playlist`

```ts
{
  schemaVersion: 1,
  type: 'synapse-playlist',
  id: string,
  name: string,
  visibility: 'public' | 'private',
  tags: string[],
  updatedAt: string,
  nodes: Node[],
  edges: Edge[],
  settings: object,
  themeId: string | null
}
```

### `synapse-package`

A playlist plus custom themes referenced by Style nodes (and the current Settings theme). Preset themes stay as ids. Overlays in a package are skipped with a notice.

```ts
{
  schemaVersion: 1,
  type: 'synapse-package',
  manifest: {
    schemaVersion: 1,
    playlist: 'playlist.synapse',
    themes: string[],
    overlays: string[]
  },
  playlist: PlaylistFile,
  themes: SynapseTheme[]
}
```

### `synapse-theme`

```ts
{
  schemaVersion: 1,
  type: 'synapse-theme',
  id: string,
  name: string,
  version: string,
  builtin?: boolean,
  colors: ThemeColors,
  typography: { ui: string; display: string; mono: string; node: string },
  style: {
    radius: number
    radiusSm: number
    borderWidth: number
    gridIntensity: number
    shadowIntensity: number
    edgeType: 'bezier' | 'simpleBezier' | 'straight' | 'rectangular' | 'rounded' | 'triangular'
    visualizerBarCount: number
  },
  overlays: unknown[]
}
```

Ids must match `[\w.-]+` (max 80). Node `data` objects are capped (depth 8, 40 keys, 200 array items). Audio data URLs max 500 KB.

## Public URLs

The app is a History API SPA. Unknown paths rewrite to `/`.

| Path | Page |
| --- | --- |
| `/` | Marketing home |
| `/workshop` | Workshop catalog |
| `/playlist/{id}`, `/p/{id}`, `/workshop/{id}` | Published creation |
| `/listen` | Signed-in Listen |
| `/listen/{id}` | Listen to a published path (graph locked) |
| `/u/{username}`, `/u/{shareId}` | Creator profile |
| `/s/{id}` | Share lookup (playlist or profile) |
| `/docs` | This reference |
| `/faq` | FAQ |
| `/changelog` | Changelog |
| `/pricing` | Pricing (Pro is not for sale) |
| `/privacy` `/terms` `/cookies` | Legal |
| `/login` `/signin` | Log in |
| `/signup` | Create account |
| `/edit` | Canvas |
| `/settings` | Settings |
| `/profile` | Profile settings |
| `/admin` | Admin (role only) |
| `/superadmin` | Superadmin (owner only) |

`{id}` on a playlist is a UUID or a short share code. Share codes are 10 characters from `2-9` and `a–k`, `m–z` (no `L`). Usernames are `[a-z0-9_]{3,20}`.

Workshop visibility:

| Value | Who can open it |
| --- | --- |
| `private` | Owner |
| `unlisted` | Anyone with the id or link |
| `public` | Catalog + link |

Creators can disable likes, comments, saves, and follows per creation. Curated tags only (separate playlist vs theme vocabularies, max 8, no custom tags).

`/u/workshop_preview` and `/u/vis_preview` are local-only previews, not real accounts.

## Auth and data

```
POST-less SPA + Supabase Auth
```

- Google OAuth or email/password. Username and display name are required.
- `/edit`, `/listen`, `/settings`, `/profile`, `/admin`, `/superadmin` require a session. Marketing pages are public.
- Paths, themes, settings, profile extras, and tutorial progress save per user in `user_workspaces` (RLS). Sign-out clears the on-screen account; cloud playlists stay on that user. The editor also keeps a local recovery draft of the active path (no tokens). A newer local draft is offered after hydrate; a newer server copy is kept.
- The verified owner email is Superadmin (`/superadmin` only). Other admins live in Postgres `roles` (`/admin` only). RLS still blocks Superadmin-only writes from Admin.
- Settings → Privacy / Data: download a JSON copy, or delete the account.

## Keyboard

| Keys | Action |
| --- | --- |
| `Ctrl/Cmd+K` | Command palette |
| `Ctrl/Cmd+Z` / `Shift+Z` or `Ctrl+Y` | Undo / redo |
| `Ctrl/Cmd+S` | Save now |
| `Ctrl/Cmd+/` | Keyboard shortcuts |
| `Space` | Play / pause (Edit and Listen) |
| `Shift+click` / box-select | Multi-select |
| `Ctrl/Cmd+C` `V` `D` | Copy, paste, duplicate |
| `Ctrl/Cmd+A` | Select visible nodes |
| Middle- or right-drag | Pan while box-select is on |
| `Esc` | Exit the tutorial |

Shift-snap does not arm while a text field is focused. Paste and duplicate no-op when the graph is locked (guest Listen).

## Limits

| Cap | Default |
| --- | --- |
| Queue items | 500 |
| Traverse steps | 2000 |
| Per-node `playCount` | 100 |
| Nodes in a file | 400 |
| Edges in a file | 800 |
| Workshop tags | 8 |
| Style duration | 5000 ms |
| Style delay | 60 s |
