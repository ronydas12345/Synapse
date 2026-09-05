# Synapse --- Extensive Settings, Themes, Style, Environment, Import/Export, Workshop, Collaboration & Pro Handoff

## Purpose

Implement the following large feature set as a coordinated
product/architecture expansion. Inspect the existing Synapse codebase
before making changes and preserve the working React Flow canvas,
Zustand state, playback engine, PlaybackAdapter, YouTubeIframeAdapter,
and existing node behavior.

Do not rebuild working systems from scratch. Keep the playback engine
independent of YouTube/browser APIs. Prefer modular, versioned data
structures so these features can evolve without breaking existing
playlists.

------------------------------------------------------------------------

# 1. Extensive Settings Page

Create a dedicated Settings page containing essentially every
user-configurable setting available in Synapse.

## Settings organization

Use clear categories/sections rather than one enormous undifferentiated
form. Suggested sections:

-   General
-   Appearance
-   Themes
-   Canvas / Workspace
-   Nodes
-   Connections / Arrows
-   Playback
-   Player
-   Visualizer
-   Overlays / Effects
-   Environment
-   Import / Export
-   Workshop
-   Collaboration
-   Account
-   Pro
-   Privacy / Data
-   Support

Settings should be searchable so users can quickly find an option.

Persist settings using the existing application persistence approach or
a dedicated versioned settings store if necessary.

Do not hardcode settings directly into individual components when they
should be globally configurable.

------------------------------------------------------------------------

# 2. Configurable Node Connection Styles

Add a setting controlling the appearance of normal node
arrows/connections.

Supported styles:

1.  **Bezier / curved** --- current Synapse behavior.
2.  **90-degree / orthogonal** --- connections use horizontal/vertical
    segments with right-angle turns.
3.  **Straight** --- a direct line between source and target.

The setting should affect the workspace consistently.

Requirements:

-   Existing graphs must continue loading.
-   Changing the setting should update existing visible edges
    immediately.
-   The selected connection style should persist.
-   Comment/annotation relationships remain separately controlled and
    should not accidentally inherit playback-edge behavior.
-   Arrowheads should remain visually clear in every style.

If React Flow already provides suitable edge types, reuse them rather
than implementing unnecessary custom routing.

------------------------------------------------------------------------

# 3. Theme System

Build a full theme system accessible from Settings.

## Preset themes

Provide approximately 25 built-in presets. The exact names can be
refined, but include a broad range such as:

-   Standard Light
-   Standard Dark
-   High Contrast Light
-   High Contrast Dark
-   Ocean Blue
-   Bold Blue
-   Leaf Green
-   Pretty Pink
-   Blood Red
-   Sunset Orange
-   Purple Night
-   Lavender
-   Forest
-   Deep Ocean
-   Midnight
-   Cyberpunk
-   Synthwave
-   Monochrome
-   Warm Cream
-   Solarized-style Light
-   Solarized-style Dark
-   Rose
-   Mint
-   Amber
-   Neon

The preset list should be searchable through a dropdown/combobox.

Do not make the user scroll through 25+ entries manually.

------------------------------------------------------------------------

# 4. Custom Theme Editor

Users must be able to create and edit custom themes.

A theme should be capable of controlling more than just
background/accent colors.

## Theme properties

Support, where technically practical:

### Colors

-   Workspace background
-   Workspace grid
-   Panel background
-   Secondary panel background
-   Primary text
-   Secondary text
-   Accent
-   Accent hover
-   Node background
-   Node border
-   Node header
-   Node selected state
-   Track node colors
-   Conditional node colors
-   Randomizer node colors
-   Transition node colors
-   Comment node colors
-   Start/end node colors
-   Edge colors
-   Arrowhead colors
-   Player background
-   Player controls
-   Progress bar
-   Error/warning/success colors
-   Overlay colors
-   Modal background
-   Input background
-   Input border
-   Button colors

### Typography

Allow themes to specify fonts for appropriate UI categories, such as:

-   Main UI font
-   Heading font
-   Node font
-   Monospace/code font

Use available system/web fonts safely and provide a controlled font
selection rather than allowing arbitrary CSS injection.

### Style/design

Where practical, support configurable:

-   Border radius
-   Border thickness
-   Shadow intensity
-   Panel opacity
-   Node opacity
-   Edge thickness
-   Button shape
-   Input shape
-   Node header style
-   Grid style/intensity
-   Blur intensity
-   Overall density/spacing

Do not permit theme customization to break usability or accessibility.

------------------------------------------------------------------------

