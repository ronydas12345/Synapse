# Changelog

All notable changes to the Synapse app (`synapse-mvp`) are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Supabase Auth with Google OAuth and email/password. Log in at `/login` or create an account at `/signup`. Edit, Listen, Settings, Profile, `/admin`, and `/superadmin` require sign-in. Username and display name are required.
- Staff roles: verified owner email is Superadmin; other admins are stored in Postgres `roles` and can only be written by Superadmin. Separate Admin (`/admin`) and Superadmin (`/superadmin`) dashboards. Each role can open only its own dashboard, even when tools overlap. Row-level security enforces the permission boundary.
- Minimize control on the bottom deck. The YouTube surface stays mounted so playback continues on Edit, Listen, Settings, and Profile.
- Canvas multi-select (Shift-click or box-select) with copy, paste, and duplicate (Ctrl/Cmd+C, V, D).
- Paths, themes, settings, profile extras, and tutorial progress save per user in Supabase (`user_workspaces`) instead of localStorage.
- Workshop catalog: Home / New / Featured / Search / Saved, creation pages, publish (private / unlisted / public), like, save, comments, share IDs, remix, follows, and public or unlisted creator profiles at `/u/{username}` or `/p/{id}` / `/u/{id}`.
- Curated Workshop tags for playlists and themes (separate vocabularies, searchable picker, max eight, no custom tags). Choose tags in Settings → Playlists, Settings → Themes, or the publish form before you post. Search and staff moderation can use them. Themes can be published to Workshop and applied from a creation page.
- Short share IDs on public and unlisted users and Workshop playlists. Paste the ID, `/p/{id}`, `/u/{id}`, or `/s/{id}`. Creators can disable likes, comments, saves, and followers.
- Server-awarded badges (first creation, 10/25/100 uploads, one month, one year, admin, superadmin, 10/100 followers) and cosmetic decorations. Clients cannot insert badge rows.
- Global command palette (`Ctrl/Cmd+K`) for navigation, playback, playlists, nodes, settings sections, themes, and help.
- Stop in the Edit header and command palette, distinct from Pause (Pause keeps the queue).
- Workshop in the workspace top nav. Help stays available after sign-in.
- Custom names on Sequence and other nodes, plus Bring selected/all onto page to pack named groups (travel, childhood, techno, …) onto one canvas view.
- Inspector tabs on a selected track: Settings (global defaults and local), YouTube song info, and playlist/sequence context, with jump chips under Node Settings.
- Open settings for a track that is parked inside a Sequence or Randomizer from the node list or inspector, without dragging it back onto the canvas.
- Playback speed on the bottom deck.
- Own `/u/` pages include profile settings (visibility, badges, decorations) and a link to Profile settings. The workspace profile page links back to the public profile.
- Profile header shows the equipped frame, crown/ornament, nameplate, and compact badges on a decoration banner instead of only listing them further down the page.
- Profile decorations now show the handoff ornaments: silver/gold rings, creator laurel, admin star, and the Superuser crown. Staff frames also tint the display name.
- Badges pick up color, gems, and sheen as their tier goes up (bronze through Superadmin).

### Changed

- Sign-out still clears the on-screen account. Cloud playlists stay on the signed-in user and reload on the next login.
- The first-run tutorial waits about 50 seconds on the home page so people who already know where to go can click through. Scrolling to the bottom also opens it once. The tour starts with create-account or log in, then continues on Edit. Help (?) still opens it immediately for signed-out visitors. Signed-in accounts do not get the home-page prompt.
- Playlist name and switcher sit with Commands on the right of the workspace header, not beside the Synapse wordmark.
- Empty inspector text fields restore the previous value when you click away. Shift-snap does not arm while a text box is focused.
- The public profile link sits under the name in the profile identity block as an underlined theme accent. Profile frames use a small corner wash instead of full-panel gradients.
- Workshop type filter includes Users so public profiles are a catalog category beside Playlists and Themes.
- Workshop will not publish built-in themes or renamed copies that keep the same colors. Local publish preview lives at `/u/workshop_preview`. Local profile-visibility preview lives at `/u/vis_preview`.
- Login is a compact card: Email, Password, Sign in, Google, then Sign up. Placeholders stay left-aligned; the rest of the card is centered.
- Signup matches that compact card (email, password, username, display name, Create account, Google, then Log in). Login and signup pages are fully center-aligned.
- About uses the Superuser profile photo (no decorations), updated copy, and Connect buttons for GitHub, Discord, and email. The photo and a View profile button open `/u/dasrony231`.
- Public `/u/` pages show the same optional profile details as Profile settings: location, bio, saved (own page), genres, favorite songs, playlists, and listen stats.

### Fixed

- Reload keeps the Supabase session. Names load from the profile row before the app decides anyone is signed out.
- Workshop listing and badge pages no longer fail when the API schema cache is still catching up. Publish, badges, and public profiles read the live Workshop tables.
- Home marketing header no longer lets the Synapse wordmark overlap Home or Pricing overlap the theme picker. The bar uses the full window width, and the inline nav collapses sooner on Home where the theme control is extra.
- Equipping a profile frame (or featured badge) no longer fails with `column reference "uid" is ambiguous`.
- Profile banners stay on the default panel until the saved frame loads, so a staff ring does not flash and then snap back.
- If a frame or featured badge fails to save, the picker snaps back instead of looking equipped.
- Public / unlisted / private profile visibility writes through `set_profile_public` instead of a table UPDATE that collided on `uid`. Staff helper functions are no longer inlined into RLS, which was still raising `column reference "uid" is ambiguous`.
- Profile edit lets you feature a badge by clicking it, even if progress evaluation fails to refresh awards.
- Workshop publish no longer fails with `column "default_likes_enabled" does not exist`.
- Saved themes apply from a local cache before the cloud workspace loads, so pages no longer flash Standard Dark first.
- Setting a profile to public writes `profiles` and `creator_public` immediately, so the account shows under Workshop → Users. All types also lists public profiles.
- Choosing Public no longer snaps back to Private. `set_profile_public` had a PL/pgSQL variable named `bio` that collided with the column, same class of bug as ambiguous `uid`.
- Profile visibility no longer resets on reload. Workspace save was writing the stale private JSON back over the profile row.
- Workshop Users lists accounts from the profile row’s visibility, so a public profile still appears if the catalog copy lagged.
- Location, bio, genres, songs, section order, and listen stats now persist on the profile row (same path as visibility) so `/u/` still has them after reload.

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
