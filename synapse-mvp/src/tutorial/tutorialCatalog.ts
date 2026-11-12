import type { AppRoute } from '../app/routes';
import type {
  TutorialGroup,
  TutorialSection,
  TutorialStep,
} from './tutorialTypes';
import { tokenize } from './tutorialMatch';

function s(
  id: string,
  title: string,
  body: string,
  extra: Partial<TutorialStep> = {}
): TutorialStep {
  return { id, title, body, type: extra.type ?? 'info', ...extra };
}

export const SIMPLE_TUTORIAL_ID = 'quick-start';

export const TUTORIAL_SECTIONS: TutorialSection[] = [
  {
    id: SIMPLE_TUTORIAL_ID,
    title: 'Quick start',
    summary:
      'Build First Steps: your own songs, a Randomizer, connections, then play and keep it.',
    keywords:
      'quick start first run beginner first steps tour music path track randomizer connect play playlist pan zoom save',
    group: 'getting-started',
    steps: [
      s(
        'qs-account',
        'Your account',
        'Create an account or log in so this playlist can save. Google or email both work. Then the editor opens.',
        {
          type: 'action',
          route: 'signup',
          target: 'auth-panel',
          expectedAction: { type: 'account-ready' },
          praise: 'You’re in. Next is the canvas.',
          hint: 'Use Sign up in the header if you do not have an account yet.',
        }
      ),
      s(
        'qs-welcome',
        'Build something real',
        'By the end you will have a working playlist with a Start, several of your songs, a Randomizer, and an End. You keep it when the tour finishes.',
        {
          type: 'info',
          route: 'edit',
          target: 'workspace',
          basicBody:
            'The big grid in the middle is the canvas. The left column adds nodes. Play is in the top bar. We will not auto-build this playlist — you will click each step.',
          advancedBody:
            'You will wire Start → Randomizer → End and park your own tracks inside the Randomizer. The playlist stays when you finish.',
        }
      ),
      s(
        'qs-canvas',
        'Canvas vs nodes',
        'Empty grid is the view. Dragging a node moves that node. Clicking a node selects it and opens the inspector on the right. These are three different actions.',
        {
          type: 'info',
          route: 'edit',
          target: 'canvas',
          basicBody:
            'Look at the empty grid. That is the canvas. Dragging empty space moves the view (pan). Dragging a node moves only that node. Clicking a node selects it so the right panel shows its settings.',
          advancedBody:
            'Pan the view, drag nodes separately, click to select. Playback follows connections, not layout.',
        }
      ),
      s(
        'qs-pan',
        'Pan the view',
        'Right-drag or middle-drag empty canvas to pan. Left-drag on empty space draws a selection box.',
        {
          type: 'action',
          route: 'edit',
          target: 'canvas',
          expectedAction: { type: 'viewport-changed', kind: 'pan' },
          praise: 'That is panning — the nodes stayed put, the camera moved.',
          hint: 'If a node moves instead, you grabbed the node. Click empty grid, then drag.',
          basicBody:
            'In Basic, left-drag empty canvas to slide the view. Try it until the camera moves and the nodes stay where they are.',
          advancedBody: 'Pan the canvas (right-drag or middle-drag on empty grid).',
          recovery: 'If you moved a node, press Ctrl+Z (Cmd+Z) to undo, then drag empty grid instead.',
        }
      ),
      s(
        'qs-zoom',
        'Zoom',
        'Scroll the mouse wheel over the canvas to zoom. The + / − buttons on the bottom-left canvas controls do the same.',
        {
          type: 'action',
          route: 'edit',
          target: 'canvas-controls',
          expectedAction: { type: 'viewport-changed', kind: 'zoom' },
          praise: 'Zoom only changes how close you are. It does not change playback.',
          hint: 'Hover the grid, then roll the wheel. Or click + / − on the bottom-left control stack.',
          advancedBody: 'Wheel-zoom or use the bottom-left + / −.',
        }
      ),
      s(
        'qs-controls',
        'Fit and focus',
        'On the bottom-left stack, Fit view is the dashed-square. Focus selected (the target icon beside the zoom %) frames the node you have selected.',
        {
          type: 'highlight',
          route: 'edit',
          target: 'canvas-controls',
          hint: 'You do not have to click them now. Use Fit view later if the graph drifts off-screen.',
          advancedBody: 'Fit view and Focus selected sit on the bottom-left canvas chrome.',
        }
      ),
      s(
        'qs-start',
        'Start node',
        'The Start node is already on the canvas — the gold card labeled Start. Playback begins there. You can have only one. If it is missing, click Start in the left rack.',
        {
          type: 'action',
          route: 'edit',
          target: 'node-start',
          expectedAction: { type: 'node-count', nodeType: 'start', min: 1 },
          praise: 'Start is the entrance to the path.',
          hint: 'If you do not see Start, click Start in the left module rack. A second Start is blocked on purpose.',
          basicBody:
            'Find the gold Start card on the canvas. That is where playback begins. The left rack’s Start button adds one only if it is missing — Synapse allows a single Start.',
          advancedBody: 'Confirm the Start node is on the canvas (only one is allowed).',
          recovery: 'If you added the wrong node, select it and press Delete, then add Start from the left rack.',
        }
      ),
      s(
        'qs-track',
        'Add your first Track',
        'In the left rack, click Track (or drag it onto the canvas). A Track is one YouTube song.',
        {
          type: 'action',
          route: 'edit',
          target: 'rack-track',
          expectedAction: { type: 'node-created', nodeType: 'track' },
          praise: 'Track added. Next you will pick a song you actually like.',
          hint: 'The rack is the left column. The row labeled Track is the one you want — not Randomizer or Comment.',
          recovery: 'Wrong node? Select it and press Delete (or Ctrl+Z), then click Track in the left rack.',
        }
      ),
      s(
        'qs-url',
        'Pick a song',
        'Click the Track, then in the right inspector paste a YouTube URL or 11-character video ID. Use a video that is allowed to embed.',
        {
          type: 'action',
          route: 'edit',
          target: 'track-url',
          expectedAction: { type: 'track-url', min: 1 },
          praise: 'Song attached. Playback uses this video, not the title text.',
          hint: 'If the inspector is empty, click the Track card first. The URL field is under YouTube.',
          basicBody:
            'Click your new Track card so it is selected. On the right, find YouTube URL / ID and paste a watch link for a song you like. Title and artist are display-only.',
        }
      ),
      s(
        'qs-track-more',
        'Add two more Tracks',
        'Click Track in the left rack twice more so you have three Track cards. Each one will be a different song in the pool.',
        {
          type: 'action',
          route: 'edit',
          target: 'rack-track',
          expectedAction: { type: 'node-count', nodeType: 'track', min: 3 },
          praise: 'Three tracks on the canvas.',
          hint: 'Click Track in the rack again. You need three Track cards before this step continues.',
        }
      ),
      s(
        'qs-url-more',
        'Give each Track a song',
        'Select each remaining Track and paste a different YouTube URL. Pick music you would actually play.',
        {
          type: 'action',
          route: 'edit',
          target: 'track-url',
          expectedAction: { type: 'track-url', min: 3 },
          praise: 'All three tracks have songs.',
          hint: 'Click a Track with no title yet, paste a URL, then click the next one.',
        }
      ),
      s(
        'qs-randomizer',
        'Add a Randomizer',
        'In the left rack, click Randomizer. Place it to the right of Start. This node holds a pool of songs and picks one when playback reaches it.',
        {
          type: 'action',
          route: 'edit',
          target: 'rack-randomizer',
          expectedAction: { type: 'node-created', nodeType: 'randomizer' },
          praise: 'Randomizer added. Tracks will live inside it, not as a line of cards.',
          hint: 'The rack row is Randomizer — the dice-style item under Conditional.',
          recovery: 'If you added a Conditional instead, delete it and click Randomizer in the rack.',
          advancedBody: 'Add a Randomizer from the rack.',
        }
      ),
      s(
        'qs-connect-start',
        'Connect Start to the Randomizer',
        'Drag from the small handle on the right of Start onto the left handle of the Randomizer. A line should appear. That line is the play path — layout is not.',
        {
          type: 'action',
          route: 'edit',
          target: 'canvas',
          expectedAction: {
            type: 'nodes-connected',
            sourceType: 'start',
            targetType: 'randomizer',
          },
          praise: 'Connected. Playback will enter the Randomizer from Start.',
          hint: 'Grab the dot on the right side of Start, keep the mouse down, and drop on the left dot of the Randomizer.',
          recovery:
            'A Track-to-Randomizer line parks that Track inside the pool instead. Undo if that was accidental, then drag Start’s output to the Randomizer.',
        }
      ),
      s(
        'qs-park',
        'Park tracks in the pool',
        'Drag each Track card onto the Randomizer until the Track disappears into its list. You need at least two songs in the pool. Dragging is the Synapse way — those tracks are not a separate line on the graph.',
        {
          type: 'action',
          route: 'edit',
          target: 'node-randomizer',
          expectedAction: { type: 'track-parked', min: 2 },
          praise: 'Those songs now live in the Randomizer.',
          hint: 'Drag a Track until it overlaps the Randomizer, then release. Repeat for a second Track.',
          basicBody:
            'Click and drag a Track card onto the Randomizer card. It should vanish from the canvas and show up in the Randomizer list. Do that with at least two tracks.',
        }
      ),
      s(
        'qs-rand-mode',
        'Switch to weighted random',
        'Click the Randomizer, then in the inspector set Playback Mode to Randomizer. Sequence plays the list in order; Randomizer picks with weights — that is the feature that makes this playlist different from a normal list.',
        {
          type: 'action',
          route: 'edit',
          target: 'randomizer-mode',
          expectedAction: { type: 'node-data', nodeType: 'randomizer', field: 'mode' },
          praise: 'Mode saved. Next playthrough can pick a different song from the pool.',
          hint: 'Select the Randomizer first. Playback Mode is at the top of the right inspector.',
        }
      ),
      s(
        'qs-rand-weight',
        'Change a weight',
        'Still on the Randomizer, raise or lower a Weight next to one parked song. Higher weight is more likely when the pool is reached.',
        {
          type: 'action',
          route: 'edit',
          target: 'randomizer-weights',
          expectedAction: { type: 'node-data', nodeType: 'randomizer', field: 'weights' },
          praise: 'Weight changed. You will hear the difference over several plays, not in one listen.',
          hint: 'Weights appear only in Randomizer mode, under the parked track list.',
        }
      ),
      s(
        'qs-end',
        'Add an End',
        'Click End in the left rack. End is a clear stop so playback does not wander off the graph.',
        {
          type: 'action',
          route: 'edit',
          target: 'rack-end',
          expectedAction: { type: 'node-created', nodeType: 'end' },
          praise: 'End added.',
          hint: 'End is the last item in the left rack.',
          recovery: 'Wrong node? Delete it, then click End in the rack.',
        }
      ),
      s(
        'qs-connect-end',
        'Connect Randomizer to End',
        'Drag from the Randomizer’s right handle to the End’s left handle. After the pool picks a song, playback continues to End and stops.',
        {
          type: 'action',
          route: 'edit',
          target: 'canvas',
          expectedAction: {
            type: 'nodes-connected',
            sourceType: 'randomizer',
            targetType: 'end',
          },
          praise: 'The path is Start → Randomizer → End.',
          hint: 'Yellow dots on both cards mark the handles. Drag Randomizer output onto End input.',
        }
      ),
      s(
        'qs-organize',
        'Tidy the graph',
        'Drag Start, Randomizer, and End into a left-to-right line. Connections stay attached. Layout is for you — the engine only follows the lines.',
        {
          type: 'action',
          route: 'edit',
          target: 'canvas',
          expectedAction: { type: 'node-moved' },
          praise: 'Connections stayed on the nodes. You can rearrange anytime.',
          hint: 'Drag a node by its body, not by the small handle (the handle draws a new line).',
          advancedBody: 'Nudge the nodes into a readable left-to-right path.',
        }
      ),
      s(
        'qs-comment',
        'Optional: a Comment',
        'Comments are notes. They never play. Click Comment in the left rack if you want a label, or press Next to skip.',
        {
          type: 'highlight',
          route: 'edit',
          target: 'rack-comment',
          hint: 'After adding one, type in the inspector. Comments have no play-path handles.',
        }
      ),
      s(
        'qs-minimap',
        'Minimap',
        'The small map in the bottom-right shows the whole graph. Use it when nodes sit off-screen. You can collapse it with the map button.',
        {
          type: 'highlight',
          route: 'edit',
          target: 'minimap',
          advancedBody: 'Minimap is bottom-right if you need it later.',
        }
      ),
      s(
        'qs-play',
        'Play First Steps',
        'Press Play in the top bar. The current node lights up. When the Randomizer is reached, one parked song is chosen. If the browser blocks autoplay, press Play once more. YouTube must be allowed to embed the video.',
        {
          type: 'action',
          route: 'edit',
          target: 'header-play',
          expectedAction: { type: 'playing' },
          praise: 'Playback started. Pause from the same button or the deck at the bottom.',
          hint: 'Play is in the header, to the right of Edit / Listen. The bottom deck also has transport controls.',
          basicBody:
            'Click the Play button in the top bar. Watch which node lights up. At the Randomizer, one of your parked songs plays. Pause with the same control. If nothing starts, click Play again — some browsers block the first autoplay.',
        }
      ),
      s(
        'qs-name',
        'Name it First Steps',
        'Click the playlist name in the top bar (left of the dropdown) and type First Steps, then press Enter. Autosave already writes this path to your account. You can rename it later.',
        {
          type: 'action',
          route: 'edit',
          target: 'playlist-name',
          expectedAction: { type: 'playlist-renamed' },
          praise: 'Name saved. This playlist stays in your library after the tutorial.',
          hint: 'The name field is in the header, to the right of Saving / Saved. If First Steps is taken, First Steps copy is fine.',
        }
      ),
      s(
        'qs-done',
        'Keep going',
        'You built a real playlist: a start, your songs in a weighted pool, and an end. Keep using it, change the songs, or open another tutorial topic from the ? button.',
        { type: 'complete', route: 'edit', target: 'workspace' }
      ),
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    summary: 'Overview, workspace, Start and Track nodes, connections, and first play.',
    keywords:
      'overview workspace navigation music path start node track connecting play beginner tour',
    group: 'getting-started',
    steps: [
      s(
        'gs-account',
        'Your account',
        'Sign in or create an account first. The rest of this walkthrough lives on your workspace.',
        {
          type: 'action',
          route: 'signup',
          target: 'auth-panel',
          expectedAction: { type: 'account-ready' },
          praise: 'Account ready. Opening the workspace.',
        }
      ),
      s(
        'gs-welcome',
        'Synapse overview',
        'Synapse is a visual Music Path: Start, songs, branches, and styles on a canvas. Playback follows the graph — not a flat playlist.',
        { type: 'info', route: 'edit', target: 'workspace' }
      ),
      s(
        'gs-nav',
        'Workspace navigation',
        'Edit is the graph. Listen is the same path as a list. Settings holds themes and import. Profile is your identity on this account.',
        { type: 'highlight', route: 'edit', target: 'app-nav' }
      ),
      s(
        'gs-paths',
        'Music Paths',
        'Each playlist is a Music Path stored on your signed-in account. Rename it in the top bar, or switch paths from the playlist menu.',
        { type: 'highlight', route: 'edit', target: 'playlist-switcher' }
      ),
      s(
        'gs-start',
        'Start node',
        'Playback walks from the Start node unless you drop the playback marker on another playable node. Keep one Start on the path.',
        { type: 'highlight', route: 'edit', target: 'node-start' }
      ),
      s(
        'gs-track',
        'Add a Track',
        'Click Track Node in the module rack, or drag it onto the canvas. That node is one YouTube song on the path.',
        {
          type: 'action',
          route: 'edit',
          target: 'rack-track',
          expectedAction: { type: 'node-created', nodeType: 'track' },
          praise: 'Great! Track node added.',
        }
      ),
      s(
        'gs-connect',
        'Connecting nodes',
        'Drag from a node’s output handle to another node’s input. Start should lead into your first Track. Click an edge later to delete it.',
        {
          type: 'action',
          route: 'edit',
          target: 'canvas',
          expectedAction: { type: 'nodes-connected' },
          praise: 'Connected. Playback can follow that edge.',
        }
      ),
      s(
        'gs-play',
        'Playing a Music Path',
        'Press Play in the header (Edit) or the deck. Minimize the deck if you need more room on Settings or Profile — the video stays loaded. The bottom bar shows the current song.',
        {
          type: 'action',
          route: 'edit',
          target: 'header-play',
          expectedAction: { type: 'playing' },
          praise: 'Playback started.',
        }
      ),
    ],
  },
  {
    id: 'building',
    title: 'Building Music Paths',
    summary: 'Add, move, select, inspect, disconnect, and clear nodes. Playback marker.',
    keywords:
      'add move connect disconnect select inspector settings playback marker remove all delete nodes canvas',
    group: 'building',
    steps: [
      s(
        'b-add',
        'Adding nodes',
        'Every node type lives in the left module rack. Click to drop one, or drag onto the canvas. There can be only one Start.',
        { type: 'highlight', route: 'edit', target: 'sidebar' }
      ),
      s(
        'b-move',
        'Moving nodes',
        'Drag a node on the grid to rearrange the path. Hold Shift to snap to alignment guides (sides, red center lines, 45°, and even spacing). The graph is what matters for playback, not the exact layout.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'b-connect',
        'Connecting nodes',
        'Non-branching nodes allow one outgoing edge. Conditionals can fan out from numbered handles. Tracks, End, Randomizer, Transition, and Style can take multiple inputs.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'b-disconnect',
        'Disconnecting nodes',
        'Click an edge to remove it. The nodes stay. Comments never use graph edges — they use annotation lines instead.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'b-select',
        'Selecting nodes',
        'Click a node to select it. Shift-click to add more. Drag a box on empty canvas to multi-select (middle- or right-drag pans). Ctrl+C / Ctrl+V copies and pastes the selection; Ctrl+D duplicates it. Ctrl/Cmd+K opens the command palette for Play, Stop, add node, and jump to Settings.',
        {
          type: 'action',
          route: 'edit',
          target: 'canvas',
          expectedAction: { type: 'node-selected' },
          praise: 'Inspector is for that node.',
        }
      ),
      s(
        'b-inspector',
        'Node settings',
        'The inspector is where YouTube IDs, weights, times, and Style themes live. Click a song for Settings (global and local), YouTube info, and playlist/sequence context. Jump chips under Node Settings scroll to each section. Multi-select is for moving, copying, and pasting.',
        { type: 'highlight', route: 'edit', target: 'inspector' }
      ),
      s(
        'b-marker',
        'Playback marker',
        'The yellow-orange marker sits on the current (or chosen) node. Drag it onto a playable node to rebuild the queue from there — comments are not valid targets.',
        { type: 'highlight', route: 'edit', target: 'playback-marker' }
      ),
      s(
        'b-remove',
        'Removing nodes',
        'Select a node and press Delete or Backspace, or use Remove in the inspector. Deleting a Sequence restores parked tracks nearby.',
        { type: 'highlight', route: 'edit', target: 'inspector' }
      ),
      s(
        'b-remove-all',
        'Remove All',
        'Remove All clears the canvas. It is destructive — there is no undo yet. Use it only when you want a blank path.',
        { type: 'highlight', route: 'edit', target: 'remove-all' }
      ),
    ],
  },
  {
    id: 'align-guides',
    title: 'Alignment guides',
    summary: 'Hold Shift to snap nodes to sides, red center lines, 45° corners, and even spacing.',
    keywords:
      'align alignment snap shift guides center line midline red dashed 45 diagonal spacing dimension',
    group: 'building',
    steps: [
      s(
        'ag-shift',
        'Hold Shift',
        'Hold Shift while the pointer is on the canvas. Nearby node edges show thin grey dashes. Dragging a node with Shift held snaps it onto those guides instead of only drawing them. Shift does not arm snap while a text box is focused.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'ag-center',
        'Center lines',
        'Red dashed center lines are the vertical and horizontal midlines of a node. They appear only when you are on (or snapping to) that midline — not on every nearby node. Drag until the red line shows, and the node locks to the center of the other node’s side.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'ag-sides',
        'Side snapping',
        'Grey dashes mark left, right, top, and bottom. A dragged node snaps to a matching edge when it is close, so rows and columns line up.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'ag-diagonal',
        '45° from a corner',
        'A thin blue dotted line appears when a corner of the dragged node lines up 45° from another node’s corner. The node snaps onto that diagonal.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'ag-spacing',
        'Constant spacing',
        'If several nodes already share a gap (for example five nodes 50px apart), dragging another node near the end of that run shows solid blue dimension lines for that gap. The node snaps so the same spacing continues.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
    ],
  },
  {
    id: 'track-nodes',
    title: 'Track Nodes',
    summary: 'YouTube ID or URL, credits, start/end, volume, and speed.',
    keywords:
      'youtube url video id metadata title artist album start end volume speed playback track song',
    group: 'building',
    steps: [
      s(
        't-add',
        'Adding a YouTube song',
        'Select a Track node. The inspector is where the song is defined — the canvas card shows title, artist, and album.',
        {
          type: 'action',
          route: 'edit',
          target: 'node-track',
          expectedAction: { type: 'node-selected', nodeType: 'track' },
          praise: 'Track selected.',
        }
      ),
      s(
        't-url',
        'YouTube URL / ID',
        'Paste a watch URL or the 11-character video ID. Synapse extracts the ID and uses it for the YouTube player.',
        {
          type: 'action',
          route: 'edit',
          target: 'track-url',
          expectedAction: { type: 'track-url' },
          praise: 'Song ID saved.',
        }
      ),
      s(
        't-meta',
        'Song metadata',
        'Title, artist, and album can be typed or filled with Autofill credits (oEmbed + iTunes, optional YouTube API key). They are display only — playback uses the video ID.',
        { type: 'highlight', route: 'edit', target: 'track-metadata' }
      ),
      s(
        't-start',
        'Start time',
        'Start is when the clip begins. Until duration is known (after the video has loaded), clocks are estimates.',
        { type: 'highlight', route: 'edit', target: 'track-time' }
      ),
      s(
        't-end',
        'End time',
        'End 0 means play to the real end of the video. A later time clips the song. This is the engine rule, not a UI quirk.',
        { type: 'highlight', route: 'edit', target: 'track-time' }
      ),
      s(
        't-vol',
        'Volume',
        'Volume % is applied to the YouTube player for this track.',
        { type: 'highlight', route: 'edit', target: 'track-volume' }
      ),
      s(
        't-speed',
        'Playback speed',
        'Speed % becomes the player playback rate. Pitch, tempo, and EQ sliders are stored but not applied yet.',
        { type: 'highlight', route: 'edit', target: 'track-speed' }
      ),
      s(
        't-behavior',
        'Track node behavior',
        'Tracks play in queue order. Play count on the node repeats the clip. Parking a track into a Randomizer hides it on the canvas until you drag it out.',
        { type: 'info', route: 'edit', target: 'node-track' }
      ),
    ],
  },
  {
    id: 'conditionals',
    title: 'Conditional / Splitter Nodes',
    summary: 'Branches, named paths, weighted random, time range, weather, day/date, and Choice popups.',
    keywords:
      'conditional splitter branch named path weighted random time range weather day date rules path fork choice popup key',
    group: 'building',
    steps: [
      s(
        'c-create',
        'Creating branches',
        'Add a Conditional from the rack. It is the path splitter: one incoming walk, several outgoing handles.',
        {
          type: 'action',
          route: 'edit',
          target: 'rack-conditional',
          expectedAction: { type: 'node-created', nodeType: 'conditional' },
          praise: 'Conditional added.',
        }
      ),
      s(
        'c-outputs',
        'Connecting multiple outputs',
        'Each lettered handle is one path (A, B, …). Connect each handle to the next node (Track, Randomizer, another Conditional, and so on). Name branches in the inspector — those names show on the node and in the Choice popup.',
        { type: 'highlight', route: 'edit', target: 'node-conditional' }
      ),
      s(
        'c-random',
        'Weighted random mode',
        'In the inspector, Weighted Random uses the path weights. Higher weight is more likely. Normalize Conditionals flattens stacked weighted-random splitters and multiplies their weights. Weather, time-range, and day conditionals are not merged.',
        { type: 'highlight', route: 'edit', target: 'conditional-mode' }
      ),
      s(
        'c-time',
        'Time Range mode',
        'Time Range picks a branch from the clock on this device. Set start/end hours per path in the inspector.',
        { type: 'highlight', route: 'edit', target: 'conditional-mode' }
      ),
      s(
        'c-weather',
        'Weather mode',
        'Weather uses a normalized condition from Open-Meteo (Profile location or geolocation, cached). Other / Unknown is the fallback when data is missing.',
        { type: 'highlight', route: 'edit', target: 'conditional-mode' }
      ),
      s(
        'c-day',
        'Day / Date rules',
        'Day / Date can match weekday, month, year, specific dates, ranges, or repeating annual windows. One path can be a catch-all.',
        { type: 'highlight', route: 'edit', target: 'conditional-mode' }
      ),
      s(
        'c-choice',
        'Choice mode',
        'Choice does not auto-pick. When playback reaches this node, a popup lists the named paths. Click one, or press the key you assigned in the inspector. You do not drag the play circle to choose.',
        { type: 'highlight', route: 'edit', target: 'conditional-mode' }
      ),
      s(
        'c-select',
        'Understanding branch selection',
        'Weighted, time, weather, and day Conditionals pick one outgoing path when the walk reaches them — they do not play every branch. Choice waits for the listener. Listen still lists the other forks so you can jump.',
        { type: 'info', route: 'listen', target: 'listen-path' }
      ),
    ],
  },
  {
    id: 'randomizer',
    title: 'Randomizer Nodes',
    summary: 'Sequence vs weighted pool, parked tracks, reorder, play count, no repeats.',
    keywords:
      'randomizer sequence weighted random tracks reorder drag out play count forever pool no repeats',
    group: 'building',
    steps: [
      s(
        'r-seq',
        'Sequence mode',
        'Sequence plays listed tracks in order. Name it in the inspector (travel, childhood, techno, …). Bring selected or all named nodes onto one canvas page from the rack, inspector, or Ctrl/Cmd+K. Weights are hidden in this mode but kept if you switch back to random.',
        { type: 'highlight', route: 'edit', target: 'rack-randomizer' }
      ),
      s(
        'r-rnd',
        'Weighted random mode',
        'Randomizer mode picks from the list with weights. The engine uses the same weighted pick as Conditionals.',
        { type: 'highlight', route: 'edit', target: 'node-randomizer' }
      ),
      s(
        'r-add',
        'Adding tracks',
        'Drag a Track node onto the Randomizer (or connect an edge). The track is moved into the list and hidden on the canvas — not copied.',
        { type: 'highlight', route: 'edit', target: 'node-randomizer' }
      ),
      s(
        'r-order',
        'Reordering tracks',
        'In the inspector, the list order is the sequence order. Sequence mode uses that list; random mode uses it plus weights.',
        { type: 'highlight', route: 'edit', target: 'inspector' }
      ),
      s(
        'r-out',
        'Dragging tracks out',
        'Drag a list item back onto the canvas to restore the Track at the drop point. Deleting the Randomizer restores its tracks nearby.',
        { type: 'info', route: 'edit', target: 'node-randomizer' }
      ),
      s(
        'r-count',
        'Play count',
        'Play count is how many times Weighted Random picks a track, or how many times Sequence plays the list, before continuing. Raise it to loop the pool.',
        { type: 'highlight', route: 'edit', target: 'randomizer-count' }
      ),
      s(
        'r-norepeats',
        'No repeats',
        'On Weighted Random, turn on No repeats so a song already picked from this node cannot be picked again until playback returns to it. Sequence mode still plays the list in order.',
        { type: 'highlight', route: 'edit', target: 'randomizer-norepeats' }
      ),
      s(
        'r-forever',
        'Forever mode',
        'A very high play count keeps the walk inside this node. There is no separate forever toggle yet — use play count for long loops, and End when the path should stop.',
        { type: 'info', route: 'edit', target: 'inspector' }
      ),
      s(
        'r-behavior',
        'Randomization behavior',
        'Picks are made when the queue is built (and when Skip rebuilds). The same seed is not exposed in the UI yet, so live random walks can differ each Play.',
        { type: 'info', route: 'edit', target: 'header-play' }
      ),
    ],
  },
  {
    id: 'transitions',
    title: 'Transition Nodes',
    summary: 'Silence, custom audio, YouTube clips, timing, and wiring.',
    keywords:
      'transition silence audio youtube video timing connect gap between tracks',
    group: 'building',
    steps: [
      s(
        'tr-silence',
        'Silence transitions',
        'A Transition on the path can insert silence for a duration. Place it between tracks when you want a gap.',
        { type: 'highlight', route: 'edit', target: 'rack-transition' }
      ),
      s(
        'tr-audio',
        'Custom audio',
        'Custom audio mode stores a local file reference on the node. Treat this as a demo-level path item — YouTube remains the main player.',
        { type: 'highlight', route: 'edit', target: 'node-transition' }
      ),
      s(
        'tr-yt',
        'YouTube transition videos',
        'YouTube type uses a video ID like a Track, for a bumper or interstitial clip.',
        { type: 'highlight', route: 'edit', target: 'inspector' }
      ),
      s(
        'tr-time',
        'Transition timing',
        'Duration is the hold for silence (and a cue for other types). Keep transitions short unless the clip is the point.',
        { type: 'highlight', route: 'edit', target: 'inspector' }
      ),
      s(
        'tr-connect',
        'Connecting transitions',
        'Wire Transition like any other path node: incoming from the previous song, outgoing to the next. It is part of the playback queue.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
    ],
  },
  {
    id: 'comments',
    title: 'Comment Nodes',
    summary: 'Annotations, dotted links, and why they never change playback.',
    keywords:
      'comment annotation annotation line dotted link note sticky does not play',
    group: 'building',
    steps: [
      s(
        'cm-create',
        'Creating comments',
        'Add a Comment from the rack. It is a note on the canvas, not a song.',
        {
          type: 'action',
          route: 'edit',
          target: 'rack-comment',
          expectedAction: { type: 'node-created', nodeType: 'comment' },
          praise: 'Comment added.',
        }
      ),
      s(
        'cm-annotate',
        'Using comments as annotations',
        'Type in the inspector (or on the node). Use comments for arrangement notes, credits, or “why this branch exists.”',
        { type: 'highlight', route: 'edit', target: 'node-comment' }
      ),
      s(
        'cm-move',
        'Moving comments',
        'Drag them like any node. They do not need to sit on the play-path.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'cm-link',
        'Comment connections',
        'Comments have no graph handles. Linking draws a dotted line to another node, behind the nodes, and is ignored by the engine.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'cm-play',
        'Why comments do not affect playback',
        'The queue only walks playable types (tracks, transitions, style cues, branches). Comments are documentation.',
        { type: 'info', route: 'edit', target: 'player' }
      ),
    ],
  },
  {
    id: 'styles-themes',
    title: 'Styles & Themes',
    summary: 'Settings themes, custom editor, fonts, Style nodes, and path toggle.',
    keywords:
      'theme custom editor fonts colors node style background style node interpolation cherry path settings arrow bezier edge',
    group: 'customization',
    steps: [
      s(
        'st-select',
        'Selecting themes',
        'Settings → Themes has 25 presets. Search and click to apply. This is your saved look — Style nodes do not overwrite it.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'settings-themes' }
      ),
      s(
        'st-custom',
        'Custom themes',
        'Duplicate or Edit a theme to make a custom copy saved on your account. Save / Cancel / Reset lock the editor so the live workspace does not surprise you.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'theme-actions' }
      ),
      s(
        'st-editor',
        'Theme editor',
        'The editor has an isolated preview. Colors, fonts, and arrow type update the draft until you Save. Imported JSON cannot run code.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'theme-editor' }
      ),
      s(
        'st-arrows',
        'Arrow type',
        'Graph edges follow the theme: bezier, simple bezier, straight, rectangular, rounded, or triangular (straight, 45°, straight). Each preset picks a type that matches its vibe. Change it under Settings → Themes.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'theme-edge-type' }
      ),
      s(
        'st-viz-bars',
        'Visualizer bars',
        'The spectrum bar count is part of the theme, so Style nodes can change it during playback. Presets pick a density that matches the look. Edit it under Themes or Visualizer.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'theme-visualizer-bars' }
      ),
      s(
        'st-fonts',
        'Fonts',
        'Typography picks are allowlisted. Unknown fonts in imported JSON are rejected or ignored so a theme cannot load arbitrary CSS.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'theme-fonts' }
      ),
      s(
        'st-colors',
        'Colors',
        'Each token (background, text, accent, nodes, player) is a color. They drive CSS variables across Edit, Listen, and marketing chrome.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'theme-colors' }
      ),
      s(
        'st-nodes',
        'Node styles',
        'Node chrome follows the theme. A Style node can also retarget node layers during playback without saving Settings.',
        { type: 'highlight', route: 'edit', target: 'node-track' }
      ),
      s(
        'st-bg',
        'Backgrounds',
        'Workspace background and grid come from the theme. Style nodes can change those layers while a path plays.',
        { type: 'highlight', route: 'edit', target: 'canvas' }
      ),
      s(
        'st-style-node',
        'Style nodes',
        'Add a Style node and pick a saved theme plus optional layers. When playback reaches it, the UI eases into that look.',
        { type: 'highlight', route: 'edit', target: 'rack-style' }
      ),
      s(
        'st-smooth',
        'Smooth style transitions',
        'Duration, delay, and easing live on the Style node. Delay waits after the node is reached so you can line the look up with a moment in the next song. Path end, Stop, and Settings theme restore Settings. Path theme reapplies the path look without dragging the marker.',
        { type: 'highlight', route: 'edit', target: 'theme-toggle' }
      ),
    ],
  },
  {
    id: 'overlays',
    title: 'Overlays',
    summary: 'Image and GIF overlays are planned; packages skip them for now.',
    keywords:
      'overlay image gif position appearance animation theme-controlled visual assets pro',
    group: 'customization',
    steps: [
      s(
        'ov-image',
        'Adding image overlays',
        'Image overlays on the canvas are not in this build. Future paths will pin images above the graph without affecting the engine.',
        { type: 'info', route: 'settings', hash: 'settings-pro', target: 'settings-pro' }
      ),
      s(
        'ov-gif',
        'Adding GIFs',
        'GIF overlays are also reserved. Importing a package that mentions overlay assets shows a skip notice instead of dropping the playlist.',
        { type: 'info', route: 'settings', hash: 'settings-import', target: 'settings-import' }
      ),
      s(
        'ov-pos',
        'Positioning overlays',
        'When overlays ship, they will be positioned in workspace coordinates — same pan/zoom as nodes, not a separate layer editor.',
        { type: 'info', route: 'edit', target: 'canvas' }
      ),
      s(
        'ov-look',
        'Overlay appearance',
        'Opacity, size, and blend will follow the same theme tokens so overlays do not invent a second visual system.',
        { type: 'info', route: 'settings', hash: 'settings-themes', target: 'settings-themes' }
      ),
      s(
        'ov-theme',
        'Theme-controlled overlays',
        'A Style node will be able to show or restyle overlays as a layer, the same way it already restyles workspace chrome.',
        { type: 'highlight', route: 'edit', target: 'rack-style' }
      ),
      s(
        'ov-anim',
        'Animation settings',
        'Motion follows Settings → Appearance (system, reduce, or allow). Style interpolation already skips when motion is reduced.',
        { type: 'info', route: 'settings', hash: 'settings-appearance', target: 'settings-appearance' }
      ),
    ],
  },
  {
    id: 'play-mode',
    title: 'Play Mode',
    summary: 'Listen layout, deck controls, queue, skip, and branches.',
    keywords:
      'listen play pause skip queue current track branch override responsive layout player',
    group: 'play',
    steps: [
      s(
        'p-enter',
        'Entering Play Mode',
        'Listen is Play Mode: same engine, no graph editor. Open it from the header. The YouTube player stays mounted so the video does not reload.',
        {
          type: 'nav',
          route: 'listen',
          target: 'app-nav',
          expectedAction: { type: 'route', route: 'listen' },
          praise: 'Listen is open.',
        }
      ),
      s(
        'p-controls',
        'Playback controls',
        'Play/pause, previous/next, ±5/±10 seek, and a scrubber live on the deck. Edit also has Play / Skip in the top bar.',
        { type: 'highlight', route: 'listen', target: 'player' }
      ),
      s(
        'p-current',
        'Current track',
        'Now playing shows title, artist, and album. A white triangle on the list marks the song the engine is on.',
        { type: 'highlight', route: 'listen', target: 'listen-now' }
      ),
      s(
        'p-queue',
        'Queue',
        'The queue is the walk the engine built — tracks, transitions, and style cues. It is not a separate playlist file.',
        { type: 'highlight', route: 'listen', target: 'listen-path' }
      ),
      s(
        'p-skip',
        'Skip',
        'Skip advances to the next queue item. Previous restarts or goes back an item. Both are owned by the Player, not the canvas.',
        { type: 'highlight', route: 'listen', target: 'player' }
      ),
      s(
        'p-pause',
        'Pause / resume',
        'Pause holds the YouTube (or silence) position. Play continues. Style session still restores Settings when the path ends or you Stop.',
        { type: 'highlight', route: 'listen', target: 'player' }
      ),
      s(
        'p-branch',
        'Manual branch override',
        'After a Conditional, Listen still lists the other paths. Click a row or fork to jump — that sets the playback origin and rebuilds the queue.',
        { type: 'highlight', route: 'listen', target: 'listen-path' }
      ),
      s(
        'p-layout',
        'Responsive Play Mode layout',
        'Wide windows put controls beside the path list. Narrow windows stack the deck above the path. The video element stays first in the deck.',
        { type: 'info', route: 'listen', target: 'listen-path' }
      ),
    ],
  },
  {
    id: 'workshop',
    title: 'Workshop',
    summary: 'Browse, publish, like, remix, and follow creators in Workshop.',
    keywords:
      'workshop search tags filters recommendations publish playlists themes visual assets visibility',
    group: 'community',
    steps: [
      s(
        'w-find',
        'Finding playlists',
        'Workshop lists public Music Paths. Open it from Home or the header, then use Home, New, Featured, Search, and Saved. Share a public or unlisted creation with its short ID or link.',
        { type: 'highlight', route: 'workshop', target: 'workshop' }
      ),
      s(
        'w-search',
        'Searching',
        'Search looks through public titles, descriptions, usernames, and tags. Filter by playlist or theme. Sign in to like, save, remix, or publish.',
        { type: 'info', route: 'workshop', target: 'workshop' }
      ),
      s(
        'w-tags',
        'Tags',
        'Creators pick up to eight curated tags in Settings before publishing. Playlists and themes have separate vocabularies. Search the tag list instead of scrolling every option. Staff can remove a misleading tag.',
        { type: 'highlight', route: 'workshop', target: 'workshop' }
      ),
      s(
        'w-filters',
        'Filters',
        'On Search, combine a text query, content type, and tags. Home, New, and Featured can also limit the list to playlists or themes.',
        { type: 'highlight', route: 'workshop', target: 'workshop' }
      ),
      s(
        'w-rec',
        'Recommendations',
        'Recommendations need accounts and a catalog. They are not computed locally.',
        { type: 'info', route: 'workshop', target: 'workshop' }
      ),
      s(
        'w-pub-path',
        'Publishing playlists',
        'Publish from Settings → Workshop. Add tags on the playlist in Settings → Playlists, or in the publish form. Private stays off the catalog, unlisted is link-only, public is listed. The server awards upload badges.',
        { type: 'highlight', route: 'settings', hash: 'settings-import', target: 'export-playlist' }
      ),
      s(
        'w-pub-theme',
        'Publishing themes',
        'Pick tags for the selected theme in Settings → Themes, then publish from Settings → Workshop. Workshop theme posts use the same Synapse theme JSON.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'theme-actions' }
      ),
      s(
        'w-assets',
        'Publishing visual assets',
        'Overlay images and GIFs are skipped on import today. Publishing assets waits on that pipeline.',
        { type: 'info', route: 'workshop', target: 'workshop' }
      ),
      s(
        'w-vis',
        'Visibility settings',
        'Playlist public/private in Settings is a library label. Workshop visibility is set when you publish (private, unlisted, or public).',
        { type: 'highlight', route: 'settings', hash: 'settings-playlists', target: 'settings-playlists' }
      ),
    ],
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    summary: 'Shared editing, roles, cursors, and history are not live yet.',
    keywords:
      'collaborate owner editor viewer commenter realtime cursors comments history rollback permissions',
    group: 'community',
    steps: [
      s(
        'co-create',
        'Creating a collaborative playlist',
        'Collaboration needs a shared canvas that is not in this release. Your own paths already save to your account. Export a package to pass a path to someone else as a file.',
        { type: 'info', route: 'workshop', target: 'workshop' }
      ),
      s(
        'co-owner',
        'Owner permissions',
        'Owner will be the account that published the path. Until then, export a file if you want someone else to open a copy.',
        { type: 'info', route: 'pricing', target: 'pricing' }
      ),
      s(
        'co-editor',
        'Editor permissions',
        'Editors will change the graph. There is no live multiplayer canvas in this version.',
        { type: 'info', route: 'pricing', target: 'pricing' }
      ),
      s(
        'co-viewer',
        'Viewer permissions',
        'Viewers will play without editing. Listen is already a view-first layout of your own path.',
        { type: 'highlight', route: 'listen', target: 'listen-path' }
      ),
      s(
        'co-commenter',
        'Commenter permissions',
        'Commenter will add notes without moving nodes. Local Comment nodes are the closest analog, and they stay on your copy.',
        { type: 'highlight', route: 'edit', target: 'rack-comment' }
      ),
      s(
        'co-cursors',
        'Real-time cursors',
        'Presence cursors are not implemented. They will require a sync channel, not extra canvas logic.',
        { type: 'info', route: 'edit', target: 'canvas' }
      ),
      s(
        'co-comments',
        'Comments',
        'Graph comments are local annotations. Public Workshop creations can have comments unless the creator turns them off.',
        { type: 'highlight', route: 'edit', target: 'node-comment' }
      ),
      s(
        'co-history',
        'History',
        'There is no revision history yet. Keep exported .synapse files if you need a snapshot.',
        { type: 'highlight', route: 'settings', hash: 'settings-import', target: 'settings-import' }
      ),
      s(
        'co-rollback',
        'Rollback',
        'Rollback will restore a previous graph version. Importing an older export is the workaround today.',
        { type: 'highlight', route: 'settings', hash: 'settings-import', target: 'import-playlist' }
      ),
    ],
  },
  {
    id: 'import-export',
    title: 'Import / Export',
    summary: 'Playlist JSON, theme JSON, packages, and what is skipped.',
    keywords:
      'export import json synapse package theme visual assets gif zip pro compatibility',
    group: 'advanced',
    steps: [
      s(
        'ie-export',
        'Exporting playlists',
        'Settings → Import / Export writes a .synapse playlist or package. Both include custom themes that Style nodes (and the current Settings theme) depend on. Presets stay as ids.',
        { type: 'highlight', route: 'settings', hash: 'settings-import', target: 'export-playlist' }
      ),
      s(
        'ie-import',
        'Importing playlists',
        'Import JSON on this page. Import as new playlist adds a copy if the name exists. Replace current playlist clears this workspace and loads the file into it. Node types are allowlisted; paths cannot traverse the filesystem.',
        { type: 'highlight', route: 'settings', hash: 'settings-import', target: 'import-playlist' }
      ),
      s(
        'ie-theme',
        'Theme JSON',
        'Themes use schema synapse-theme v1 from Settings → Themes. Fonts are allowlisted; JSON cannot run code.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'theme-actions' }
      ),
      s(
        'ie-assets',
        'Visual assets',
        'ZIP archives and overlay images are rejected or skipped with a notice. The playlist still loads.',
        { type: 'highlight', route: 'settings', hash: 'settings-import', target: 'settings-import' }
      ),
      s(
        'ie-gif',
        'GIFs',
        'GIF overlays in a package are skipped the same way. You will see a notice instead of a silent drop.',
        { type: 'info', route: 'settings', hash: 'settings-import', target: 'settings-import' }
      ),
      s(
        'ie-package',
        'Complete project packages',
        'A package is still JSON, not a zip of binaries. Schema type synapse-package. Legacy { version, name, nodes, edges } still parses.',
        { type: 'highlight', route: 'settings', hash: 'settings-import', target: 'export-package' }
      ),
      s(
        'ie-pro',
        'Pro feature compatibility',
        'Pro-only overlays and Workshop publish will round-trip later. This file format is designed so free clients can skip unknown parts safely.',
        { type: 'highlight', route: 'pricing', target: 'pricing' }
      ),
    ],
  },
  {
    id: 'account-settings',
    title: 'Account & Settings',
    summary: 'Profile, themes, local settings, and this tutorial.',
    keywords:
      'account appearance themes connection styles tutorial notifications privacy settings profile minimap volume weather',
    group: 'advanced',
    steps: [
      s(
        'as-account',
        'Account settings',
        'Username, display name, picture, location, and bio live on Profile. Log in at /login or create an account at /signup. Edit, Listen, Settings, Profile, Admin, and Superadmin require sign-in. Staff dashboards are separate routes.',
        { type: 'highlight', route: 'profile', target: 'profile' }
      ),
      s(
        'as-appearance',
        'Appearance',
        'Appearance is the Themes section: presets plus custom editor. There is no separate light/dark OS toggle beyond the theme itself.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'settings-themes' }
      ),
      s(
        'as-themes',
        'Themes',
        'Your Settings theme is the one Style nodes restore to. Canvas Path theme is a preview, not a save.',
        { type: 'highlight', route: 'settings', hash: 'settings-themes', target: 'settings-themes' }
      ),
      s(
        'as-edges',
        'Connection styles',
        'Edge color and arrow type follow the theme. Change Arrow type in Themes or Connections / Arrows. Comment links stay dashed.',
        { type: 'highlight', route: 'settings', hash: 'settings-connections', target: 'settings-connections' }
      ),
      s(
        'as-tutorial',
        'Tutorial settings',
        'Reset progress or show the welcome card again from this Settings block. The ? button always reopens the menu.',
        { type: 'highlight', route: 'settings', hash: 'settings-tutorial', target: 'settings-tutorial' }
      ),
      s(
        'as-notify',
        'Notifications',
        'Push and email notifications are not implemented. There is no notification settings surface yet.',
        { type: 'highlight', route: 'settings', hash: 'settings-general', target: 'settings-general' }
      ),
      s(
        'as-privacy',
        'Privacy',
        'Profile visibility saves on your account. Weather uses Open-Meteo. Privacy / Data can download your cloud copy, clear leftover browser caches, or delete the account.',
        { type: 'highlight', route: 'settings', hash: 'settings-privacy', target: 'settings-privacy' }
      ),
      s(
        'as-other',
        'Other application settings',
        'Workshop publish is live from Settings. Pro billing is still not for sale. The rest of Settings saves to your account.',
        { type: 'highlight', route: 'settings', target: 'settings-nav' }
      ),
    ],
  },
  {
    id: 'pro',
    title: 'Pro',
    summary: 'What Pro is planned to add versus what already works locally.',
    keywords:
      'pro premium collaborative workshop overlays animations ad-free billing future',
    group: 'advanced',
    steps: [
      s(
        'pr-feat',
        'Pro features',
        'Pricing describes the planned Pro tier. Local Music Paths, themes, and this tutorial do not require an account.',
        { type: 'highlight', route: 'pricing', target: 'pricing' }
      ),
      s(
        'pr-collab',
        'Collaborative playlists',
        'Live shared paths are a Pro/community feature. Until then, pass .synapse files.',
        { type: 'info', route: 'pricing', target: 'pricing' }
      ),
      s(
        'pr-workshop',
        'Advanced Workshop features',
        'Public Workshop search, likes, comments, remix, follows, and saved lists are live. Creators can disable likes, comments, saves, and followers. Trending is still later.',
        { type: 'highlight', route: 'workshop', target: 'workshop' }
      ),
      s(
        'pr-overlay',
        'Image overlays',
        'Pinned images/GIFs are listed as a future Pro visual. Import already explains skipped overlay assets.',
        { type: 'info', route: 'pricing', target: 'pricing' }
      ),
      s(
        'pr-anim',
        'Animations',
        'Style node easing already interpolates CSS. Extra overlay motion is planned with the same reduced-motion rule.',
        { type: 'highlight', route: 'edit', target: 'rack-style' }
      ),
      s(
        'pr-ads',
        'Ad-free experience',
        'There are no ads in this client. An ad-free Pro line is for a later hosted version.',
        { type: 'info', route: 'pricing', target: 'pricing' }
      ),
      s(
        'pr-future',
        'Future Pro features',
        'Billing, cloud libraries, and hosted profiles are out of this MVP. Build on the canvas; export when you want a copy.',
        { type: 'complete', route: 'edit', target: 'workspace' }
      ),
    ],
  },
];

export const TUTORIAL_GROUPS: TutorialGroup[] = [
  { id: 'getting-started', label: 'Getting Started', sectionIds: [SIMPLE_TUTORIAL_ID, 'getting-started'] },
  {
    id: 'building',
    label: 'Building',
    sectionIds: [
      'building',
      'align-guides',
      'track-nodes',
      'conditionals',
      'randomizer',
      'transitions',
      'comments',
    ],
  },
  { id: 'customization', label: 'Customization', sectionIds: ['styles-themes', 'overlays'] },
  { id: 'play', label: 'Playback', sectionIds: ['play-mode'] },
  { id: 'community', label: 'Community', sectionIds: ['workshop', 'collaboration'] },
  {
    id: 'advanced',
    label: 'Advanced Features',
    sectionIds: ['import-export', 'account-settings', 'pro'],
  },
];

export const FULL_TUTORIAL_SECTIONS = TUTORIAL_GROUPS.flatMap((g) =>
  g.sectionIds.filter((id) => id !== SIMPLE_TUTORIAL_ID)
);

export const CONTEXT_SECTIONS: Partial<Record<AppRoute, string[]>> = {
  edit: [SIMPLE_TUTORIAL_ID, 'building', 'align-guides', 'track-nodes', 'conditionals', 'play-mode', 'styles-themes'],
  listen: ['play-mode', 'getting-started', 'conditionals'],
  settings: ['styles-themes', 'import-export', 'account-settings'],
  profile: ['account-settings'],
  workshop: ['workshop', 'collaboration', 'pro'],
  pricing: ['pro', 'workshop'],
  home: ['getting-started', 'workshop', 'pro'],
};

export function getSection(id: string): TutorialSection | undefined {
  return TUTORIAL_SECTIONS.find((s) => s.id === id);
}

export function sectionIndexInFull(sectionId: string): number {
  return FULL_TUTORIAL_SECTIONS.indexOf(sectionId);
}

export function searchSections(query: string): TutorialSection[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return TUTORIAL_SECTIONS;
  return TUTORIAL_SECTIONS.filter((section) => {
    const hay = `${section.title} ${section.summary} ${section.keywords} ${section.steps
      .map((st) => `${st.title} ${st.body}`)
      .join(' ')}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

export function searchHits(query: string): { section: TutorialSection; label: string }[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const hits: { section: TutorialSection; label: string }[] = [];
  for (const section of TUTORIAL_SECTIONS) {
    const sectionHay = `${section.title} ${section.summary} ${section.keywords}`.toLowerCase();
    if (tokens.every((t) => sectionHay.includes(t))) {
      hits.push({ section, label: section.title });
    }
    for (const step of section.steps) {
      const hay = `${step.title} ${step.body}`.toLowerCase();
      if (tokens.every((t) => hay.includes(t))) {
        hits.push({ section, label: `${section.title} · ${step.title}` });
      }
    }
  }
  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = `${h.section.id}:${h.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function tutorialDifficulty(
  group: TutorialSection['group']
): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (group === 'getting-started') return 'Beginner';
  if (group === 'advanced') return 'Advanced';
  return 'Intermediate';
}

export function tutorialMinutes(stepCount: number): number {
  return Math.max(2, Math.round(stepCount * 0.75));
}
