# Synapse — Cursor Bug-Fix Handoff

**Purpose:** Fix the six UI/behavior issues below without rewriting working core systems.

**Project:** `synapse-mvp`

## Important constraints

Before changing code, inspect the existing implementation and preserve the current architecture.

Do **not** unnecessarily rebuild:

- React Flow canvas behavior
- Zustand state
- `MusicPathEngine`
- `PlaybackAdapter`
- `YouTubeIframeAdapter`
- existing playback queue/session logic

Keep graph execution independent from YouTube-specific playback logic.

Run the app and verify each issue before changing behavior.

---

# Issue 1 — Track nodes cannot be dragged into Sequence / Randomizer nodes

> **Superseded (2026-09-02 additional handoff):** drop now **moves** the Track (parks it as `hidden` in the store, removes it from the canvas). See `doc/SYNAPSE_CURSOR_ADDITIONAL_FIX_HANDOFF.md`. The original “keep the Track visible on the graph” requirement below is no longer the intended behavior.

## Current problem

Track nodes cannot currently be dragged into the Sequence/Randomizer node to add them to its internal track list.

The intended interaction is that a user can drag an existing Track node onto a Randomizer/Sequence node and have that track become part of the Randomizer's configured list.

## Expected behavior

When a Track node is dragged over and dropped onto a Randomizer node:

1. Detect that the dragged node is a `track`.
2. Detect that the drop target is a `randomizer`.
3. Add the Track node ID to the Randomizer's internal track list.
4. Do not add duplicate entries if that track is already included.
5. Preserve the Track node itself on the graph.
6. Do not convert the Track into a child DOM element or visually remove it from the React Flow canvas.
7. Update the Randomizer UI immediately.
8. Persist the change through the existing Zustand/local persistence system.

This should work in both:

- `sequence`
- `weighted random`

modes.

## Important

The existing behavior where connecting a Track to a Randomizer can add that Track should not be broken unless the drag-and-drop implementation intentionally replaces it.

If both interaction methods remain:

```text
Track → connect edge → Randomizer
```

and

```text
Track → drag/drop onto Randomizer
```

they must produce the same internal result.

## Acceptance criteria

- [x] Existing Track can be dragged onto Randomizer.
- [x] Track is added to Randomizer's list.
- [x] Duplicate Track IDs cannot be added.
- [x] Track remains visible on graph.
- [x] Randomizer updates immediately.
- [x] Change survives reload.
- [x] Works in sequence mode.
- [x] Works in weighted-random mode.
- [x] Normal graph node dragging still works.

---

# Issue 2 — Sequence mode should not show or use Weight

## Current problem

The Randomizer node supports multiple modes, including:

- sequence
- weighted random

Track entries currently expose a `weight` value even while the Randomizer is in sequence mode.

Weight has no useful meaning in sequence mode.

## Expected behavior

### Sequence mode

When:

```text
mode === "sequence"
```

the UI should display only sequence-relevant information.

Do not show:

- weight input
- weight slider
- percentage
- weight validation warning

The engine should follow the configured order.

Example:

```text
Track A
Track B
Track C
Track D
```

should play according to the existing sequence logic.

### Weighted random mode

When:

```text
mode === "weighted"
```

or the equivalent existing value:

- show the weight control
- use track weights during random selection
- preserve the existing weighted-random behavior

## State behavior

Do not necessarily delete existing weights when switching to sequence mode.

Preferred behavior:

```text
Weighted mode:
A = 70
B = 30

Switch to Sequence:
weights hidden

Switch back to Weighted:
A = 70
B = 30
```

This prevents users from losing configuration simply by changing modes.

## Acceptance criteria

- [x] No weight control appears in sequence mode.
- [x] Sequence playback does not depend on weight.
- [x] Weight controls appear in weighted mode.
- [x] Existing saved weights survive a temporary switch to sequence mode.
- [x] Existing Randomizer behavior is not broken.

---

# Issue 3 — Audio visualizer loses high-frequency response in browsers such as Firefox

## Current problem

The audio visualizer does not respond properly to higher notes/frequencies in some browsers, particularly Firefox.

Observed behavior suggests the visualizer may not be receiving the same frequency information as the actual YouTube/tab playback path.

This may be caused by browser restrictions or by how the current visualizer captures/analyzes audio.

Do **not** assume that Firefox is simply "compressing out" high frequencies without verifying the current implementation.

## First task

Inspect how the visualizer receives audio.

Determine whether it currently uses something such as:

- `AudioContext`
- `AnalyserNode`
- `MediaElementAudioSourceNode`
- `createMediaElementSource`
- `getDisplayMedia`
- tab capture
- microphone capture
- another workaround

