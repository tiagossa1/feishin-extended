import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)(
    process.env.UI_PLAYWRIGHT_PATH || 'playwright-core',
);

// External API fixture only: the renderer, settings store and routing are real.
try {
    const browser = await chromium.launch({
        executablePath: process.env.UI_CHROMIUM_PATH,
        headless: true,
    });
    try {
        const page = await browser.newPage({ viewport: { height: 900, width: 1440 } });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const { version } = JSON.parse(
            readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
        );
        await page.addInitScript((version) => {
            localStorage.setItem('version', JSON.stringify(version));
            if (!localStorage.getItem('store_authentication')) {
                const server = {
                    credential: 'fixture',
                    features: [],
                    id: 'ui-test',
                    name: 'UI fixture',
                    savePassword: false,
                    type: 'subsonic',
                    url: 'http://ui-fixture.test',
                    username: 'test',
                    version: '1.16.1',
                };
                localStorage.setItem(
                    'store_authentication',
                    JSON.stringify({
                        state: { currentServer: server, serverList: { 'ui-test': server } },
                        version: 2,
                    }),
                );
            }
        }, version);
        const entries = [
            {
                album: 'Album B',
                artist: 'Artist B',
                contentType: 'audio/mpeg',
                duration: 200,
                id: 'beta',
                isDir: false,
                suffix: 'mp3',
                title: 'Beta Track',
                type: 'music',
            },
            {
                album: 'Album A',
                artist: 'Artist A',
                contentType: 'audio/mpeg',
                duration: 100,
                id: 'alpha',
                isDir: false,
                suffix: 'mp3',
                title: 'Alpha Track',
                type: 'music',
            },
            {
                album: 'Album A',
                artist: 'Artist A',
                contentType: 'audio/mpeg',
                duration: 100,
                id: 'alpha',
                isDir: false,
                suffix: 'mp3',
                title: 'Alpha Track',
                type: 'music',
            },
        ];
        const playlist = {
            duration: 400,
            entry: entries,
            id: 'test-playlist',
            name: 'Test playlist',
            owner: 'test',
            public: false,
            songCount: 3,
        };
        const mutations = [];
        const largePlaylist = {
            ...playlist,
            duration: 10000,
            entry: Array.from({ length: 10000 }, (_, index) => ({
                ...entries[0],
                duration: 1,
                id: `large-${10000 - index}`,
                title: `Large ${String(10000 - index).padStart(5, '0')}`,
            })),
            id: 'large-playlist',
            name: 'Large playlist',
            songCount: 10000,
        };
        let playlistItems = [];
        await page.route('http://ui-fixture.test/**', (route) => {
            if (/updatePlaylist|deletePlaylist|createPlaylist/.test(route.request().url()))
                mutations.push(route.request().url());
            return route.fulfill({
                json: {
                    'subsonic-response': {
                        albumList2: { album: [] },
                        artists: { index: [] },
                        genres: { genre: [] },
                        internetRadioStations: { internetRadioStation: [] },
                        jukeboxStatus: { currentIndex: 0, gain: 1, playing: false },
                        musicFolders: { musicFolder: [] },
                        openSubsonic: true,
                        openSubsonicExtensions: [],
                        playlist:
                            new URL(route.request().url()).searchParams.get('id') ===
                            'large-playlist'
                                ? largePlaylist
                                : playlist,
                        playlists: { playlist: playlistItems },
                        randomSongs: { song: [] },
                        searchResult3: { album: [], artist: [], song: entries },
                        serverVersion: '1',
                        status: 'ok',
                        type: 'subsonic',
                        user: { adminRole: true, playlistRole: true, username: 'test' },
                        version: '1.16.1',
                    },
                },
            });
        });
        const base = process.env.UI_BASE_URL || 'http://127.0.0.1:52343';
        await page.goto(base);
        await page.locator('#sidebar').waitFor();
        assert.equal(
            await page
                .locator('#sidebar')
                .evaluate((e) => Math.round(e.getBoundingClientRect().width)),
            205,
            'New profiles use compact library navigation',
        );
        assert.match(
            await page
                .locator('#player-bar')
                .evaluate((element) => getComputedStyle(element).backdropFilter),
            /blur\(22px\)/,
        );
        await page.goto(`${base}/#/settings`);
        const blur = page.getByRole('switch', { exact: true, name: 'Interface blur' });
        await blur.waitFor();
        await blur.focus();
        await blur.press('Space');
        assert.equal(
            await page
                .locator('#player-bar')
                .evaluate((element) => getComputedStyle(element).backdropFilter),
            'none',
        );
        await page.reload();
        await blur.waitFor();
        assert.equal(await blur.isChecked(), false);
        await blur.focus();
        await blur.press('Space');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(
            await page
                .locator('#player-bar')
                .evaluate((element) => getComputedStyle(element).transitionDuration),
            '0s',
        );
        assert.deepEqual(errors, []);
        await page.goto(`${base}/#/`);
        const search = page.getByRole('textbox', { exact: true, name: 'Search tracks' });
        await search.waitFor();
        assert.equal(
            await search.isVisible(),
            true,
            'Home exposes track search without opening a menu',
        );
        await search.fill('Teardrop');
        await search.press('Enter');
        await page.waitForURL('**/#/search/song?query=Teardrop');
        await page.goto(`${base}/#/`);
        await page.getByRole('link', { exact: true, name: 'View all playlists' }).click();
        await page.waitForURL('**/#/playlists');
        await page.goto(`${base}/#/playlists/test-playlist/songs`);
        await page.waitForLoadState('networkidle');
        const titleSort = page.getByRole('button', { exact: true, name: 'Sort by TITLE' }).first();
        await titleSort.waitFor({ timeout: 5000 }).catch(async (error) => {
            console.error(await page.locator('body').innerText());
            console.error('page errors', errors);
            console.error(
                await page
                    .locator('[class*="playlist"]')
                    .evaluateAll((es) =>
                        es.map((e) => ({ class: e.className, html: e.innerHTML.slice(0, 1000) })),
                    ),
            );
            console.error(
                await page.locator('[role="grid"], [role="columnheader"]').evaluateAll((es) =>
                    es.map((e) => ({
                        html: e.outerHTML.slice(0, 700),
                        rect: e.getBoundingClientRect().toJSON(),
                        role: e.role,
                    })),
                ),
            );
            throw error;
        });
        await titleSort.click();
        await page.waitForURL('**sortBy=name**');
        assert.equal(await titleSort.locator('..').getAttribute('aria-sort'), 'ascending');
        await titleSort.click();
        await page.waitForURL('**sortOrder=DESC**');
        await page
            .locator('[aria-sort="descending"]')
            .filter({ has: titleSort })
            .first()
            .waitFor({ timeout: 5000 });
        assert.equal(await titleSort.locator('..').getAttribute('aria-sort'), 'descending');
        await page.goto(
            `${base}/#/playlists/test-playlist/songs?searchTerm=Track&sortBy=name&sortOrder=ASC`,
        );
        const trackCells = page
            .locator('[data-row-index]')
            .filter({ hasText: /^(Alpha|Beta) Track/ });
        await trackCells.first().waitFor();
        assert.deepEqual(
            await trackCells.evaluateAll((es) =>
                es.map((e) => (e.textContent.includes('Alpha') ? 'Alpha' : 'Beta')),
            ),
            ['Alpha', 'Alpha', 'Beta'],
            'Filtered playlist respects header ordering and keeps repeated occurrences',
        );
        await page.getByRole('button', { exact: true, name: 'Sort by #' }).first().click();
        await page.waitForURL('**sortBy=id**');
        await page.waitForFunction(() =>
            [...document.querySelectorAll('[data-row-index]')]
                .find((e) => e.textContent.startsWith('Beta Track'))
                ?.getAttribute('data-row-index')
                ?.endsWith('-1'),
        );
        assert.deepEqual(
            await trackCells.evaluateAll((es) =>
                es.map((e) => (e.textContent.includes('Alpha') ? 'Alpha' : 'Beta')),
            ),
            ['Beta', 'Alpha', 'Alpha'],
        );
        assert.deepEqual(mutations, [], 'Header sorting never persists a playlist reorder');
        await titleSort.focus();
        await titleSort.press('Enter');
        await page.waitForURL('**sortBy=name**');
        await titleSort.press('Space');
        await page.waitForURL('**sortOrder=DESC**');
        await page.locator('[aria-sort="descending"]').filter({ has: titleSort }).first().waitFor();
        assert.equal(
            await titleSort.evaluate((e) => document.activeElement === e),
            true,
            'Sorting keeps keyboard focus on the header',
        );
        const durationHeader = page
            .getByRole('button', { exact: true, name: 'Sort by Duration' })
            .first()
            .locator('..');
        const resizeHandle = durationHeader.locator(
            '.fs-item-table-list-column-module-resize-handle:not(.fs-item-table-list-column-module-resize-handle-disabled)',
        );
        const resizeBox = await resizeHandle.boundingBox();
        assert.ok(resizeBox, 'Duration resize handle is reachable');
        const oldDurationWidth = await page.evaluate(
            () =>
                JSON.parse(
                    localStorage.getItem('store_settings'),
                ).state.lists.playlistSong.table.columns.find((c) => c.id === 'duration').width,
        );
        const urlBeforeResize = page.url();
        await page.mouse.move(
            resizeBox.x + resizeBox.width / 2,
            resizeBox.y + resizeBox.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(
            resizeBox.x + resizeBox.width / 2 + 40,
            resizeBox.y + resizeBox.height / 2,
            { steps: 5 },
        );
        await page.mouse.up();
        await page.waitForFunction(
            (before) =>
                JSON.parse(
                    localStorage.getItem('store_settings'),
                ).state.lists.playlistSong.table.columns.find((c) => c.id === 'duration').width !==
                before,
            oldDurationWidth,
        );
        assert.equal(
            page.url(),
            urlBeforeResize,
            'Resizing a header does not sort or lose filters',
        );
        const orderBeforeDrag = await page.evaluate(() =>
            JSON.stringify(
                JSON.parse(
                    localStorage.getItem('store_settings'),
                ).state.lists.playlistSong.table.columns.map((column) => column.id),
            ),
        );
        const reorderHandle = titleSort
            .locator('..')
            .locator('.fs-item-table-list-column-module-reorder-handle');
        const albumHeader = page
            .getByRole('button', { exact: true, name: 'Sort by ALBUM' })
            .first()
            .locator('..');
        await reorderHandle.dragTo(albumHeader, { targetPosition: { x: 10, y: 10 } });
        await page.waitForFunction(
            (before) =>
                JSON.stringify(
                    JSON.parse(
                        localStorage.getItem('store_settings'),
                    ).state.lists.playlistSong.table.columns.map((column) => column.id),
                ) !== before,
            orderBeforeDrag,
        );
        assert.equal(
            page.url(),
            urlBeforeResize,
            'Dragging a column handle changes column order without sorting the playlist',
        );
        await page.goto(`${base}/#/library/songs`);
        const libraryHeader = page.getByRole('columnheader').filter({ hasText: 'TITLE' }).first();
        await libraryHeader.waitFor();
        assert.equal(
            await page.getByRole('button', { name: /^Sort by / }).count(),
            0,
            'Subsonic search3 cannot execute header ordering, including title',
        );
        assert.equal(
            await page.getByRole('button', { exact: true, name: 'Sort by ALBUM' }).count(),
            0,
            'Subsonic library does not offer album sorting that its controller cannot execute',
        );
        assert.equal(
            await page.getByRole('button', { exact: true, name: 'Sort by Duration' }).count(),
            0,
            'Subsonic library does not offer unsupported duration sorting',
        );
        const originalPagination = await page.evaluate(
            () => JSON.parse(localStorage.getItem('store_settings')).state.lists.song.pagination,
        );
        for (const pagination of ['paginated', 'infinite']) {
            await page.evaluate((pagination) => {
                const settings = JSON.parse(localStorage.getItem('store_settings'));
                settings.state.lists.song.pagination = pagination;
                localStorage.setItem('store_settings', JSON.stringify(settings));
            }, pagination);
            await page.reload();
            await libraryHeader.waitFor();
            assert.equal(
                await page.getByRole('button', { name: /^Sort by / }).count(),
                0,
                `${pagination} does not claim unsupported backend ordering`,
            );
            assert.equal(
                await page.locator('.fs-item-list-pagination-module-pagination-container').count(),
                pagination === 'paginated' ? 1 : 0,
                'Both pagination modes are exercised',
            );
            assert.equal(
                await page.getByRole('button', { exact: true, name: 'Sort by ALBUM' }).count(),
                0,
                `${pagination} preserves backend sort limits`,
            );
        }
        await page.evaluate((pagination) => {
            const settings = JSON.parse(localStorage.getItem('store_settings'));
            settings.state.lists.song.pagination = pagination;
            localStorage.setItem('store_settings', JSON.stringify(settings));
        }, originalPagination);
        await page.goto(`${base}/#/search/song?query=Track`);
        await trackCells.first().waitFor();
        assert.equal(
            await page.getByRole('button', { name: /^Sort by / }).count(),
            0,
            'Global search relevance is not changed by library header sorting',
        );
        await page.goto(
            `${base}/#/playlists/test-playlist/songs?searchTerm=Track&sortBy=id&sortOrder=ASC`,
        );
        await trackCells.first().waitFor();
        await page
            .locator('.fs-left-controls-module-image[role="button"]')
            .click({ position: { x: 5, y: 5 } });
        const upNext = page.getByRole('button', { exact: true, name: 'Up next' });
        await upNext.waitFor({ timeout: 5000 }).catch(async (error) => {
            console.error('Expanded player:', await page.locator('body').innerText());
            console.error('page errors', errors);
            throw error;
        });
        assert.equal(
            await upNext.innerText(),
            'Up next',
            'Expanded reader exposes a visible queue tab',
        );
        await upNext.click();
        assert.equal(await upNext.getAttribute('aria-pressed'), 'true');
        assert.equal(
            await page
                .locator('.fs-full-screen-player-queue-module-grid-container')
                .evaluate((e) => getComputedStyle(e, '::before').backdropFilter),
            'blur(8px)',
        );
        const lyrics = page.getByRole('button', { exact: true, name: 'Lyrics' });
        await lyrics.click();
        assert.equal(await lyrics.getAttribute('aria-pressed'), 'true');
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setEmulatedMedia', {
            features: [
                { name: 'prefers-reduced-motion', value: 'reduce' },
                { name: 'prefers-reduced-transparency', value: 'reduce' },
            ],
        });
        assert.deepEqual(
            await page.evaluate(() => ({
                artworkBackdrop: getComputedStyle(
                    document.querySelector(
                        '.fs-full-screen-player-module-background-image-overlay',
                    ),
                ).backdropFilter,
                imageTransition: getComputedStyle(
                    document.querySelector('.fs-full-screen-player-module-image-column'),
                ).transitionDuration,
            })),
            { artworkBackdrop: 'none', imageTransition: '0s' },
            'Reader respects reduced motion and reduced transparency after its base styles are applied',
        );
        await cdp.send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });
        await page.waitForFunction(() => {
            const container = document.querySelector('.fs-full-screen-player-module-container');
            const image = document.querySelector('.fs-full-screen-player-module-image-column');
            const panel = document.querySelector(
                '.fs-full-screen-player-queue-module-module-content',
            );
            return (
                container &&
                image &&
                panel &&
                Math.abs(new DOMMatrix(getComputedStyle(container).transform).m42) < 0.1 &&
                Number(getComputedStyle(panel).opacity) > 0.99 &&
                image.getBoundingClientRect().width < innerWidth * 0.55
            );
        });
        if (process.env.UI_SCREENSHOT_DIR) {
            await page.screenshot({
                path: path.join(process.env.UI_SCREENSHOT_DIR, 'expanded-desktop.png'),
            });
        }
        await page.goto(`${base}/#/`);
        await search.waitFor();
        const originalSettings = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('store_settings')),
        );
        await page.evaluate(() => {
            const settings = JSON.parse(localStorage.getItem('store_settings'));
            const general = settings.state.general;
            delete general.uiBlurEnabled;
            general.homeFeature = false;
            general.homeItems = general.homeItems.map((item) => ({ ...item, disabled: true }));
            general.sidebarItems = [...general.sidebarItems].reverse();
            localStorage.setItem('store_settings', JSON.stringify(settings));
        });
        await page.reload();
        await search.waitFor();
        assert.equal(
            await page.getByRole('link', { exact: true, name: 'View all playlists' }).count(),
            0,
            'Disabled home sections stay disabled after an old profile is hydrated',
        );
        assert.equal(
            await page.locator('#player-bar').evaluate((e) => getComputedStyle(e).backdropFilter),
            'blur(22px)',
            'Old settings inherit the new blur default',
        );
        await page.evaluate(
            (settings) => localStorage.setItem('store_settings', JSON.stringify(settings)),
            originalSettings,
        );
        playlistItems = [
            playlist,
            { ...playlist, id: 'second-playlist', name: 'Evening playlist' },
        ];
        await page.reload();
        await search.waitFor();
        await page.getByRole('link', { exact: true, name: 'Evening playlist' }).waitFor();
        for (const viewport of [
            { height: 900, width: 1440 },
            { height: 768, width: 1024 },
            { height: 844, width: 390 },
        ]) {
            await page.setViewportSize(viewport);
            await page.goto(`${base}/#/`);
            await search.waitFor();
            await page.waitForFunction(() =>
                [...document.querySelectorAll('main[class*="animated-page"]')].every(
                    (e) => Number(getComputedStyle(e).opacity) > 0.99,
                ),
            );
            assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                true,
            );
            assert.equal(
                await search.evaluate((e) => e.getBoundingClientRect().right <= innerWidth),
                true,
            );
            if (process.env.UI_SCREENSHOT_DIR)
                await page.screenshot({
                    path: path.join(process.env.UI_SCREENSHOT_DIR, `home-${viewport.width}.png`),
                });
            await page.goto(`${base}/#/playlists/test-playlist/songs`);
            await trackCells.first().waitFor();
            if (viewport.width === 390)
                assert.ok(
                    (await trackCells.first().evaluate((e) => e.getBoundingClientRect().width)) >=
                        200,
                    'Mobile keeps the track title readable instead of squeezing every column into the viewport',
                );
            await page.waitForFunction(() =>
                [...document.querySelectorAll('main[class*="animated-page"]')].every(
                    (e) => Number(getComputedStyle(e).opacity) > 0.99,
                ),
            );
            assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                true,
            );
            if (process.env.UI_SCREENSHOT_DIR)
                await page.screenshot({
                    path: path.join(
                        process.env.UI_SCREENSHOT_DIR,
                        `playlist-${viewport.width}.png`,
                    ),
                });
        }
        await page.setViewportSize({ height: 900, width: 1440 });
        await page.goto(`${base}/#/`);
        for (const theme of ['defaultDark', 'defaultLight', 'glassyDark', 'highContrastDark']) {
            await page.evaluate((theme) => {
                const settings = JSON.parse(localStorage.getItem('store_settings'));
                settings.state.general.theme = theme;
                settings.state.general.uiBlurEnabled = false;
                localStorage.setItem('store_settings', JSON.stringify(settings));
            }, theme);
            await page.reload();
            await search.waitFor();
            await page.waitForFunction(() =>
                [...document.querySelectorAll('main[class*="animated-page"]')].every(
                    (e) => Number(getComputedStyle(e).opacity) > 0.99,
                ),
            );
            assert.equal(
                await page
                    .locator('#player-bar')
                    .evaluate((e) => getComputedStyle(e).backdropFilter),
                'none',
                `${theme} respects disabled interface blur`,
            );
            if (process.env.UI_SCREENSHOT_DIR)
                await page.screenshot({
                    path: path.join(process.env.UI_SCREENSHOT_DIR, `home-${theme}.png`),
                });
        }
        await page.evaluate(() => {
            const settings = JSON.parse(localStorage.getItem('store_settings'));
            settings.state.lists.playlistSong.pagination = 'paginated';
            settings.state.lists.playlistSong.itemsPerPage = 1000;
            localStorage.setItem('store_settings', JSON.stringify(settings));
        });
        await page.goto(`${base}/#/playlists/large-playlist/songs?sortBy=name&sortOrder=ASC`);
        await page.reload();
        const largeCells = page.locator('[data-row-index]').filter({ hasText: /^Large \d{5}/ });
        await page.waitForFunction(() =>
            [...document.querySelectorAll('[data-row-index]')].some((e) =>
                e.textContent.startsWith('Large 00001'),
            ),
        );
        assert.match(
            await page.locator('.fs-pagination-module-container').innerText(),
            /10000/,
            'Pagination reports all 10000 tracks',
        );
        assert.ok(
            (await page
                .locator('[data-row-index]')
                .evaluateAll(
                    (es) => new Set(es.map((e) => e.getAttribute('data-row-index'))).size,
                )) < 100,
            'A 1000-track page mounts only the virtualized viewport',
        );
        await page.getByRole('button', { exact: true, name: '10' }).click();
        await page.waitForURL('**currentPage=9**');
        await page.waitForFunction(() =>
            [...document.querySelectorAll('[data-row-index]')].some((e) =>
                e.textContent.startsWith('Large 09001'),
            ),
        );
        await titleSort.click();
        await page.waitForURL('**sortOrder=DESC**');
        await page.waitForFunction(() =>
            [...document.querySelectorAll('[data-row-index]')].some((e) =>
                e.textContent.startsWith('Large 01000'),
            ),
        );
        assert.equal(
            new URL(page.url().split('#')[1], base).searchParams.get('currentPage'),
            '9',
            'Sorting preserves the selected page while sorting the entire playlist',
        );
        for (const uiBlurEnabled of [false, true]) {
            await page.evaluate((uiBlurEnabled) => {
                const settings = JSON.parse(localStorage.getItem('store_settings'));
                settings.state.lists.playlistSong.pagination = 'infinite';
                settings.state.general.uiBlurEnabled = uiBlurEnabled;
                localStorage.setItem('store_settings', JSON.stringify(settings));
            }, uiBlurEnabled);
            await page.goto(`${base}/#/playlists/large-playlist/songs?sortBy=name&sortOrder=DESC`);
            await page.reload();
            await page.waitForFunction(() =>
                [...document.querySelectorAll('[data-row-index]')].some((e) =>
                    e.textContent.startsWith('Large 10000'),
                ),
            );
            assert.ok(
                (await largeCells.count()) < 100,
                'An unpaginated 10000-track playlist remains virtualized',
            );
            assert.equal(
                await page
                    .locator('#player-bar')
                    .evaluate((e) => getComputedStyle(e).backdropFilter),
                uiBlurEnabled ? 'blur(22px)' : 'none',
            );
            const scrollTarget = await page.evaluateHandle(
                () =>
                    [...document.querySelectorAll('div')]
                        .filter(
                            (e) =>
                                e.clientHeight > 0 &&
                                e.scrollHeight > e.clientHeight &&
                                ['auto', 'scroll'].includes(getComputedStyle(e).overflowY),
                        )
                        .sort((a, b) => b.scrollHeight - a.scrollHeight)[0],
            );
            assert.ok(
                await scrollTarget.evaluate((e) => !!e),
                'Large playlist has a scrollable viewport',
            );
            await scrollTarget.evaluate((e) => {
                e.scrollTop = e.scrollHeight;
            });
            await page.waitForFunction(() =>
                [...document.querySelectorAll('[data-row-index]')].some((e) =>
                    e.textContent.startsWith('Large 00001'),
                ),
            );
            assert.ok(
                (await largeCells.count()) < 100,
                'Scrolling to the end does not mount the entire playlist',
            );
            await scrollTarget.dispose();
        }
        assert.deepEqual(
            mutations,
            [],
            'Large-playlist sorting and scrolling never write playlist changes',
        );
        assert.deepEqual(errors, []);
        console.log(
            'PASS: blur/persistence, home search, playlist sort/filter, keyboard and column resize/drag, library controls/backend limits, search isolation, reader accessibility, responsive widths, 10000-track playlist pagination/global sort/virtualized scrolling with blur on/off; external API fixture',
        );
    } finally {
        await browser.close();
    }
} catch (error) {
    console.error(error);
    process.exitCode = 1;
}
