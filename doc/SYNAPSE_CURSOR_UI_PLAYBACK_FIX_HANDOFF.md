# Synapse — UI and Playback Marker Fix Handoff

## Purpose

Implement the following four improvements in Synapse without rebuilding the existing canvas, playback engine, Zustand store, or YouTube playback adapter.

The goal is to improve node-type switching, playback navigation, node editing convenience, and start-node discoverability.

Preserve existing behavior unless a change is explicitly required below.

---

# 1. Conditional and Sequence Type Selection Should Use Dropdowns

## Problem

Changing the operating type/mode of Conditional and Sequence/Randomizer nodes is currently less convenient than it should be.

The node type/mode selector should be a dropdown rather than separate buttons or other scattered controls.

## Required behavior

Use a dropdown/select control for changing the active mode of:

- Conditional nodes
- Sequence/Randomizer nodes

### Conditional node

The dropdown should expose the existing supported Conditional modes, for example:

```text
Conditional Type
[ Weighted Random ▼ ]
```

or

```text
Conditional Type
[ Time Range ▼ ]
```

Use the actual mode names already present in the codebase.

Do not rename or remove existing behavior unless necessary.

### Sequence/Randomizer node

The dropdown should expose the existing supported modes, such as:

```text
Playback Mode
[ Sequence ▼ ]
```

and

```text
Playback Mode
[ Weighted Random ▼ ]
```

Use the current data-model values if they differ.

## State requirements

Changing the dropdown must:

- update the node immediately;
- persist through the existing Zustand/localStorage system;
- preserve mode-specific state when practical;
- avoid wiping weights/order simply because the user switches modes;
- continue feeding the existing playback engine correctly.

Example preferred behavior:

```text
Weighted mode
Track A = 70
Track B = 30

switch to Sequence
weights are hidden but preserved

switch back to Weighted
70 / 30 values return
```

## Acceptance criteria

- [ ] Conditional mode/type is changed using a dropdown.
- [ ] Sequence/Randomizer mode/type is changed using a dropdown.
- [ ] Existing mode logic still works.
- [ ] State persists after refresh.
- [ ] Switching modes does not unnecessarily destroy existing configuration.

---

# 2. Add a Draggable Yellow-Orange Playback Marker

## Goal

The canvas should clearly show which node is currently being played.

Add a yellow-orange playback marker that indicates the current playback node.

The user should also be able to drag this marker onto another playable node to choose a new playback starting point.

---

## A. Marker appearance

The active playback node should have a distinct yellow-orange marker.

Recommended visual direction:

```text
      ●
   Track Node
```

or a small tab/indicator attached to the node border.

Requirements:

- highly visible against the dark canvas;
- does not cover important node UI;
- visually distinct from selection state;
- visually distinct from error/warning indicators;
- follows the node while the node moves;
- smoothly updates when playback advances.

Do not rely only on changing the entire node border color if that would make selection/playback states ambiguous.

---

## B. Marker follows playback

When playback advances to another node, move the marker to the current node.

This should be driven by actual playback/session state rather than inferred only from the currently highlighted queue item.

Examples:

```text
Start → Track A → Transition → Track B

Playback on Track A:
marker = Track A

Playback advances:
marker = Transition

Playback advances:
marker = Track B
```

For non-visual/internal queue items, map the marker to the corresponding graph node when possible.

---

## C. Marker can be dragged to select a playback start node

The user should be able to drag the playback marker and drop it onto another valid node.

Dropping the marker onto a playable node should set that node as the starting point for the next playback session or immediately restart playback from that node, depending on the most consistent behavior with the current app architecture.

Preferred behavior:

```text
User drags marker from Track A to Track D

→ playback queue is rebuilt starting at Track D
→ Track D becomes the active playback node
→ playback starts from Track D if the session is currently playing
```

If playback is paused:

```text
Drag marker to Track D
→ update playback start position
→ remain paused
→ Play resumes from Track D
```

Do not unexpectedly autoplay when the application is currently stopped unless that matches the existing Play interaction.

---

## D. Valid and invalid drop targets

The marker should only be droppable on nodes that can meaningfully participate in playback.

Likely valid nodes:

- Start
- Track
- Conditional
- Sequence/Randomizer
- Transition
- End, if supported as a terminal starting point

Invalid:

- Comment/annotation nodes
- UI-only elements
- non-playback helper elements

While dragging:

- valid nodes should receive subtle drop-target feedback;
- invalid nodes should not appear valid;
- dropping on empty canvas should cancel and return the marker to its previous node.

---

## E. Playback engine integration

Do not create a second playback system.

The draggable marker should update the existing playback-start state and then use the existing engine/queue builder.

Preferred conceptual flow:

