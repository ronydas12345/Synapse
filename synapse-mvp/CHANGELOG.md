# Changelog

All notable changes to the Synapse app (`synapse-mvp`) are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Autosave and Saved in the header are smaller and quieter, then fade away. A small Saved notice fades in and out on its own, with no button to close.

## [0.4.3] — 2026-10-28

### Added

- Settings shows a red notice when an admin or superadmin replies to one of your support tickets. It clears after you open that ticket.
- Undo and redo for Music Path edits (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` or `Ctrl+Y`).
- Save status in the workspace header, with retry when a cloud save fails.
- Recover unsaved Music Path drafts after a refresh or interrupted save, without overwriting a newer account copy.
- Path check bar on Edit: missing Start, unreachable tracks, empty sequences, and other issues. Saving still works when there are only warnings.
- Play from here on a selected Track and in the inspector.
- Keyboard shortcut list (`Ctrl/Cmd+/`), Space to play or pause, and `Ctrl/Cmd+S` to save now.
- What’s New panel with this version’s notes and known issues. Report a problem from Help or Settings → Support, with optional diagnostics (no Music Path contents).
- Recently played and recently edited lists in the playlist switcher.

### Changed

- Quick start now walks through building a real Music Path: add tracks, change a setting, connect them, check the path, and play. Action steps wait until you actually do the step.
- The current node still lights up while playing; the next queued node is marked Next.
- Playback failures that used to skip immediately now offer Retry, with Skip still available.
- Support tickets include a category, optional steps to reproduce, and optional app/page diagnostics.
- The player deck keeps the original seek bar and puts half-width speed and volume sliders under it.
- Public profile header leaves more space between the display name and the compact badges beside it.
- Workshop comments show the author's photo, display name, and colored badges in their own card.
- Workshop comments appear and disappear as people post or delete them, without refreshing.

### Fixed

- Compact profile badges stay level when some have an earned date and others do not.
- Posting a Workshop comment no longer fails with a database error.

## [0.4.2] — 2026-10-15

### Changed

- Marketing copy is shorter: section titles instead of slogans, redundant Community / Compare Plans links removed, and leftover Philosophy / For creators / final CTA blocks dropped. Footer Documentation still goes to `/docs`.

## [0.4.1] — 2026-10-14

### Fixed

- Production TypeScript build for the `/docs` reference (heading blocks in the markdown parser).

## [0.4.0] — 2026-10-13

Accounts, Workshop, public profiles, and editor polish since 0.3.0.

### Added

- Programming reference at `/docs`: graph model, node types, playback engine, `.synapse` files, and public URLs. Footer Documentation points here instead of the FAQ.
- Supabase Auth with Google OAuth and email/password. Log in at `/login` or create an account at `/signup`. Edit, Listen, Settings, Profile, `/admin`, and `/superadmin` require sign-in. Username and display name are required.
- Staff roles: verified owner email is Superadmin; other admins are stored in Postgres `roles` and can only be written by Superadmin. Separate Admin (`/admin`) and Superadmin (`/superadmin`) dashboards. Each role can open only its own dashboard, even when tools overlap. Row-level security enforces the permission boundary.
- Paths, themes, settings, profile extras, and tutorial progress save per user in Supabase (`user_workspaces`) instead of localStorage.
- Workshop catalog: Home / New / Featured / Search / Saved, creation pages, publish (private / unlisted / public), like, save, comments, share IDs, remix, follows, and public or unlisted creator profiles at `/u/{username}` or `/p/{id}` / `/u/{id}`.
- Curated Workshop tags for playlists and themes (separate vocabularies, searchable picker, max eight, no custom tags). Themes can be published to Workshop and applied from a creation page.
- Short share IDs on public and unlisted users and Workshop playlists. Paste the ID, `/p/{id}`, `/u/{id}`, or `/s/{id}`. Creators can disable likes, comments, saves, and followers.
- Guest Listen for a published path at `/listen/{id}` (graph locked).
- Server-awarded badges (first creation, 10/25/100 uploads, one month, one year, admin, superadmin, 10/100 followers) and cosmetic decorations. Clients cannot insert badge rows.
- Profile header shows the equipped frame, crown/ornament, nameplate, and compact badges. Decorations include silver/gold rings, creator laurel, admin star, and the Superuser crown. Badges pick up color, gems, and sheen as their tier goes up.
- Global command palette (`Ctrl/Cmd+K`) for navigation, playback, playlists, nodes, settings sections, themes, and help.
- Stop in the Edit header and command palette, distinct from Pause (Pause keeps the queue). Loop on the bottom deck repeats the current song without rebuilding the path.
- Minimize control on the bottom deck. The YouTube surface stays mounted so playback continues on Edit, Listen, Settings, and Profile.
- Canvas multi-select (Shift-click or box-select) with copy, paste, and duplicate (`Ctrl/Cmd+C`, `V`, `D`).
- Custom names on Sequence and other nodes, plus Bring selected/all onto page. Inspector tabs on a selected track (Settings, YouTube info, playlist/sequence context). Open settings for a track parked inside a Sequence or Randomizer without dragging it back onto the canvas.
- Playback speed on the bottom deck.
- Own `/u/` pages include profile settings (visibility, badges, decorations) and a link to Profile settings.

### Changed

- Workshop Play, Like, Edit, and Bookmark actions (and the header Play control) are icon buttons with labels in the tooltip and for assistive tech.
- Public Workshop profile banners are shorter: photo top-left, mid-size badges beside a near-full-size display name, compact share ID in the banner. Public playlists in the Playlists section link to their Workshop pages.
- Privacy, Terms, and Cookie policies are rewritten as jurisdiction-neutral documents with shared layout, versioning, and copy that matches the current product. Public Discord and email point at Connect Synapse.
- Sign-out still clears the on-screen account. Cloud playlists stay on the signed-in user and reload on the next login. The playlist switcher loads from the account, not a leftover browser copy.
- The first-run tutorial waits about 50 seconds on the home page so people who already know where to go can click through. Scrolling to the bottom also opens it once. Signed-in accounts do not get the home-page prompt.
- Playlist name and switcher sit with Commands on the right of the workspace header, not beside the Synapse wordmark.
- Empty inspector text fields restore the previous value when you click away. Shift-snap does not arm while a text box is focused.
- Workshop type filter includes Users. Catalog tiles mix by upload time. Import can replace into the current playlist. Workshop will not publish built-in themes or renamed copies that keep the same colors.
- Login and signup are compact centered cards. About uses the Superuser profile photo and Connect buttons for GitHub, Discord, and email.
- Public `/u/` pages show the same optional profile details as Profile settings: location, bio, saved (own page), genres, favorite songs, playlists, and listen stats.
- Track nodes keep Song Title as the only name field. The extra inspector Name (used for Sequence and other nodes) is gone on tracks.

### Fixed

- Reload keeps the Supabase session. Names load from the profile row before the app decides anyone is signed out.
- Playlist library, profile visibility, location/bio/details, and listen stats persist on the account row instead of snapping back after reload.
- Equipping a frame or featured badge no longer fails on ambiguous `uid`. Failed saves snap the picker back. Banners wait for the saved frame so a staff ring does not flash.
- Workshop listing, publish, badges, and public profiles read the live tables (including when the API schema cache is still catching up). Publish no longer fails on a missing `default_likes_enabled` column.
- Setting a profile to Public writes immediately so the account shows under Workshop → Users, and no longer snaps back to Private (`bio` variable collision).
- Saved themes apply from a local cache before the cloud workspace loads, so pages no longer flash Standard Dark first.
- Featured badges and decorations update the profile banner as soon as you pick them. Non-role badges show the date they were earned.
- Home marketing header no longer lets the Synapse wordmark overlap Home or Pricing overlap the theme picker.
- Song loop is a separate deck control and shows when it is on.

## [0.3.0] — 2026-08-30

Now-playing credits. Local feature branch `feature/now-playing-metadata`; not pushed unless requested.

### Added

- Track nodes always show title, artist, and album in both collapsed and expanded states.
- Bottom player bar shows title, artist, and album for the current queue item.
- Shared `getTrackDisplayMeta` helper so node canvas and player stay consistent.
- Larger bottom play bar (video preview + title/artist/album type).
- Auto-fill song title, artist, and album from a YouTube ID (oEmbed + iTunes album lookup, optional `VITE_YOUTUBE_API_KEY`, local cache). Track nodes no longer display the generic “Track” label as a title.
- Deck transport beside now-playing credits: play/pause, previous/next, ±5/±10 second seek, and a progress scrubber.
- Audio visualizer using a real AnalyserNode. YouTube iframes block CORS audio tap, so the visualizer listens to this tab’s audio after a one-click share (the same mix coming out of the video).
- Visualizer capture works in Firefox/Safari via microphone fallback (those browsers cannot capture tab audio). Sharing status in the visualizer is collapsible; Stop ends capture so the browser sharing bar goes away. Canvas minimap can be minimized.
- Conditional and Sequence/Randomizer mode pickers are `<select>` dropdowns (inspector + compact on-node).
- Right-side node inspector: slides in for a single selected node, closes on empty canvas or delete, updates in place when the selection changes.
- Yellow-orange playback marker on the current Player node; drag it onto a playable node to rebuild the queue from that origin (`buildPlaybackQueue` `startNodeId`).
- Off-screen Start direction arrow near the minimap; click pans to the closest Start.
- Separate **Listen** screen at `/listen` (header Edit / Listen / Settings / Profile). The full playlist is one list. Rows indent like code so nested branches sit under their parent. A white triangle on the left marks the song that is currently playing. After a conditional is entered, the fork stays visible with the other paths listed so you can jump to them. Click a song or branch to start playback from that node. The graph editor lives at `/edit`. Wide windows place player controls on the left and the Music Path on the right; narrow windows keep controls stacked above the path.
- Local **user profile** at `/profile`: required `@username` and display name; optional picture, location, bio, genres, songs, playlists, listen stats, and activity graph. Sections can be added, removed, and reordered. Visibility is saved locally. Track starts increment local listen counts.
- Profile **listening stats**: current/longest streak, active days, and a GitHub-style listen heatmap from profile creation through today (year filter when the history spans more than one year). Counts stay on this device.
- Theme engine: 25 searchable presets, custom editor with isolated live preview, Save/Cancel/Reset lock, local custom themes, JSON import/export (`synapse-theme` schema v1). Settings tab hosts Themes; other settings sections are stubs.
- Local **playlist library** with named paths, switcher, and Settings rename. Portable **`.synapse` JSON** import/export (playlist + optional theme package) in Settings → Import / Export. Schema `{ schemaVersion: 1, type: "synapse-playlist" | "synapse-package" }`. Export includes custom themes referenced by Style nodes (and the current Settings theme); presets stay as ids. ZIP archives and overlays are rejected or skipped with a notice; imported JSON cannot run code.
- Conditional **Weather** and **Day / Date** modes. Weather uses a normalized enum and the user’s Profile location (or browser geolocation), cached, with Other / Unknown as fallback. Day / Date rules can be a single value, a list, or a range for weekday, month, year, dates, and repeating annual windows.
- **Style node**: pick a saved theme (preset or custom), optionally limit which layers it changes, and interpolate colors when playback reaches it. Jumping or skipping to a node applies Style cues already on the path to that node. Canvas **Settings theme** / **Path theme** toggles the Settings look versus the path Style look without moving the playback marker. Does not overwrite the Settings theme. Respects `prefers-reduced-motion`.
- **Interactive tutorial**: `?` in the header opens a guided walkthrough. Full tour or jump to a topic, spotlight on real UI, action steps listen to the app store, progress in `localStorage`. Esc exits. Unshipped features (Workshop publish, overlays, collaboration) are documented as previews, not faked.

### Changed

- Track inspector hides EQ and Pitch & Tempo behind a collapsed “Experimental / not yet applied” disclosure; those sliders still save on the node but currently do not affect YouTube playback.
- Dragging a track onto a randomizer/sequence **moves** it into that node’s ordered `data.tracks` list (the canvas node is hidden/parked, not copied). Drag a list item out to restore the Track at the drop point. Connecting a track edge parks it the same way. Sequence mode hides weights; weighted mode keeps them.
- Track nodes no longer have an expand/collapse control. Comment annotations are center-to-center dotted lines with no graph handles, drawn in the React Flow edges pane **behind** nodes.
- Start/end inspectors use the real video duration (once known) with clock-style fields. Unset end still means play to the end.
- Visualizer bars use log-frequency peak mapping (`fftSize` 2048) so high-frequency bins are not skipped. Firefox still cannot tap YouTube iframe audio (CORS); tab share or mic remains the real FFT source — no fake spectrum.
- Node settings moved out of the left sidebar into a dedicated right inspector. MiniMap is bottom-left; Remove All is top-left so they do not compete with the inspector.
- Wordmark uses Lexend Deca Regular in black or white; the new mark sits in the “a” and keeps its purple–blue gradient except on near black/white high-contrast themes.
- Inspector, Style/Transition nodes, and conditional editors use theme tokens instead of hardcoded slate. Debug console logs and the leftover `App.minimal` shell are gone. Marketing no longer labels the local profile as “Log In”.

### Fixed

- Track → Sequence drag-drop **moves** the track (no duplicate canvas copy, persists). List reorder and drag-out restore are two-way.
- Comment → parent dotted lines render behind nodes.
- Invalid saved start/end times are clamped when duration loads.

## [0.2.0] — 2026-08-29

V2.1 Reliability. Local tag only; not pushed unless requested.

### Added

- Vitest harness (`npm test`) for the pure Music Path engine, covering seeded RNG, weighted splitters, time-range branches, randomizers, transitions, and cycles.
- Queue and traverse caps so runaway graphs halt instead of freezing the UI.
- Stable halt reasons (`no_start`, `max_steps`, `max_queue`) from `buildPlaybackQueueResult`.

### Fixed

- Conditional/splitter nodes are visited once, matching cycle protection on other node types.
- YouTube IFrame errors (invalid ID, private/deleted, embed blocked) skip to the next queue item instead of stalling behind the load-suppress window.
- Production `tsc -b` unused-local and index-type errors in the canvas and comment edges.

## [0.1.0] — 2026-08-29

YouTube IFrame playback adapter, path engine extraction, structured track metadata, studio UI.
