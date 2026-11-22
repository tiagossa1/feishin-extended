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
| UI-04 | Sort each supported column twice, reset #, resize/reorder, filter/reload; edit repeated occurrences and cancel | ASC/DESC, whole query sorted, identity retained, no reorder mutation | Playlist ordering, # ASC/DESC with relevance-ranked matches, album-view searched ordering, keyboard/resize/column drag PASS. Subsonic library headers are non-sortable because search3 ignores ordering. Controlled repeated-occurrence editor moves, drag and multi-selection PASS; real-server save/removal acceptance NOT TESTED |
| UI-05 | Open/close expanded player and modules, seek/volume, devices/timer/config, lyrics/related/visualizer, radio | Playback uninterrupted, all controls retained, blur respects preferences | Real renderer queue/lyrics module controls and 8px backdrop PASS; actual playback, radio/casting/visualizer lifecycle NOT TESTED |
| UI-06 | Desktop/web, available backends and engines, other routes, 1440x900/1024x768/390x844, themes/zoom, large list | Functional parity, no clipping or obvious scroll regression | Three viewport widths and readable mobile title cells PASS. Controlled 10000-track playlist and isolated desktop theme/settings acceptance PASS. Real backends/devices/hardware performance NOT TESTED |

## Verification

- Baseline `pnpm lint-code`: PASS, exit 0.
- Baseline `pnpm lint-styles`: PASS, exit 0.
- No baseline automated test command is defined.
- Real authenticated backends, casting devices and MPV/DLNA/jukebox are not yet validated. Source inventory is not runtime evidence.
- Initial local commit `be6073cb` and the subsequent review-fix commit/branch push were authorized. No local typecheck or integration into `main` authorized.

## Implementation verification

- `node --test scripts/ui-refresh/table-sort.test.mjs`: PASS, 2/2.
- Branch-review regression run: `node --test scripts/ui-refresh/review-regressions.test.mjs scripts/ui-refresh/playlist-order.test.mjs scripts/ui-refresh/table-sort.test.mjs`: PASS, 10/10 after reproducing the failures before fixing them.
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
- New interactive library headers are disabled for Subsonic: its search3 controller does not execute ASC/DESC sorting. Existing sort menus remain available; playlist sorting remains client-side. No backend/controller behavior was added.
- Playlist search retains occurrence order before applying the selected sort, while global search continues to use its existing relevance behavior.

## User acceptance and pending work

- Visual design approved by the user.
- User confirmed that a manually tested playlist worked. Backend, playback controls and editing scenarios were not specified, so this is recorded as a successful basic playlist check, not full audio or duplicate-editor acceptance.
- Real playback and server-side saving/removal of repeated playlist occurrences remain pending. Review fixes were exercised in the real renderer with disposable API fixtures, without personal playlists or server mutations.
- User authorized committing the review fixes and pushing `ui/biblioteca-viva`. Integration into `main` remains unauthorized; pending real-system acceptance is unchanged.

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

## Branch review fixes

Reviewed `main...be6073cb` on two independent axes: standards and specification. Four findings were reproduced; following the affected search callers revealed one more related album-view defect.

- `#` previously retained Fuse relevance order instead of the original playlist order. Playlist-only matching now opts out of result ranking before applying ASC/DESC.
- Album-view search previously returned before applying the chosen sort. Sorting now applies after matching, consistently with track/grid views.
- Subsonic title headers previously changed their arrow without ordering data. Unsupported library headers are now disabled, rather than sorting only loaded rows.
- Regular headers lost column indices, and sticky headers had no row/table ownership. ARIA indices, translated icon-column names and explicit sticky table/row roles are now present, including pinned sections.
- The preexisting editor used canonical song IDs and could delete another occurrence when moving a repeated track. Events and reconstruction now use `playlistItemId`, preserve source objects/current selection order, and reject cross-playlist handle drops.

Controlled editor checks cover up/down moves, dragging onto another occurrence of the same song, independent multi-selection and no server write until explicit save. Helpers also cover index zero, missing targets/sources, self-drops and immutable source objects. All 10 regression/helper tests pass; browser/desktop suites and Electron/web/remote builds pass. The user authorized a commit and branch push for these fixes, without a merge into `main`.