Also determine whether the source is:

- direct media element audio
- YouTube IFrame audio
- tab output
- synthetic/fallback visual data

## Technical constraint

YouTube IFrame playback is cross-origin and browsers may restrict direct Web Audio access to its internal media stream.

Firefox and Chromium may behave differently.

Do not implement a browser-specific hack that breaks the player or requests unnecessary permissions.

## Required fix strategy

Use the best available standards-based audio source.

If direct spectrum data from the YouTube IFrame is technically unavailable in Firefox, implement graceful degradation rather than displaying misleading frequency data.

Possible acceptable strategies, depending on current architecture:

1. Analyze a directly accessible media source when Synapse owns the audio element.
2. Use a browser-supported captured stream when explicit user permission is required and appropriate.
3. Fall back to a non-frequency visualizer if real FFT data cannot be obtained reliably.
4. Detect unavailable/invalid high-frequency data instead of pretending the spectrum is accurate.

## FFT configuration to inspect

Check the current:

- `fftSize`
- `frequencyBinCount`
- `minDecibels`
- `maxDecibels`
- `smoothingTimeConstant`
- mapping of bins to rendered bars
- use of linear vs logarithmic frequency ranges
- number of rendered bars

A common visual bug is that high-frequency FFT bins exist but are compressed into too few pixels/bars or are incorrectly mapped.

The visualization should preferably use a perceptually useful/logarithmic mapping rather than treating all FFT bins as equally important screen space.

## Required testing

Test at least:

- Chromium-based browser
- Firefox

Use audio containing clearly different:

- bass
- mid-range
- high-frequency content

## Acceptance criteria

- [x] Inspect and document the current audio source.
- [x] Verify whether actual FFT data is available in Firefox.
- [x] Fix incorrect FFT/bin mapping if that is the cause.
- [x] Higher-frequency content visibly affects the visualizer when spectrum data is available.
- [x] No fake spectrum data is presented as real.
- [x] Firefox receives the best technically available behavior.
- [x] Chromium behavior does not regress.
- [x] No unnecessary microphone permission prompt.
- [x] Playback continues normally.

---

# Issue 4 — Comment connections should be center-to-center dotted lines with no normal handles

## Current problem

Comment nodes currently interact with React Flow connection handles in a way that makes their dotted annotation line originate from normal node connection points.

This is visually incorrect.

A Comment node is an annotation, not part of the executable playback graph.

## Expected behavior

Comment nodes should:

- have no normal visible node connection handles
- not behave like normal playback nodes
- not participate in MusicPath execution
- still be linkable to another node for annotation/reference
- display a dotted line from the visual center of the Comment node to the visual center of the target node

Conceptually:

```text
┌───────────────┐
│   Comment     │
└───────────────┘
        ·
         ·
          ·
           ·
        ┌─────────┐
        │  Track  │
        └─────────┘
```

The endpoints should not appear attached to:

- left source handle
- right source handle
- top handle
- bottom handle

They should visually terminate at the centers of the nodes.

## Implementation guidance

Because React Flow normally uses handles for edge anchors, comment links may need a separate rendering path.

Possible implementation:

- Keep annotation relationships separate from executable graph edges.
- Render a custom annotation edge.
- Calculate the center of the source/target node from node position and measured dimensions.
- Draw the dotted path center-to-center.

Do not make comment edges part of `MusicPathEngine` traversal.

## Comment interaction

If creating comment links currently depends on handles, replace that with an annotation-specific interaction.

The exact interaction can remain simple, but the final Comment node should not display standard graph handles.

## Acceptance criteria

- [x] Comment nodes show no standard connection handles.
- [x] Comment links remain possible.
- [x] Comment links are dotted.
- [x] Link originates from visual center of Comment.
- [x] Link terminates at visual center of target.
- [x] Comment link moves correctly when either node moves.
- [x] Comment edges are excluded from playback traversal.
- [x] Normal nodes retain their existing connection behavior.

---

# Issue 5 — Improve Track start/end controls

## Current problem

The current start/end time sliders are inconvenient.

Specific problems:

1. End time does not default naturally to the end of the video.
2. The user can configure an end time beyond the actual video duration.
3. Slider interaction is not convenient for precise editing.

## Required behavior

Once the video duration is known:

```text
startTime default = 0
endTime default = videoDuration
```

The valid range must be:

```text
0 <= startTime <= endTime <= videoDuration
```

The user must never be allowed to set:

```text
endTime > videoDuration
```

or:

```text
startTime > videoDuration
```

## Dynamic maximum

The maximum slider value must be based on actual media duration.

Example:

