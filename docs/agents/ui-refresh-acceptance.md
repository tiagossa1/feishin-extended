# Biblioteca viva: acceptance record

Baseline: `main` at `fb043b7173b69b432127d1aef89d526c4423400b`.
Implementation branch: `ui/biblioteca-viva`, isolated OpenCode worktree.

## Baseline inventory

| Surface | Controls to preserve | Source |
| --- | --- | --- |
| Home | Configurable sections, feature modes, refresh, paginated cards, navigation | `features/home/routes/home-route.tsx`, `components/playlist-infinite-carousel.tsx` |
| Playlists | Custom/server artwork, upload/delete/drop, description, collapsed header, smart playlist, search, play/shuffle, edit/save/cancel, filters, grid/detail/table | `features/playlists/components/playlist-detail-song-list-header.tsx`, header-filters, content and table |
| Tracks | Search, filters, sort, list configuration, pagination/infinite scroll, grouping, selection, context menus, drag, rating/favorite | `features/songs/components/song-list-*`, `components/item-list/` |
| Playerbar | Transport, seek, volume/mute/devices, DLNA, timer, player configuration, lyrics, favorite/rating, queue, Auto DJ | `features/player/components/{left,center,right}-controls.tsx` |
| Expanded player | Artwork/background preferences, queue, related, lyrics, supported visualizers, expand/collapse, radio | `features/player/components/full-screen-player*.tsx` |
| Other routes | Albums, artists, genres, folders, favorites, radio, settings, global search, command palette, download/share/tag editor, import/export | Existing router and context menus, unchanged |

## Scenarios

Never mutate a personal playlist or the Explo playlist. Use disposable test data.

| ID | Precondition and action | Expected | Status |
| --- | --- | --- | --- |
| UI-01 | New profile: home, search Teardrop and Enter, open playlist, view all | Visible song search, responsive playlist grid, correct routes, no fixed playlist | PASS with external API fixture, real renderer |
| UI-02 | Old profile/custom theme: toggle blur, reload, export/import; reduced transparency and unsupported backdrop filter | Preferences retained, opaque fallback, readable chrome | Toggle, reload, old-profile default, four built-in themes and reduced media preferences PASS. Actual desktop JSON theme, live reload, export, legacy/current import and persistence PASS in isolated Electron profile. Unsupported-browser fallback NOT TESTED |
| UI-03 | Empty/error playlists, custom/composed/missing image, long names, folders, server switch; personalized section order | Existing image/query behavior retained, no fixed playlist or preference reset | Empty/populated lists, missing artwork and disabled sections PASS; real custom/composed artwork, errors and server-switch NOT TESTED |
| UI-04 | Sort each supported column twice, reset #, resize/reorder, filter/reload; edit repeated occurrences and cancel | ASC/DESC, whole query sorted, identity retained, no reorder mutation | Playlist title ASC/DESC, filtered order, repeated rows, # reset, Enter/Space focus, resize and column drag without sorting PASS. Library sort controls checked in paginated/infinite views; unsupported Subsonic album/duration sort absent. Global search headers remain non-sortable. Edit/large real backend acceptance NOT TESTED |
| UI-05 | Open/close expanded player and modules, seek/volume, devices/timer/config, lyrics/related/visualizer, radio | Playback uninterrupted, all controls retained, blur respects preferences | Real renderer queue/lyrics module controls and 8px backdrop PASS; actual playback, radio/casting/visualizer lifecycle NOT TESTED |
| UI-06 | Desktop/web, available backends and engines, other routes, 1440x900/1024x768/390x844, themes/zoom, large list | Functional parity, no clipping or obvious scroll regression | Three viewport widths and readable mobile title cells PASS. Controlled 10000-track playlist and isolated desktop theme/settings acceptance PASS. Real backends/devices/hardware performance NOT TESTED |

## Verification

- Baseline `pnpm lint-code`: PASS, exit 0.
- Baseline `pnpm lint-styles`: PASS, exit 0.
- No baseline automated test command is defined.
- Real authenticated backends, casting devices and MPV/DLNA/jukebox are not yet validated. Source inventory is not runtime evidence.
- Local commit authorized by the user after validation. No local typecheck, merge or push authorized.

## Implementation verification