# 5. Live Theme Preview

The theme editor must show a live preview of how changes will look in
the actual editor.

Prefer a miniature representative Synapse workspace containing:

-   Start node
-   Track node
-   Conditional node
-   Randomizer/Sequence node
-   Comment node
-   Connections
-   Player/deck
-   Sidebar/panel
-   Buttons and controls

Changes in the theme editor should update the preview smoothly.

The preview should not modify the actual workspace.

------------------------------------------------------------------------

# 6. Theme Editing Lock / Safe Editing Mode

Because themes can affect the entire UI, provide an explicit editing
mode in the Theme Editor.

When using the workspace normally:

-   Theme controls should not accidentally capture workspace
    interactions.
-   Theme overlay/effect settings should not be accidentally edited
    while manipulating nodes.

When the user enters Theme Editing mode:

-   Clearly indicate that they are editing a theme.
-   Allow changes to colors, fonts, styles, and overlays.
-   Provide Save, Cancel/Revert, Duplicate, and Reset options.

Changes should not be permanently applied until the user saves them,
unless the UI explicitly treats them as live preview changes.

------------------------------------------------------------------------

# 7. Theme JSON Files and Sharing

Themes must be portable.

Create a versioned JSON theme format.

Example conceptual structure:

``` json
{
  "schemaVersion": 1,
  "type": "synapse-theme",
  "id": "...",
  "name": "Ocean Blue",
  "version": "1.0.0",
  "colors": {},
  "typography": {},
  "style": {},
  "overlays": []
}
```

The actual schema should match the implementation.

Support:

-   Export theme to JSON.
-   Import theme from JSON.
-   Save custom themes locally.
-   Easily switch saved themes from the Settings dropdown.
-   Share themes through a file.
-   Support shareable theme IDs when Workshop/backend infrastructure
    exists.
-   Support publishing themes to Workshop.

Validate imported JSON before applying it.

Never execute arbitrary code from a theme file.

------------------------------------------------------------------------

# 8. Style Node

Create a new **Style node**.

Its purpose is to change the visual style of the workspace/player when
playback reaches the node.

A Style node should be able to trigger a saved theme/style
configuration.

Example:

``` text
Start → Track → Style: Cherry Blossom → Track → Style: Midnight
```

## Style Node behavior

-   Select a saved theme/style.
-   Optionally select which visual properties it affects.
-   Trigger when playback reaches the node.
-   Work with the existing playback path architecture.
-   Do not make the engine depend on DOM APIs.

The engine should represent the style transition as data/state rather
than directly manipulating browser UI.

------------------------------------------------------------------------

# 9. Smooth Style Transitions

Changing themes/styles must not instantly snap from one appearance to
another.

Provide configurable transition behavior where appropriate:

-   Transition duration.
-   Easing.
-   Optional reduced-motion mode.

Colors, opacity, overlays, and other animatable properties should
interpolate smoothly.

Do not animate properties that cannot be safely interpolated.

Respect accessibility settings such as reduced motion.

------------------------------------------------------------------------

# 10. Weather Splitter

Add **Weather Splitter** as an option within the existing Conditional
node.

It should branch according to current weather at the user's location.

Example:

``` text
Conditional
  ├── Sunny
  ├── Rainy
  ├── Partly Cloudy
  └── Other
```

Each branch must have customizable weather conditions.

Possible weather states should be normalized into a stable internal enum
rather than relying on provider-specific strings.

At minimum support categories such as:

-   Clear/Sunny
-   Partly Cloudy
-   Cloudy/Overcast
-   Rain
-   Drizzle
-   Thunderstorm
-   Snow
-   Sleet/Freezing precipitation
-   Fog/Mist
-   Windy/other severe conditions where supported
-   Other/Unknown

Users should be able to assign one or multiple weather states to a
branch.

------------------------------------------------------------------------

# 11. Weather Data Architecture

Do not hardcode a specific weather provider into the playback engine.

Create a provider/service abstraction that returns normalized weather
data.

Requirements:

-   Graceful failure when location/weather data is unavailable.
-   Cache weather data for a reasonable period to avoid unnecessary
    requests.
-   Do not repeatedly request weather data every playback tick.
-   Respect user privacy and location permissions.
-   Clearly indicate when weather data is unavailable.
-   Provide a fallback branch for unknown/unavailable weather.

The Conditional node should consume normalized weather state rather than
provider-specific API responses.

------------------------------------------------------------------------

# 12. Day / Date Splitter

Add a **Day Splitter** option to the Conditional node.