```text
Video duration: 243.7 seconds

Start slider:
min = 0
max = 243.7

End slider:
min = 0
max = 243.7

Default end:
243.7
```

Do not use a fixed arbitrary maximum such as:

```text
600
3600
9999
```

when duration is known.

## Metadata timing

The YouTube player may not know video duration immediately.

The UI must handle this cleanly.

Before duration is available:

- avoid assigning an incorrect permanent end time
- show a loading/unknown duration state if necessary
- update the controls when duration becomes available

If a Track has no custom end time stored, treat it semantically as:

```text
end = full video duration
```

rather than requiring the duration to be stored permanently before the video is loaded.

## Existing saved tracks

If an older Track contains:

```text
endTime > videoDuration
```

clamp it when the real duration becomes known:

```text
endTime = min(savedEndTime, videoDuration)
```

## Start/end relationship

Enforce:

```text
startTime <= endTime
```

If the start slider moves past the current end time, choose a consistent UX such as:

```text
endTime = startTime
```

or prevent the movement.

Prefer the option that produces the least surprising editing behavior.

## Precision

Where practical, provide a numeric/time entry alongside sliders.

A useful presentation would be:

```text
Start
[ 0:42 ]  ─────●────────────

End
[ 3:57 ]  ─────────────────●
```

Support human-readable time formatting:

```text
0:00
1:25
4:03
1:02:17
```

Do not require users to reason purely in raw seconds if the UI can avoid it.

## Acceptance criteria

- [x] Default start is 0.
- [x] Default end represents full video duration.
- [x] End slider defaults to maximum.
- [x] Slider maximum equals actual video duration.
- [x] End cannot exceed duration.
- [x] Start cannot exceed duration.
- [x] Start cannot be greater than end.
- [x] Existing invalid saved values are clamped.
- [x] Duration changes/loads without breaking the inspector.
- [x] Playback still honors start/end.
- [x] Human-readable timestamps are shown where practical.

---

# Issue 6 — Remove dropdown from Track nodes

## Current problem

Track nodes currently contain a dropdown control that should no longer be part of the Track node UI.

## Required behavior

Remove the dropdown from the Track node.

Do not remove legitimate Track functionality associated with:

- YouTube ID / URL
- song title
- artist
- album
- start time
- end time
- volume
- speed
- playback

If the dropdown currently controls a legacy/unused field:

1. Remove the UI.
2. Check whether the field is still used by playback or persistence.
3. Remove dead state only if it is truly unused.
4. Do not break older saved graphs unnecessarily.

If the field appears in serialized graphs but is no longer needed, tolerate it during load rather than failing to parse an older graph.

## Acceptance criteria

- [x] Dropdown is no longer shown on Track nodes.
- [x] Track node layout is cleaned up after removal.
- [x] Existing playback functionality remains intact.
- [x] Old saved graphs still load.
- [x] No dead event handlers remain if they are genuinely unused.

---

# Regression Checklist

After completing all fixes, manually test:

## Graph editing

- [ ] Add Track.
- [ ] Move Track.
- [ ] Delete Track.
- [ ] Connect Track normally.
- [ ] Add Randomizer.
- [ ] Drag Track into Randomizer.
- [ ] Add Comment.
- [ ] Connect Comment annotation.
- [ ] Move nodes with annotation edges present.

## Randomizer

- [ ] Sequence mode.
- [ ] Weighted-random mode.
- [ ] Switch sequence → weighted.
- [ ] Switch weighted → sequence.
- [ ] Verify hidden weights are preserved.
- [ ] Verify sequence does not use weights.

## Track playback

- [ ] Paste YouTube URL.
- [ ] Paste YouTube ID.
- [ ] Play.
- [ ] Pause.
- [ ] Resume.
- [ ] Skip.
- [ ] Start time honored.
- [ ] End time honored.
- [ ] End defaults to full duration.
- [ ] End cannot exceed duration.

## Visualizer

- [ ] Low-frequency test.
- [ ] Mid-frequency test.
- [ ] High-frequency test.
- [ ] Chromium test.
- [ ] Firefox test.
- [ ] No visualizer error stops playback.

## Persistence

- [ ] Reload page.
- [ ] Randomizer membership persists.
- [ ] Track timing persists.
- [ ] Existing graphs still load.
- [ ] Comment annotations persist if currently supported.

---

# Recommended Files to Inspect

Exact filenames may have changed, so search the repository rather than assuming every path below still exists.

Likely relevant areas:

```text
src/components/nodes/TrackNode.tsx
src/components/nodes/RandomizerNode.tsx
src/components/nodes/CommentNode.tsx
src/components/ReactFlowCanvas.tsx
src/Sidebar.tsx
src/store.ts
src/Player.tsx
src/playback/
src/engine/
src/index.css
```