```text
Marker drop
   ↓
selectedPlaybackStartNodeId
   ↓
buildPlaybackQueue(... startNodeId ...)
   ↓
Player
   ↓
PlaybackAdapter
```

If the engine currently assumes playback always starts at the Start node, extend it carefully so a supplied starting node can be used.

Keep this logic independent of YouTube.

---

## F. Persistence

Do not persist transient "currently playing" state unless the existing architecture already does so.

It is acceptable for the selected playback start node to reset to Start when the app reloads unless there is already a persistent playback-session model.

Do not introduce unnecessary playback-session persistence just for this feature.

---

## Acceptance criteria

- [ ] Current playback node has a visible yellow-orange marker.
- [ ] Marker updates as playback moves between nodes.
- [ ] Marker follows node position changes.
- [ ] User can drag marker onto another valid playback node.
- [ ] Dropping marker on a node rebuilds playback from that node.
- [ ] Invalid drops safely cancel.
- [ ] Comment nodes cannot be chosen as playback starts.
- [ ] Playback engine remains independent of YouTube.
- [ ] Pause/resume/skip still work after the change.

---

# 3. Move Node Settings Into a Right-Side Inspector Panel

## Problem

Node settings currently require scrolling in the left-side interface, which becomes inconvenient for larger nodes or longer property lists.

Move selected-node settings into a dedicated inspector panel on the right side of the application.

When no node is selected, the right panel should disappear.

Its appearance/disappearance should be smoothly animated.

---

## A. Right-side node settings panel

When a user selects a node:

```text
Canvas                         Inspector
┌───────────────────────┐     ┌──────────────┐
│                       │     │ Track        │
│      graph canvas     │     │ Title        │
│                       │     │ Artist       │
│                       │     │ Start / End  │
│                       │     │ Volume       │
│                       │     │ Speed        │
└───────────────────────┘     └──────────────┘
```

The inspector should contain the settings for the selected node.

Examples:

- Track properties
- Conditional settings
- Sequence/Randomizer settings
- Transition settings
- Comment properties
- any other existing editable node settings

Reuse existing controls where possible instead of creating duplicate implementations.

---

## B. Panel visibility

When a node is selected:

- panel slides/fades into view from the right;
- settings correspond to the selected node.

When the selected node is deselected:

- panel smoothly slides/fades out;
- canvas regains the space.

When another node is selected:

- panel stays open;
- content updates smoothly rather than closing/reopening unnecessarily.

---

## C. Smooth animation

The panel animation should feel deliberate and not abrupt.

Recommended implementation behavior:

- transform-based slide animation;
- opacity transition if useful;
- avoid layout jank;
- keep canvas resizing smooth;
- React Flow should recalculate dimensions correctly after panel open/close.

Do not use long or distracting animations.

---

## D. Move Remove All and Minimap controls to the left

The existing Remove All control and minimap should move toward the left-side UI so the right side is reserved for node settings.

Required layout intent:

```text
LEFT                         CENTER                    RIGHT
navigation/tools             React Flow canvas         selected-node inspector
remove all
minimap
```

The exact placement may follow the existing design language, but:

- Remove All should no longer compete with the right-side inspector.
- Minimap should be on the left side of the canvas/UI.
- Do not obscure node palette controls.
- Do not block canvas interaction.

---

## E. Single source of truth for node settings

Do not maintain one settings form in the node and another unrelated copy in the inspector.

The right inspector should edit the same Zustand node data already used by the rest of the app.

If some compact controls must remain directly on a node, they should update the same underlying state.

Avoid synchronization bugs such as:

```text
node UI says volume = 80
inspector says volume = 60
```

---

## F. Selection behavior

Use React Flow's existing selected-node state where practical.

Expected behavior:

```text
click node → inspector opens
click another node → inspector changes
click empty canvas → inspector closes
node deleted → inspector closes
```

If multiple-node selection is supported, define a safe behavior.

Preferred default:

- inspector shows settings only when exactly one editable node is selected;
- otherwise inspector closes or shows a simple multi-select state.

Do not invent complex batch editing unless already supported.

---

## Acceptance criteria

- [ ] Selecting a node opens a right-side inspector.
- [ ] Inspector contains the selected node's settings.
- [ ] Empty-canvas click closes the inspector.
- [ ] Deleting selected node closes inspector.
- [ ] Switching selection updates panel contents.
- [ ] Panel opens/closes smoothly.
- [ ] Canvas resizes correctly.
- [ ] Minimap is moved to the left.
- [ ] Remove All is moved to the left.
- [ ] Settings remain synchronized with node state.
- [ ] No regression to graph editing or playback.

---