It should be highly customizable.

Allow conditions based on:

-   Day of week
-   Day of month
-   Month
-   Quarter
-   Year
-   Date ranges
-   Specific dates
-   Recurring date patterns
-   Week of year where practical
-   Time of day if useful

Examples:

``` text
Monday → Workout
Friday → Weekend
Saturday–Sunday → Relax
```

or:

``` text
December 1–31 → Christmas theme
June–August → Summer playlist
2027 → New Year playlist
```

The filtering system should support one choice or ranges.

Use a structured condition model rather than storing arbitrary
expressions.

------------------------------------------------------------------------

# 13. Image and GIF Overlays

Themes and Style nodes should support visual overlays.

Examples:

-   Cherry blossom images on both sides of the screen.
-   Falling leaves animation.
-   Rain animation covering the player.
-   Snow particles.
-   Decorative borders.
-   Ambient animated backgrounds.

Support static images and animated GIFs where technically appropriate.

The overlay system should specify:

-   Asset source/reference.
-   Position.
-   Size.
-   Opacity.
-   Layer/order.
-   Blend mode where safe.
-   Animation behavior.
-   Whether it applies to workspace, player, or both.

Avoid allowing untrusted imported files to execute scripts.

------------------------------------------------------------------------

# 14. Overlay Editing Safety

Overlay configuration should be editable from the Theme Editor rather
than accidentally manipulated while users are working in the normal
workspace.

Provide an explicit overlay editor with:

-   Add asset
-   Remove asset
-   Reorder layers
-   Position
-   Scale
-   Opacity
-   Preview
-   Enable/disable
-   Save/revert

Normal workspace interaction should not accidentally modify theme
overlays.

------------------------------------------------------------------------

# 15. Playing Screen --- Manual Branch Selection

When the playing screen displays the branches of a Conditional node,
allow the user to manually select a branch even if its condition is not
currently satisfied.

Example:

``` text
Weather Splitter
Sunny      ← current valid branch
Rainy
Snowy
Jazz       ← user preference may override current condition
```

If the weather is sunny but the user clicks the Rainy branch, playback
should switch to that branch.

## Requirements

-   Manual selection is an explicit user override.
-   It should not permanently change the underlying condition.
-   The normal condition should continue to be used automatically when
    no manual override occurs.
-   Clearly indicate that the user manually selected/overrode the
    branch.
-   Define whether the override applies once, until the next conditional
    node, or for a configurable duration. Prefer a clear default and
    make it configurable.
-   Do not corrupt the deterministic playback queue.

------------------------------------------------------------------------

# 16. Import YouTube Playlist Into Sequence/Randomizer

Allow users to import a YouTube playlist directly into a
Sequence/Randomizer node.

Requirements:

-   Accept a YouTube playlist URL or supported playlist identifier.
-   Retrieve playlist entries through an appropriate provider/API
    integration.
-   Create Track data for imported videos.
-   Add tracks to the selected Sequence/Randomizer in playlist order.
-   Sequence mode preserves YouTube playlist order.
-   Weighted/random mode imports the tracks but uses the node's existing
    randomization rules.
-   Handle unavailable/private/deleted videos gracefully.
-   Avoid inventing metadata if it cannot be retrieved.
-   Cache external metadata where appropriate.
-   Do not expose API credentials in the client or saved playlist files.

If a provider API key is required, implement configuration/integration
cleanly rather than hardcoding credentials.

------------------------------------------------------------------------

# 17. Single-Node Playback Fallback

If the workspace contains only one playable node and there is no Start
node/path connected to it, playback should still go to that node.

Required behavior:

``` text
Workspace:
[Track A]

Play → Track A
```

This should be a fallback only.

If there are multiple nodes but no valid Start path, do not arbitrarily
choose one unless a deterministic fallback rule is explicitly defined.

The existing Start-based behavior must remain unchanged when a valid
Start path exists.

------------------------------------------------------------------------

# 18. Playlist + Theme Import/Export Package

Create a portable playlist package format.

The exported package should contain:

-   Playlist structure file using a custom Synapse playlist extension.
-   One JSON file per included theme.
-   Required image overlay assets.
-   Required GIF assets.
-   Any other necessary local assets.
-   Manifest/metadata describing included files and versions.

Conceptual structure:

``` text
MyPlaylist.synapse/
  playlist.synapse
  manifest.json
  themes/
    ocean.json
    cherry-blossom.json
  overlays/
    blossom.png
    rain.gif
```