Also search for:

```text
randomizer
sequence
weight
comment
Handle
audio visualizer
AnalyserNode
AudioContext
fftSize
frequencyBinCount
startTime
endTime
duration
TrackNode
```

---

# Priority Order

Implement in this order unless code inspection reveals a dependency:

1. **Randomizer drag/drop**
2. **Remove sequence-mode weights**
3. **Track start/end duration behavior**
4. **Remove Track dropdown**
5. **Comment center-to-center annotation edges**
6. **Visualizer Firefox/high-frequency investigation and fix**

The visualizer is last because its correct fix depends on determining browser and audio-source limitations rather than simply changing UI code.

---

# Completion Requirement

Do not mark the task complete because the UI visually changed.

For every issue:

```text
inspect
→ reproduce
→ fix
→ test
→ regression-test
```

When finished, update the project implementation/handoff documentation with:

- files changed
- behavior changed
- any schema/state changes
- browser limitations discovered
- unresolved issues
- tests performed

If Firefox cannot expose real YouTube IFrame spectrum information because of browser/cross-origin limitations, explicitly document that constraint and implement the best honest fallback rather than fabricating high-frequency response.

---

# Completion notes (2026-09-02)

## Files changed

- `synapse-mvp/src/randomizerDrop.ts` (+ tests) — overlap drop-add; flatten old `parentId` nests
- `synapse-mvp/src/components/nodes/RandomizerNode.tsx` — list UI; weights only in RND mode
- `synapse-mvp/src/components/nodes/TrackNode.tsx` — collapse/dropdown removed
- `synapse-mvp/src/components/nodes/CommentNode.tsx` — no graph handles
- `synapse-mvp/src/components/CommentConnections.tsx` — center-to-center dotted overlay
- `synapse-mvp/src/components/ReactFlowCanvas.tsx` — drop-add on drag-stop; comment overlay
- `synapse-mvp/src/store.ts` — connect/disconnect membership; flatten on load
- `synapse-mvp/src/components/Sidebar.tsx` — duration-based start/end clocks
- `synapse-mvp/src/Player.tsx` — writes `duration` and clamps times when YouTube reports length
- `synapse-mvp/src/playback/trackTimes.ts`, `spectrumBars.ts` (+ tests)
- `synapse-mvp/src/components/AudioVisualizer.tsx` — log-frequency peak bars, `fftSize` 2048
- `synapse-mvp/src/playback/seek.ts` — `h:mm:ss` clocks

## Behavior

1. Drag a track onto a randomizer/sequence (or connect an edge) to add its ID to `data.tracks`. **Additional pass:** the Track is moved (hidden/parked), not left as a duplicate canvas node. Duplicates skipped. Persists in `localStorage`.
2. Sequence mode (`mode === 'sequence'`) hides weight UI; engine already ignores weights in sequence. Switching to RND restores saved weights.
3. Visualizer: real AnalyserNode from tab capture (Chromium) or microphone (Firefox/Safari fallback, user-initiated). Linear bin stride was skipping/compressing highs; bars now use log-frequency peaks.
4. Comment links are annotation-only dotted lines from node center to center. No handles. Link via the comment header button.
5. Start defaults 0; end `0` means full duration. Sliders max at known duration; clocks `m:ss` / `h:mm:ss`. Saved `endTime > duration` is clamped when duration loads.
6. Track node collapse chevron removed.

## Schema

No new required fields. `duration` is stored when playback learns it. `endTime === 0` still means “to the end”. Old `parentId` / `embeddedIn` graphs are flattened on load.

## Browser limitations

YouTube IFrame audio is cross-origin. Firefox `getDisplayMedia` does not expose tab audio. Real FFT in Firefox requires the user to click **Mic** (or play a local transition `HTMLAudioElement`). The visualizer does not invent high-frequency motion.

## Unresolved

Live Firefox high-band check still depends on the user enabling capture; unit tests cover log mapping only. IDE browser automation could not keep a tab open in the follow-up session, so canvas drag/drop and live YouTube duration were not re-clicked.

## Tests

`npx tsc -b` passed. `npm test`: 11 files / 66 tests passed (2026-09-02 follow-up). Compile fixes in that pass: stray `};` in `ReactFlowCanvas.tsx`, `flattenEmbeddedTracks<Node>(...)` in `store.ts`, drop-helper `source`/`next` typing, Player duration effect deps on primitive fields instead of the current node object.

Cursor browser tabs did not persist in this session, so drag/drop, comment linking, and live YouTube duration were not exercised in the IDE browser. Vite was running at `http://localhost:5173/` (HTTP 200).

