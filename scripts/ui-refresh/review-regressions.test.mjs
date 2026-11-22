import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { after, test } from 'node:test';

const { chromium } = createRequire(import.meta.url)(
    process.env.UI_PLAYWRIGHT_PATH || 'playwright-core',
);
const browser = await chromium.launch({
    executablePath: process.env.UI_CHROMIUM_PATH,
    headless: true,
});
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:52343';
const { version } = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);
after(() => browser.close());

const songs = [
    {
        album: 'Album',
        artist: 'Artist',
        contentType: 'audio/mpeg',
        duration: 100,
        id: 'beta',
        isDir: false,
        title: 'Beta Track',
    },
    {
        album: 'Album',
        artist: 'Artist',
        contentType: 'audio/mpeg',
        duration: 100,
        id: 'alpha',
        isDir: false,
        title: 'Alpha Track',
    },
    {
        album: 'Album',
        artist: 'Artist',
        contentType: 'audio/mpeg',
        duration: 100,
        id: 'alpha',
        isDir: false,
        title: 'Alpha Track',
    },
];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Plain JavaScript browser test utility.
const createPage = async (entries = songs) => {
    const page = await browser.newPage({ viewport: { height: 900, width: 1440 } });
    await page.addInitScript((version) => {
        const server = {
            credential: 'fixture',
            features: [],
            id: 'review-test',
            name: 'Review fixture',
            type: 'subsonic',
            url: 'http://ui-fixture.test',
            username: 'test',
            version: '1.16.1',
        };
        localStorage.setItem('version', JSON.stringify(version));
        localStorage.setItem(
            'store_authentication',
            JSON.stringify({
                state: { currentServer: server, serverList: { 'review-test': server } },
                version: 2,
            }),
        );
    }, version);
    await page.route('http://ui-fixture.test/**', (route) =>
        route.fulfill({
            json: {
                'subsonic-response': {
                    album: {
                        artist: 'Artist',
                        created: '2026-01-01T00:00:00Z',
                        duration: 10000,
                        id: 'review-album',
                        name: 'Review album',
                        song: Array.from({ length: 100 }, (_, index) => ({
                            ...songs[0],
                            id: `album-${index}`,
                            title: `Album Track ${index}`,
                        })),
                        songCount: 100,
                    },
                    albumList2: { album: [] },
                    artists: { index: [] },
                    genres: { genre: [] },
                    jukeboxStatus: { currentIndex: 0, gain: 1, playing: false },
                    musicFolders: { musicFolder: [] },
                    openSubsonic: true,
                    openSubsonicExtensions: [],
                    playlist: {
                        duration: 300,
                        entry: entries,
                        id: 'review-playlist',
                        name: 'Review playlist',
                        owner: 'test',
                        public: false,
                        songCount: entries.length,
                    },
                    playlists: { playlist: [] },
                    randomSongs: { song: [] },
                    searchResult3: { album: [], artist: [], song: entries },
                    serverVersion: 'test',
                    status: 'ok',
                    type: 'subsonic',
                    user: { adminRole: true, playlistRole: true, username: 'test' },
                    version: '1.16.1',
                },
            },
        }),
    );
    return page;
};

test('playlist # restores original occurrence order after relevance-ranked search', async () => {
    const entries = ['Early Needle Extended', 'Needle', 'Late Needle'].map((title, index) => ({
        ...songs[0],
        id: `needle-${index}`,
        title,
    }));
    const page = await createPage(entries);
    try {
        await page.goto(
            `${base}/#/playlists/review-playlist/songs?searchTerm=Needle&sortBy=name&sortOrder=DESC`,
        );
        const cells = page
            .locator('[data-row-index]')
            .filter({ hasText: /^(Early Needle Extended|Needle|Late Needle)/ });
        await cells.first().waitFor();
        const reset = page.getByRole('button', { exact: true, name: 'Sort by #' }).first();
        await reset.click();
        await page.waitForURL('**sortBy=id**');
        await page.locator('[aria-sort="ascending"]').filter({ has: reset }).first().waitFor();
        assert.deepEqual(
            await cells.evaluateAll((es) =>
                es.map(
                    (e) => e.textContent.match(/^(Early Needle Extended|Needle|Late Needle)/)[0],
                ),
            ),
            ['Early Needle Extended', 'Needle', 'Late Needle'],
        );
        await reset.click();
        await page.waitForURL('**sortOrder=DESC**');
        await page.locator('[aria-sort="descending"]').filter({ has: reset }).first().waitFor();
        assert.deepEqual(
            await cells.evaluateAll((es) =>
                es.map(
                    (e) => e.textContent.match(/^(Early Needle Extended|Needle|Late Needle)/)[0],
                ),
            ),
            ['Late Needle', 'Needle', 'Early Needle Extended'],
        );
    } finally {
        await page.close();
    }
});