The actual archive/container format may be ZIP-based internally, but the
user-facing playlist structure should have a custom Synapse file
extension.

## Import behavior

Validate:

-   Schema version.
-   Required files.
-   Theme references.
-   Asset references.
-   Node references.

Do not trust imported paths blindly.

Prevent path traversal and unsafe file extraction.

------------------------------------------------------------------------

# 19. Pro Feature Stripping During Import

Pro-only features must **not automatically transfer** when importing a
playlist into an account that cannot use those features.

When a free user imports a playlist containing paid features, provide
clear choices:

1.  **Import without Pro features** --- remove/disable unsupported Pro
    features.
2.  **Get Pro** --- direct the user to the Pro upgrade flow.
3.  **Pay a one-time fee** --- if this monetization option is
    implemented.

The importer should explain which features would be removed before
destructive conversion.

Do not silently destroy the user's imported playlist.

Preserve the original imported package/file.

------------------------------------------------------------------------

# 20. Cloud Public Workshop

Create a cloud-based Workshop for public Synapse content.

Users should be able to search and discover:

-   Public playlists.
-   Public themes.
-   Public users/profiles.

Provide recommendations based on appropriate signals such as tags,
popularity, recency, and user behavior, while avoiding opaque
assumptions where possible.

## Visibility rules

-   Public content: searchable.
-   Unlisted content: not searchable through normal discovery.
-   Private content: not searchable.
-   Unlisted content may be accessed through a direct ID/link if the
    owner permits it.

Never expose private content through search results or recommendations.

------------------------------------------------------------------------

# 21. Workshop Tags

Provide large preset tag libraries.

Playlist tags could include hundreds of options across categories such
as:

-   Anime
-   Metal
-   OST
-   EDM
-   Rock
-   Pop
-   Classical
-   Jazz
-   Lo-fi
-   Game
-   Movie
-   Ambient
-   Instrumental
-   Electronic
-   Hip-hop
-   Chill
-   Workout
-   Study
-   Focus
-   Party

Theme tags should use a separate tag vocabulary, such as:

-   Cute
-   Ocean
-   Forest
-   Dark
-   Light
-   Pink
-   Blue
-   Green
-   Anime
-   Cyberpunk
-   Minimal
-   Retro
-   Neon
-   Nature
-   Space
-   Cozy
-   Seasonal

The final lists should contain hundreds of curated options,
organized/searchable rather than presented as an enormous static list.

Do not let users create arbitrary tags that fragment search unless a
future moderation strategy supports it.

------------------------------------------------------------------------

# 22. Workshop Search and Filtering

Support search by:

-   Title
-   Username
-   Content ID
-   Tags
-   Creator
-   Description where appropriate

Support filters such as:

-   Date created
-   Date updated
-   Release date where relevant
-   Number of nodes
-   Content type
-   Visibility
-   Tags
-   Popularity
-   Rating/engagement if implemented

Search should support combinations of filters.

------------------------------------------------------------------------

# 23. Google Slides-Adjacent Cloud Collaboration

Build collaborative playlist editing similar conceptually to
collaborative document editors.

Supported permissions:

-   Owner
-   Editor
-   Viewer
-   Commenter

## Permissions

### Owner

-   Full control.
-   Manage permissions.
-   Delete/rename playlist.
-   Publish/unpublish.
-   Manage collaborators.

### Editor

-   Edit graph.
-   Add/remove/reorder nodes.
-   Change settings permitted by the playlist.

### Viewer

-   View and play.
-   No edits.

### Commenter

-   Can create/use Comment nodes only.
-   Cannot modify playback nodes or settings.

Only Pro users can own/host collaborative playlists.

------------------------------------------------------------------------

# 24. Real-Time Collaboration

Collaborators should see:

-   Other users' cursors.
-   User identity indicators.
-   Live node movement.
-   Live edits.
-   Selection state where practical.
-   Comments.

The collaboration system must handle simultaneous edits without
corrupting playlist state.

Use an appropriate synchronization model such as an operation-based
system/CRDT or another conflict-resolution strategy rather than naïve
last-write-wins for the entire document.

The graph/document model should have stable IDs for nodes and edges.

------------------------------------------------------------------------

# 25. Edit History and Rollback

Collaborative playlists require an edit history.

Store sufficient information to provide:

-   Who changed something.
-   What changed.
-   When it changed.
-   Version/history entries.
-   Rollback to a previous version.

Rollback should create a new version rather than destroying the
historical record.

Provide a history UI appropriate for a collaborative editor.