# 4. Add an Off-Screen Start-Node Direction Arrow Near the Minimap

## Goal

When the Start node is outside the currently visible canvas viewport, provide a directional arrow at the edge of the minimap/canvas navigation area pointing toward the Start node.

If multiple Start nodes ever exist, point toward the closest one.

---

## A. Visibility rules

The arrow should appear only when the relevant Start node is outside the current visible viewport.

```text
Start visible on canvas
→ no arrow

Start off-screen
→ arrow appears
```

Do not show the arrow unnecessarily while Start is already visible.

---

## B. Arrow placement

Place the arrow at or near the edge of the minimap/navigation region.

The arrow should point in the canvas direction where the Start node is located.

Examples:

```text
Start is left of viewport   → arrow points left
Start is right              → arrow points right
Start is above              → arrow points up
Start is below-right        → arrow points down-right
```

The direction should be based on the actual graph-space position relative to the viewport center.

---

## C. Multiple Start nodes

The current application may normally have one protected Start node, but implement this defensively.

If multiple Start nodes are found:

1. identify all Start nodes outside the viewport;
2. compute distance from the current viewport/canvas center;
3. choose the closest Start node;
4. point the arrow toward that node.

If one Start node is visible and another is off-screen, prefer the visible state and do not show an unnecessary arrow unless the product explicitly supports navigation among multiple Start nodes.

---

## D. Optional click behavior

Preferred enhancement:

Clicking the arrow should pan/zoom the canvas to the Start node.

Example:

```text
click arrow
→ React Flow smoothly pans to Start
→ Start becomes visible
→ arrow disappears
```

Use the existing React Flow viewport API.

Do not instantly teleport the viewport if a smooth pan is practical.

---

## E. Direction calculation

Use graph coordinates and the React Flow viewport transform rather than relying on DOM pixel guesses.

Conceptually:

```text
viewport center in graph coordinates
        ↓
start node center
        ↓
deltaX / deltaY
        ↓
atan2(deltaY, deltaX)
        ↓
rotate arrow
```

Make sure zoom and pan do not break direction calculation.

---

## F. Performance

The arrow may need to update during:

- pan;
- zoom;
- node drag;
- fit view;
- viewport resize.

Avoid expensive full-graph recomputation on every animation frame if unnecessary.

This should remain responsive even with a moderately large graph.

---

## Acceptance criteria

- [ ] No arrow when Start is visible.
- [ ] Arrow appears when Start is off-screen.
- [ ] Arrow points in the correct direction.
- [ ] Direction remains correct while panning/zooming.
- [ ] Arrow updates if Start moves.
- [ ] Closest Start is chosen if multiple exist.
- [ ] Arrow does not cover important UI.
- [ ] Clicking arrow pans to Start if click navigation is implemented.
- [ ] No noticeable canvas performance regression.

---

# 5. Likely Files to Inspect

Inspect the repository before changing anything.

Likely areas:

```text
src/components/ReactFlowCanvas.tsx
src/components/Sidebar.tsx
src/components/Player.tsx
src/components/nodes/ConditionalNode.tsx
src/components/nodes/RandomizerNode.tsx
src/components/nodes/TrackNode.tsx
src/components/nodes/TransitionNode.tsx
src/store.ts
src/engine/
src/index.css
```

Also search for:

```text
selected
selectedNode
onSelectionChange
onNodeClick
MiniMap
Controls
remove all
clear graph
conditional
randomizer
sequence
mode
currentTrack
currentNode
queueIndex
playback
viewport
screenToFlowPosition
flowToScreenPosition
setCenter
fitView
```

Use the actual project structure if these paths differ.

---

# 6. Suggested Implementation Order

Implement in this order:

1. Dropdown mode selectors
2. Right-side inspector and left-side minimap/remove-all layout
3. Playback marker display
4. Draggable playback marker/start-from-node behavior
5. Off-screen Start arrow
6. Regression testing

This order reduces UI/state conflicts while the larger interactions are being added.

---

# 7. Regression Checklist

## Node configuration

- [ ] Track settings still update correctly.
- [ ] Conditional settings still work.
- [ ] Sequence settings still work.
- [ ] Transition settings still work.
- [ ] Comment settings still work.

## Canvas

- [ ] Nodes can still be dragged.
- [ ] Edges can still be created.
- [ ] Zoom works.
- [ ] Pan works.
- [ ] Minimap works from its new location.
- [ ] Fit view works.
- [ ] Node selection works.

## Playback

- [ ] Play works from Start.
- [ ] Pause works.
- [ ] Resume works.
- [ ] Skip works.
- [ ] Path-finished state still works.
- [ ] Playback marker advances correctly.
- [ ] Playback can be started from a manually selected node.
- [ ] Comments cannot be chosen as playback nodes.

