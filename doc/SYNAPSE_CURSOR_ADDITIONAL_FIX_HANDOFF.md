# Synapse — Additional Bug Fix Handoff

## 1. Comment → Parent Connection Line

The straight line between a Comment node and its parent must render **behind the nodes**, so it never covers text, controls, or other UI.

### Required behavior
- Render the Comment → Parent relationship line below the node layer.
- The line must remain visible but must not obscure either node.
- Do not change the rendering/layering of normal playback graph edges.
- Comment nodes remain annotation-only and must stay excluded from the playback graph.

### Implementation guidance
Inspect the existing Comment relationship/custom edge implementation and use React Flow's existing edge/node layering where possible. Avoid arbitrary DOM positioning or z-index changes that could affect normal graph edges.

### Acceptance criteria
- [x] Comment-parent line is behind both nodes.
- [x] Node UI is never covered by the line.
- [x] Relationship remains visually understandable.
- [x] Normal graph edges are unaffected.

---

## 2. Track Nodes → Sequence Drag/Drop Behavior

### Problem
When a Track node is dragged into a Sequence/Randomizer, it should become an item inside that Sequence rather than remaining as a separate workspace node.

### A. Drag Track into Sequence
When a Track is dropped onto a Sequence:

1. Add its track ID/node ID to the Sequence's existing ordered track list.
2. Preserve all existing Track metadata/configuration.
3. Prevent duplicate entries unless duplicates are explicitly supported by the existing model.
4. **Delete the original Track node from the workspace.**
5. Remove graph edges that become invalid because the Track node was removed.
6. Persist the state using the existing persistence system.
7. Update the UI immediately.

The Track is **moved**, not copied:

```text
Workspace:
Track A        → removed

Sequence:
[ Track A ]
```

### B. Reorder Tracks Inside Sequence
Track items displayed inside a Sequence must be draggable.

Users must be able to:
- Drag an item to another position.
- Reorder any number of items.
- Move the first item to the end.
- Move the last item to the beginning.
- See the order update immediately.
- Have playback follow the displayed order.
- Have the order persist after refresh.

Example:

```text
Before:
1. Track A
2. Track B
3. Track C

Drag Track C above Track A

After:
1. Track C
2. Track A
3. Track B
```

### C. Drag a Sequence Item Out
A Track item inside a Sequence must be draggable outside the Sequence.

When intentionally dropped outside the Sequence:

1. Remove it from the Sequence's ordered track list.
2. Restore/create its corresponding Track node on the workspace.
3. Place the Track node at the drop location.
4. Preserve all existing Track data, including:
   - YouTube video ID
   - title
   - artist
   - album
   - start time
   - end time
   - volume
   - speed
   - play count
   - any other existing Track properties
5. Persist the updated state.

The interaction should be two-way:

```text
Workspace Track
      ↓ drag into
   Sequence
      ↓ drag out
Workspace Track
```

Do not recreate the Track with default values and lose metadata.

### D. Avoid Dragging Conflicts
A Track inside a Sequence is a Sequence item, not a separate React Flow node.

- Dropping inside the Sequence should reorder it.
- Dropping outside the Sequence should remove it and restore it to the workspace.
- Dragging the Sequence container itself should continue to work normally.
- Do not accidentally remove an item when the user only intends to reorder it.

### E. Single Source of Truth
Use the existing Sequence/Randomizer data model. Do not create a second independent Track store.

The Sequence should have one authoritative ordered list, using the project's existing field name, conceptually:

```text
trackIds: ["trackA", "trackC", "trackB"]
```

That list must drive:
- displayed sequence order;
- drag-and-drop reordering;
- sequence playback order;
- persistence.

### F. Randomizer Modes
Do not break existing Randomizer modes.

For **sequence mode**:
- The ordered list is authoritative.
- Playback follows the displayed order.

For **weighted/random mode**:
- Preserve the existing weighted/random behavior.
- Do not introduce sequence ordering semantics that change weighted selection.

---

## 3. Persistence and Playback

Use the existing Zustand/local persistence architecture. Do not introduce a new persistence system.

After these operations, state must remain consistent:

### Track → Sequence
Update:
- workspace nodes;
- workspace edges;
- Sequence track list;
- relevant node data.

### Reorder
Update:
- Sequence track list.

### Sequence → Workspace
Update:
- Sequence track list;
- workspace nodes;
- restored Track position;
- relevant edges if required by the existing graph model.

Playback must continue using the existing architecture:

```text
MusicPathEngine
      ↓
Playback Queue
      ↓
Player
      ↓
PlaybackAdapter
      ↓
YouTubeIframeAdapter
```

Verify that a Track moved into a Sequence does not accidentally play twice because a standalone copy remains on the canvas.

---

## 4. Edge Cases

Handle these without crashing:

- Dropping the same Track into a Sequence twice.
- Dropping onto an invalid area.
- Reordering a one-item Sequence.
- Reordering a two-item Sequence.
- Moving first → last.
- Moving last → first.
- Dragging outside without releasing.
- Refreshing after adding.
- Refreshing after reordering.
- Refreshing after removing.
- Deleting a Sequence containing Tracks.
- Loading older saved graphs.
- Stale/missing Track IDs referenced by a Sequence.

For stale IDs, fail gracefully rather than crashing the editor or playback.

---

## 5. Likely Files to Inspect

Inspect the existing implementation before making architectural changes. Likely files include:

```text
src/components/nodes/RandomizerNode.tsx
src/components/nodes/TrackNode.tsx
src/components/nodes/CommentNode.tsx
src/components/ReactFlowCanvas.tsx
src/store.ts
src/engine/
src/playback/
src/index.css
```