------------------------------------------------------------------------

# 26. Pro Mode

Create a paid Pro subscription tier.

Initial Pro benefits:

-   Own/host collaborative playlists.
-   Real-time collaborative editing.
-   Share playlists with image overlays and animations to Workshop.
-   Remove banner ads.
-   Remove mid-roll ads.
-   Additional future features to be determined.

Keep the entitlement system modular so additional Pro features can be
added without rewriting the application.

Do not hardcode a user's Pro status solely in local client state. The
authoritative entitlement should eventually come from the
backend/account system.

------------------------------------------------------------------------

# 27. Advertising Architecture

For non-Pro users, support the planned advertising model while ensuring
it does not corrupt playback.

Potential ad placements:

-   Banner ads.
-   Mid-roll ads.

Pro should disable these placements.

Keep advertising isolated from the core playback engine so ad logic can
be changed independently.

Do not let advertisements interfere with graph traversal or saved
playlist structure.

------------------------------------------------------------------------

# 28. Support Ticket System

Create an in-app support ticket system.

Users should be able to:

-   Create a ticket.
-   Select a category.
-   Enter a subject.
-   Describe the issue.
-   Attach appropriate diagnostic information if permitted.
-   Track ticket status.

Possible statuses:

-   Open
-   In Progress
-   Waiting for User
-   Resolved
-   Closed

Every newly raised ticket should trigger an email notification to the
developer's configured support email.

Do not hardcode a personal developer email address into the frontend.
Use secure backend configuration/environment variables.

The ticket system should also prevent spam/abuse through appropriate
rate limiting and validation.

------------------------------------------------------------------------

# 29. Backend Architecture

The features in this handoff require a backend/cloud layer that the
current 0.1.0 MVP does not have.

Do not attempt to fake these capabilities with localStorage alone.

The architecture should eventually include services for:

``` text
Authentication
     ↓
User/Profile Service
     ↓
Playlist Storage
     ↓
Theme Storage
     ↓
Workshop/Search
     ↓
Collaboration/Realtime Sync
     ↓
Version History
     ↓
Entitlements/Billing
     ↓
Support Tickets
     ↓
Email Notifications
```

Keep these concerns modular.

------------------------------------------------------------------------

# 30. Security Requirements

Because Workshop, collaboration, import/export, accounts, and support
are cloud features, treat security as a first-class requirement.

At minimum:

-   Authenticate API requests.
-   Authorize every playlist operation server-side.
-   Enforce public/unlisted/private visibility server-side.
-   Enforce Owner/Editor/Viewer/Commenter permissions server-side.
-   Enforce Pro entitlements server-side.
-   Validate imported playlist/theme schemas.
-   Sanitize user-generated text.
-   Validate image/GIF uploads.
-   Prevent path traversal in imported packages.
-   Do not execute arbitrary theme code.
-   Protect API keys/secrets.
-   Rate-limit Workshop search and ticket creation.
-   Audit collaborative changes.

------------------------------------------------------------------------

# 31. Data Versioning

All newly introduced persistent structures should have schema versions.

This includes:

-   Settings
-   Themes
-   Playlist packages
-   Playlist structure
-   Style nodes
-   Weather conditions
-   Date conditions
-   Workshop metadata
-   Collaboration documents

Old 0.1.0 playlists must continue loading where possible.

Use migration functions rather than scattering compatibility checks
throughout UI components.

------------------------------------------------------------------------

# 32. Suggested Implementation Order

This is a large roadmap. Do not attempt to implement everything in one
unstructured change.

Recommended phases:

### Phase 1 --- Settings foundation

-   Settings page.
-   Searchable settings.
-   Persistent settings store.
-   Node edge style setting.
-   Connection style renderer.

### Phase 2 --- Theme engine

-   Theme schema.
-   Presets.
-   Searchable theme dropdown.
-   Custom theme editor.
-   Live preview.
-   Local saved themes.
-   JSON import/export.

### Phase 3 --- Visual styles

-   Style node.
-   Smooth transitions.
-   Image/GIF overlays.
-   Overlay editor.
-   Theme editing lock.

### Phase 4 --- Conditional environment nodes

-   Weather splitter.
-   Weather provider abstraction/cache.
-   Day/date splitter.

### Phase 5 --- Playback UX

-   Manual branch override from playing screen.
-   Single-node playback fallback.

### Phase 6 --- YouTube import/export

-   YouTube playlist import.
-   Sequence/randomizer integration.
-   Playlist/theme/asset package export.
-   Package import.
-   Pro-feature stripping.