## Persistence

- [ ] Conditional dropdown mode persists.
- [ ] Sequence mode persists.
- [ ] Node property edits from inspector persist.
- [ ] Existing saved graphs still load.

## UI

- [ ] Right inspector animates smoothly.
- [ ] Canvas does not jump when inspector opens/closes.
- [ ] Minimap does not overlap controls.
- [ ] Remove All remains accessible.
- [ ] Start direction arrow does not obstruct minimap use.

---

# 8. Implementation Rules

1. Inspect the existing repository first.
2. Preserve the current React Flow architecture.
3. Preserve the Zustand store rather than creating parallel state.
4. Preserve the existing MusicPathEngine.
5. Keep playback logic independent of YouTube-specific APIs.
6. Reuse existing node controls in the right inspector where possible.
7. Avoid duplicate node-settings state.
8. Do not persist transient playback state unless already supported.
9. Use React Flow viewport APIs for navigation calculations.
10. Keep animations lightweight and smooth.
11. Maintain backwards compatibility with existing saved graphs.
12. Update handoff/status documentation after implementation.

---

# Completion Standard

Do not mark this complete until all of the following are true:

1. Conditional type/mode changes through a dropdown.
2. Sequence/Randomizer type/mode changes through a dropdown.
3. Current playback node is identified with a yellow-orange marker.
4. The playback marker can be dragged to choose a new playback start node.
5. Node settings appear in a right-side inspector only when a node is selected.
6. The right-side inspector opens and closes smoothly.
7. Remove All and the minimap are repositioned to the left.
8. An off-screen Start node causes a directional arrow to appear.
9. The arrow points toward the closest Start node if multiple exist.
10. Playback, graph editing, persistence, and existing node behavior continue to work without regression.

---

# Completion notes (2026-09-02)

Implemented on `feature/now-playing-metadata` without rebuilding canvas, Zustand, MusicPathEngine, PlaybackAdapter, or YouTubeIframeAdapter.

## What shipped

1. **Mode dropdowns** — Conditional (`random` / `timeRange`) and Sequence/Randomizer (`sequence` / `randomizer`) use `<select>` in the inspector and compact on-node selects. Patches go through `updateNodeData`; weights are preserved across SEQ ↔ RND.
2. **Right inspector** — Selected-node settings moved from the left sidebar into `InspectorPanel` (slides/fades from the right). Empty canvas or delete closes it; switching selection updates content. Multi-select shows a message, no batch edit. MiniMap is bottom-left (beside Controls); Remove All is top-left.
3. **Playback marker** — Yellow-orange `NodeToolbar` marker follows `currentPlayingNodeId` (else chosen start, else Start). Drag onto a playable node sets `selectedPlaybackStartNodeId` and rebuilds via `buildPlaybackQueueResult(..., { startNodeId })`. Comments are not valid drops. Transient; not persisted.
4. **Start arrow** — When every Start is off-screen, a rotatable arrow at the minimap edge points toward the closest one (`atan2` from viewport center). Click pans with `setCenter`. Hidden if any Start is visible.

## Files changed

- `synapse-mvp/src/components/Sidebar.tsx` — palette + guide only
- `synapse-mvp/src/components/NodeInspector.tsx` — moved inspector controls
- `synapse-mvp/src/components/InspectorPanel.tsx` — right rail
- `synapse-mvp/src/components/ReactFlowCanvas.tsx` — layout, selection, marker drop
- `synapse-mvp/src/components/PlaybackMarker.tsx`, `StartDirectionArrow.tsx`
- `synapse-mvp/src/components/nodes/ConditionalNode.tsx`, `RandomizerNode.tsx`
- `synapse-mvp/src/App.tsx`, `Player.tsx`, `store.ts`, `index.css`
- `synapse-mvp/src/engine/buildPlaybackQueue.ts`, `types.ts`, `startNode.ts`
- `synapse-mvp/src/nodeMode.ts`, `startArrow.ts`, `playbackMarker.ts` + tests

## Tests

`npx tsc -b` and `npm test` in `synapse-mvp`: 14 files, 97 tests passed. Coverage includes queue rebuild from a chosen start node, start-arrow visibility/direction math, and mode-dropdown patches writing the same `data.mode` fields.

## Limitations

- Browser IDE tabs did not stay open for interactive verification in this pass; layout CSS was reviewed statically.
- Chosen start node resets to Start on reload (not persisted), as specified.
- Marker on parked sequence tracks maps to the owning Sequence/Randomizer.
- End is a valid drop target but typically produces an empty queue.
- Compact on-node `<select>` labels may truncate on small node headers; full labels are in the inspector.