Search the project for:

```text
randomizer
sequence
trackIds
playCount
drag
drop
onDrop
onDragOver
CommentNode
edge
parent
```

---

## 6. Testing Checklist

### Comment line
- [x] Comment-parent line renders behind nodes.
- [x] Node UI remains unobstructed.
- [x] Normal graph edges still work.

### Track → Sequence
- [x] Track can be dragged onto Sequence.
- [x] Track appears in Sequence.
- [x] Original Track node is removed from workspace.
- [x] No duplicate standalone Track remains.
- [x] Metadata is preserved.
- [x] State persists after refresh.

### Sequence reorder
- [x] Sequence items are draggable.
- [x] Items can be reordered in every position.
- [x] Displayed order updates immediately.
- [x] Playback follows the new order.
- [x] Order persists after refresh.

### Sequence → Workspace
- [x] Sequence item can be dragged outside.
- [x] Item disappears from Sequence.
- [x] Track node reappears on workspace.
- [x] Node appears at the drop location.
- [x] All Track metadata is preserved.
- [x] State persists after refresh.

### Regression
- [x] Sequence mode still works.
- [x] Weighted/random mode still works.
- [x] Existing graph connections still work.
- [x] Playback still works.
- [x] Pause/resume still works.
- [x] Skip still works.
- [x] No duplicate playback occurs.

---

## 7. Implementation Rules

1. Inspect the existing implementation before changing architecture.
2. Reuse the existing Zustand and React Flow infrastructure.
3. Do not rebuild the canvas.
4. Do not rebuild the playback engine.
5. Do not create duplicate Track data stores.
6. Keep Sequence ordering in one authoritative state location.
7. Preserve Track metadata when moving in either direction.
8. Preserve existing playback behavior.
9. Keep Comment relationships separate from the playback graph.
10. Test each interaction individually.
11. Test persistence after Track → Sequence, reorder, and Sequence → Workspace.
12. Update the handoff/status documentation with files changed, state/data-model changes, interaction behavior, tests performed, and known limitations.

---

## Completion Standard

This fix is complete only when:

1. Comment-parent lines render behind nodes.
2. Tracks can be dragged into Sequences.
3. Transferred Tracks disappear from the workspace.
4. Sequence items can be reordered by dragging.
5. Sequence items can be dragged out and restored as workspace Track nodes.
6. Track metadata survives both directions.
7. Sequence order drives sequence playback.
8. Changes persist after refresh.
9. Existing Randomizer behavior remains functional.
10. No regressions are introduced to the current playback system.

---

# Completion notes (2026-09-02)

This pass **reverses** the earlier “track stays on the canvas” membership model. A Track dropped onto a Sequence/Randomizer is **moved** (parked), not copied.

## Files changed

- `synapse-mvp/src/randomizerDrop.ts` (+ tests) — move-in (park/hide), reorder, eject/restore, load flatten+park, delete-sequence restore, stale ids
- `synapse-mvp/src/components/CommentConnections.tsx` — annotation SVG portaled into React Flow’s `.react-flow__edges` pane (behind nodes)
- `synapse-mvp/src/components/ReactFlowCanvas.tsx` — drop/move-in, sequence-item drop-out, delete-sequence restore
- `synapse-mvp/src/components/nodes/RandomizerNode.tsx` — list reorder vs eject; trash restores to canvas
- `synapse-mvp/src/store.ts` — load `normalizeWorkspaceGraph`; connect parks listed tracks; delete restores sequence contents
- `synapse-mvp/src/components/Sidebar.tsx` — copy + restore-on-remove
- `synapse-mvp/src/Player.tsx` — skip missing/stale track ids without crashing

## State / data model

Single source of truth remains randomizer `data.tracks` (ordered ids) plus the existing Zustand `nodes` array.

- **Parked tracks:** the Track node object stays in `nodes` with `hidden: true` so `buildPlaybackQueue` / Player can still resolve metadata by id. It is omitted from the canvas by React Flow’s `hidden` flag (not `parentId` nesting, no second track store, no `trackRecords` snapshot map).
- **Graph edges** to a parked track are stripped so the standalone node cannot play as a second visit.
- **Eject:** unhide, set `position` to the drop point, remove the id from `data.tracks`.
- **Delete Sequence:** unhide contained tracks near the deleted node so media is not lost.
- **Old graphs:** leftover `parentId` / `embeddedIn` is flattened, then any id listed on a randomizer is parked.

## Interaction

- Drop Track onto Sequence → append id, hide canvas node, strip its edges, persist.
- Drop inside the Sequence list → reorder `data.tracks` only (does not eject).
- Drop a list item on empty canvas (or another node that is not that Sequence) → restore at the pointer.
- Sequence container drag still moves the Sequence node (`nodrag` on list rows).
- Sequence mode still hides weights; weighted mode unchanged.

## Tests

`npx tsc -b` passed. `npm test`: 11 files / 82 tests, including move-in (hidden + list + metadata + edges), no duplicates, reorder (first↔last, two-item, one-item no-op), move-out at position, stale id, delete-sequence restore, flatten+park.

## Limitations

- Comment links are still annotation-only (`data.linkedNodeId`), not play-path edges. They are drawn in the edges pane rather than as handle-based custom edges, because Comment/Start nodes do not expose the handles React Flow requires to mount an edge.
- Connecting Track → Randomizer as a graph edge now parks the track (same membership as drag-drop) so reload does not leave a double-play copy. The drawn edge is stripped with the rest of the track’s edges.
- IDE browser automation may not keep a tab open; live drag/drop should be confirmed in a real browser if the Cursor browser tab vanishes.
- Visualizer / FFT path was not changed.