test('Subsonic library does not announce clickable sorting that search3 ignores', async () => {
    const page = await createPage();
    try {
        await page.goto(`${base}/#/library/songs`);
        await page.getByRole('columnheader').first().waitFor();
        assert.equal(await page.getByRole('button', { name: /^Sort by / }).count(), 0);
    } finally {
        await page.close();
    }
});

test('playlist album view respects original descending order while searching tracks', async () => {
    const entries = ['Early Needle Extended', 'Needle', 'Late Needle'].map((title, index) => ({
        ...songs[0],
        album: `Album ${index}`,
        albumId: `album-${index}`,
        id: `needle-${index}`,
        title,
    }));
    const page = await createPage(entries);
    try {
        await page.goto(
            `${base}/#/playlists/review-playlist/songs?searchTerm=Needle&sortBy=id&sortOrder=DESC`,
        );
        await page.getByRole('button', { exact: true, name: 'Tracks' }).click();
        await page.evaluate(() => {
            const settings = JSON.parse(localStorage.getItem('store_settings'));
            settings.state.lists.playlistAlbum.display = 'table';
            localStorage.setItem('store_settings', JSON.stringify(settings));
        });
        await page.reload();
        const cells = page.locator('[data-row-index]').filter({ hasText: /^Album [012]/ });
        await cells.first().waitFor();
        assert.deepEqual(
            await cells.evaluateAll((es) => es.map((e) => e.textContent.match(/^Album [012]/)[0])),
            ['Album 2', 'Album 1', 'Album 0'],
        );
    } finally {
        await page.close();
    }
});

test('moving one repeated playlist occurrence preserves all rows and selection identity', async () => {
    const page = await createPage();
    const mutations = [];
    page.on('request', (request) => {
        if (
            /ui-fixture\.test.*(?:updatePlaylist|deletePlaylist|createPlaylist)/.test(request.url())
        )
            mutations.push(request.url());
    });
    try {
        await page.goto(`${base}/#/playlists/review-playlist/songs`);
        await page.getByRole('button', { exact: true, name: 'Edit' }).click();
        const groups = page.locator('.fs-playlist-reorder-column-module-group');
        await groups.nth(2).waitFor();
        const cells = page.locator('[data-row-index]').filter({ hasText: /^(Alpha|Beta) Track/ });
        assert.equal(await cells.count(), 3);
        await groups.nth(2).getByRole('button').nth(0).click();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        assert.equal(
            await cells.count(),
            3,
            'Moving one duplicate must not delete another occurrence',
        );
        await groups.nth(1).getByRole('button').nth(0).click();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        assert.deepEqual(
            await cells.evaluateAll((es) =>
                es.map((e) => e.textContent.match(/^(Alpha|Beta) Track/)[0]),
            ),
            ['Alpha Track', 'Beta Track', 'Alpha Track'],
        );
        assert.equal(
            await page
                .locator('[data-row-index].fs-item-table-list-column-module-row-selected')
                .filter({ hasText: /^Alpha Track/ })
                .count(),
            1,
            'A single selected occurrence must not select both repeated rows',
        );
        await groups.nth(0).getByRole('button').nth(1).click();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        assert.deepEqual(
            await cells.evaluateAll((es) =>
                es.map((e) => e.textContent.match(/^(Alpha|Beta) Track/)[0]),
            ),
            ['Beta Track', 'Alpha Track', 'Alpha Track'],
        );
        await groups
            .nth(2)
            .getByRole('button')
            .nth(2)
            .dragTo(cells.first(), { targetPosition: { x: 20, y: 5 } });
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        assert.deepEqual(
            await cells.evaluateAll((es) =>
                es.map((e) => e.textContent.match(/^(Alpha|Beta) Track/)[0]),
            ),
            ['Alpha Track', 'Beta Track', 'Alpha Track'],
        );
        await groups
            .nth(2)
            .getByRole('button')
            .nth(2)
            .dragTo(cells.first(), { targetPosition: { x: 20, y: 5 } });
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        assert.deepEqual(
            await cells.evaluateAll((es) =>
                es.map((e) => e.textContent.match(/^(Alpha|Beta) Track/)[0]),
            ),
            ['Alpha Track', 'Alpha Track', 'Beta Track'],
            'Dragging onto another occurrence of the same song is allowed',
        );
        await cells.nth(1).click({ modifiers: ['Control'], position: { x: 90, y: 60 } });
        await page.waitForFunction(
            () =>
                [
                    ...document.querySelectorAll(
                        '[data-row-index].fs-item-table-list-column-module-row-selected',
                    ),
                ].filter((e) => e.textContent.startsWith('Alpha Track')).length === 2,
        );
        assert.equal(
            await page
                .locator('[data-row-index].fs-item-table-list-column-module-row-selected')
                .filter({ hasText: /^Alpha Track/ })
                .count(),
            2,
            'Repeated occurrences can be selected independently',
        );
        await groups.nth(0).getByRole('button').nth(1).click();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
        assert.deepEqual(
            await cells.evaluateAll((es) =>
                es.map((e) => e.textContent.match(/^(Alpha|Beta) Track/)[0]),
            ),
            ['Beta Track', 'Alpha Track', 'Alpha Track'],
        );
        assert.deepEqual(mutations, [], 'Editor reordering remains local until explicitly saved');
    } finally {
        await page.close();
    }
});