### Phase 7 --- Workshop backend

-   Accounts.
-   Profiles.
-   Public/unlisted/private content.
-   Search.
-   Tags.
-   Recommendations.

### Phase 8 --- Collaboration

-   Permissions.
-   Realtime sync.
-   Presence/cursors.
-   Comments.
-   History.
-   Rollback.

### Phase 9 --- Monetization

-   Pro entitlements.
-   Subscription flow.
-   One-time import upgrade path if retained.
-   Ads.

### Phase 10 --- Support

-   Ticket UI.
-   Backend ticket storage.
-   Email notifications.
-   Status tracking.

------------------------------------------------------------------------

# 33. Important Existing Synapse Constraints

Preserve the current architecture unless a feature genuinely requires an
extension.

The existing playback architecture should remain conceptually:

``` text
MusicPathEngine
      ↓
Playback Queue
      ↓
Player.tsx
      ↓
PlaybackAdapter
      ↓
YouTubeIframeAdapter
```

The engine must remain independent of DOM and YouTube APIs.

Themes, Style nodes, Weather Splitters, and Day Splitters should provide
structured data to the playback/state system instead of directly
manipulating UI from the engine.

------------------------------------------------------------------------

# 34. Regression Requirements

After implementation, verify all existing functionality still works:

-   Start node.
-   Track nodes.
-   Conditional nodes.
-   Sequence/randomizer nodes.
-   Transition nodes.
-   Comment nodes.
-   End nodes.
-   Playback queue generation.
-   Pause/resume.
-   Skip.
-   YouTube playback.
-   Track start/end/volume/speed.
-   Existing graph persistence.
-   Dragging nodes.
-   Existing connection rules.

Also verify:

-   Theme switching does not break node editing.
-   Style transitions do not interrupt playback.
-   Weather failures do not stop playback.
-   Date splitters work without network access.
-   Imported packages cannot crash the application.
-   Pro feature stripping does not damage free-user playlists.
-   Private Workshop content never appears in public search.
-   Commenters cannot edit playback nodes.
-   Viewers cannot edit content.
-   Non-Pro users cannot become collaborative playlist hosts through
    client-side manipulation.

------------------------------------------------------------------------

# 35. Completion Documentation

For each implementation phase, update the project handoff/status
documentation with:

-   Features implemented.
-   Files changed.
-   New components/modules.
-   Data schemas.
-   State changes.
-   Migration behavior.
-   Backend/API dependencies.
-   Browser limitations.
-   Security considerations.
-   Tests performed.
-   Known limitations.
-   Features intentionally deferred.

Do not claim cloud, billing, collaboration, or Workshop functionality is
complete until the backend and authorization behavior are actually
implemented and tested.

------------------------------------------------------------------------

# Final Implementation Principle

Treat this as a product-platform expansion rather than a collection of
isolated UI changes.

The most important architectural goals are:

1.  **One source of truth for playlist state.**
2.  **Versioned, portable data.**
3.  **Themes as first-class data.**
4.  **Visual styles decoupled from playback logic.**
5.  **External services behind provider abstractions.**
6.  **Cloud permissions enforced server-side.**
7.  **Pro entitlements enforced server-side.**
8.  **Graceful degradation when optional services are unavailable.**
9.  **No hardcoded credentials or developer secrets.**
10. **Do not rebuild existing working Synapse systems unnecessarily.**

---

# Completion notes — Phase 2 Themes (2026-09-04)

Implemented first: theme engine + Settings host (not the full handoff).

## Implemented

- 25 builtin presets; searchable combobox (no 25-item unfiltered scroll).
- Versioned JSON `{ schemaVersion: 1, type: "synapse-theme" }`.
- Custom editor with isolated live preview (does not mutate the studio graph).
- Theme editing lock: Save / Cancel / Reset; Duplicate; import/export file JSON.
- Custom themes + active id in `localStorage` key `synapse_theme_state`.
- CSS variables applied on `document.documentElement`.
- Settings page with search; non-theme sections are stubs.

## Files

`synapse-mvp/src/theme/*`, `SettingsPage.tsx`, `ThemeSettings.tsx`, `ThemePreview.tsx`, `App.tsx`, node class hooks, `index.css`.

## Security

Import path uses `parseTheme` only. Unknown fonts fall back. No `eval` / CSS injection of arbitrary strings.

## Deferred

Style node, overlays/GIFs, seasonal auto-theme, Workshop IDs/publish, connection-style setting, remaining Settings categories.