- `node --test scripts/ui-refresh/table-sort.test.mjs`: PASS, 2/2.
- Browser check: PASS for the scenarios listed above. Fixtures replace only the external Subsonic API, not UI, routing, persistence, normalization or table components.
- `pnpm lint-code` and `pnpm lint-styles`: PASS after targeted formatting.
- Web, Electron and remote builds passed; final post-review checks are recorded in the execution ledger.
- Independent read-only review found two CSS cascade issues for reduced transparency/motion. Both were reproduced in the browser (`96px` artwork blur and `0.5s` image transition despite reduced preferences), fixed in one pass, and verified (`none`, `0s`).
- Build warnings about chunks larger than 500 kB remain; no new code-splitting or dependencies added for this UI refresh.
- Baseline development web mode fails on the `bind-event-listener` named export. Production web build/preview works; dependency changes intentionally excluded.
- Runtime screenshots live in `.superpowers/sdd/2026-11-22-biblioteca-viva-ui-refresh/` (local, ignored), named `home-1440.png`, `home-1024.png`, `home-390.png`, `playlist-*.png`, `expanded-desktop.png` and `home-<theme>.png`.

### Running the browser checks

Build and serve the real web app with `pnpm build:web` and `pnpm exec vite preview --config web.vite.config.ts --host 127.0.0.1 --port 52343`.

Run `node scripts/ui-refresh/browser-check.mjs` with `UI_PLAYWRIGHT_PATH` pointing to an existing `playwright-core` installation and `UI_CHROMIUM_PATH` pointing to its Chromium executable. Optional: `UI_BASE_URL` and `UI_SCREENSHOT_DIR`. No test dependency was added.

### Intentional UI choices

- Existing stored navigation, section order, table widths and themes are retained; new profiles get a 205px sidebar and playlist-first defaults.
- Mobile lists retain configured widths and horizontal scroll instead of squeezing titles to fit all columns.
- Opting out of blur takes priority over theme chrome filters, including Glassy.
- Sorting uses existing query/filter state. Playlist filtering is followed by sorting; global search relevance is unchanged.
- Library headers follow existing backend capabilities: Subsonic offers title/name only, while playlist sorting remains client-side. The Subsonic fixture proves UI control/query-state behavior, not server-wide ordering or descending search support.

## User acceptance and pending work

- Visual design approved by the user.
- User confirmed that a manually tested playlist worked. Backend, playback controls and editing scenarios were not specified, so this is recorded as a successful basic playlist check, not full audio or duplicate-editor acceptance.
- Real playback and playlist editing/removal of repeated occurrences remain pending at the user's explicit request. Neither was exercised during the continuation.
- User authorized a local commit only. Integration into `main` and push remain unauthorized; pending real-system acceptance is unchanged.

## Large-playlist controlled acceptance

The browser suite supplies 10000 reverse-ordered tracks through the external playlist API fixture. The app's controller, normalization, sorting, pagination and virtualized table execute normally.

- Page size 1000: pagination reports 10000 tracks and the page-10 control works.
- Ascending page 10 starts at `Large 09001`; toggling descending starts at `Large 01000` on that same page. This distinguishes sorting the complete playlist from sorting only the current page.
- Unpaginated mode: first track is `Large 10000`; scrolling to the end mounts `Large 00001`.
- Both blur settings retain fewer than 100 mounted track rows/cells and produce no playlist mutation or unhandled JavaScript error.
- This is a functional virtualization check, not a CPU/FPS benchmark or real-server performance claim.

## Desktop theme and settings acceptance

`node scripts/ui-refresh/desktop-check.mjs` runs the compiled Electron app, not the web build. It uses the existing Playwright installation (`UI_PLAYWRIGHT_PATH`) and project's Electron dependency; build with `pnpm build:electron` first.

The test bootstrap rejects profiles outside this plan's scratch directory and sets separate user data, sessions, logs, downloads, crash dumps and temporary directories before loading the real main process. Auto updates are disabled; `NODE_ENV=test` avoids development-profile suffixes. No main/preload product code was changed.

Verified through the actual desktop renderer, IPC and filesystem:

- Custom JSON theme inherits `defaultDark`, loads its palette and linked CSS.
- Disabling blur overrides the custom CSS filter while retaining the custom background color.
- Editing the JSON updates the palette through the live file watcher, and the palette persists after reload.
- Native export downloads a complete settings JSON inside the isolated profile, including custom theme ID and blur preference.
- Importing legacy settings without the new blur field retains the existing preference.
- Importing current settings with blur enabled updates the UI and persists across reload.
- Both imports preserve navigation and home section order; no unhandled renderer errors.

Each run retains its evidence under `.superpowers/sdd/2026-11-22-biblioteca-viva-ui-refresh/desktop-*/`, including `custom-theme.png` and `downloads/feishin-settings.json`. Authentication/library calls still use the external Subsonic fixture. This is not audio or casting validation.