test('regular and sticky headers have valid row ownership and column indices', async () => {
    const page = await createPage();
    try {
        await page.goto(`${base}/#/playlists/review-playlist/songs`);
        await page.getByRole('columnheader').first().waitFor();
        assert.equal(
            await page.getByRole('columnheader', { exact: true, name: 'Duration' }).count(),
            1,
            'Icon-only headers expose the column meaning',
        );
        assert.equal(
            await page.getByRole('columnheader', { exact: true, name: 'Favorite' }).count(),
            1,
        );
        assert.deepEqual(
            await page.getByRole('columnheader').evaluateAll((headers) =>
                headers
                    .filter(
                        (header) =>
                            !header
                                .closest('[role="row"]')
                                ?.closest('[role="grid"], [role="table"]') ||
                            !(Number(header.getAttribute('aria-colindex')) > 0),
                    )
                    .map((header) => ({
                        columnIndex: header.getAttribute('aria-colindex'),
                        label: header.textContent,
                        row: header.closest('[role="row"]')?.getAttribute('role'),
                    })),
            ),
            [],
            'All regular headers belong to a row and report their column index',
        );
        await page.goto(`${base}/#/library/albums/review-album`);
        await page.getByRole('columnheader').first().waitFor();
        await page.evaluate(() => {
            const scroll = [...document.querySelectorAll('div')]
                .filter(
                    (e) =>
                        e.clientHeight > 0 &&
                        e.scrollHeight > e.clientHeight &&
                        ['auto', 'scroll'].includes(getComputedStyle(e).overflowY),
                )
                .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
            scroll.scrollTop = 600;
        });
        const sticky = page.locator('.fs-item-table-list-module-sticky-header');
        await sticky.waitFor();
        assert.deepEqual(
            await sticky
                .getByRole('columnheader')
                .evaluateAll((headers) =>
                    headers
                        .filter(
                            (header) =>
                                !header
                                    .closest('[role="row"]')
                                    ?.closest('[role="grid"], [role="table"]') ||
                                !(Number(header.getAttribute('aria-colindex')) > 0),
                        )
                        .map((header) => header.textContent),
                ),
            [],
            'Sticky and pinned headers keep the same ARIA ownership contract',
        );
    } finally {
        await page.close();
    }
});
