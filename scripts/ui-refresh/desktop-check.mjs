import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requireDependency = createRequire(import.meta.url);
const { _electron } = requireDependency(process.env.UI_PLAYWRIGHT_PATH || 'playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scratch = path.join(root, '.superpowers/sdd/2026-11-22-biblioteca-viva-ui-refresh');
await mkdir(scratch, { recursive: true });
const profile = await mkdtemp(path.join(scratch, 'desktop-'));
await mkdir(path.join(profile, 'Themes'));
await writeFile(
    path.join(profile, 'Themes/library-test.json'),
    JSON.stringify({
        colors: {
            background: 'rgb(9, 20, 30)',
            'background-alternate': 'rgb(13, 24, 36)',
            foreground: 'rgb(226, 236, 246)',
        },
        extends: 'defaultDark',
        mode: 'dark',
        stylesheets: ['library-test.css'],
    }),
);
await writeFile(
    path.join(profile, 'Themes/library-test.css'),
    '.fs-player-bar-module-container { background: rgb(1, 2, 3) !important; backdrop-filter: blur(32px); }',
);

let application;
try {
    application = await _electron.launch({
        args: [path.join(root, 'scripts/ui-refresh/electron-bootstrap.mjs')],
        env: { ...process.env, UI_ELECTRON_PROFILE: profile },
        executablePath: requireDependency('electron'),
        timeout: 30000,
    });
    assert.equal(
        await application.evaluate(({ app }) => app.getPath('userData')),
        profile,
        'Desktop uses only the isolated test profile',
    );
    const page = await application.firstWindow();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForLoadState('domcontentloaded');
    const base = page.url().split('#')[0];
    assert.ok(base.startsWith('file:'), 'Tests load the real desktop renderer build');
    await page.route('http://ui-fixture.test/**', (route) =>
        route.fulfill({
            json: {
                'subsonic-response': {
                    albumList2: { album: [] },
                    artists: { index: [] },
                    genres: { genre: [] },
                    jukeboxStatus: { currentIndex: 0, gain: 1, playing: false },
                    musicFolders: { musicFolder: [] },
                    openSubsonicExtensions: [],
                    playlists: { playlist: [] },
                    randomSongs: { song: [] },
                    status: 'ok',
                    user: { adminRole: true, username: 'test' },
                    version: '1.16.1',
                },
            },
        }),
    );
    const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    await page.evaluate((version) => {
        const server = {
            credential: 'fixture',
            features: [],
            id: 'ui-test',
            name: 'UI fixture',
            type: 'subsonic',
            url: 'http://ui-fixture.test',
            username: 'test',
            version: '1.16.1',
        };
        localStorage.setItem('version', JSON.stringify(version));
        localStorage.setItem(
            'store_authentication',
            JSON.stringify({
                state: { currentServer: server, serverList: { 'ui-test': server } },
                version: 2,
            }),
        );
    }, version);
    await page.reload();
    await page.getByRole('textbox', { exact: true, name: 'Search tracks' }).waitFor();
    const themes = await page.evaluate(() => window.api.customThemes.get());
    assert.equal(themes.find((theme) => theme.id === 'library-test')?.error, undefined);
    assert.ok(
        themes.some((theme) => theme.id === 'library-test'),
        'Real IPC reads the custom JSON theme',
    );
    await page.goto(`${base}#/settings`);
    const blur = page.getByRole('switch', { exact: true, name: 'Interface blur' });
    await blur.waitFor();
    if (await blur.isChecked()) {
        await blur.focus();
        await blur.press('Space');
    }
    await page.waitForFunction(() => !!localStorage.getItem('store_settings'));
    await page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('store_settings'));
        settings.state.general.theme = 'library-test';
        settings.state.general.uiBlurEnabled = false;
        localStorage.setItem('store_settings', JSON.stringify(settings));
    });
    await page.reload();
    await blur.waitFor();
    await page.waitForFunction(
        () =>
            getComputedStyle(document.documentElement)
                .getPropertyValue('--theme-colors-background')
                .trim() === 'rgb(9, 20, 30)',
    );
    assert.deepEqual(
        await page.locator('#player-bar').evaluate((e) => ({
            background: getComputedStyle(e).backgroundColor,
            blur: getComputedStyle(e).backdropFilter,
        })),
        { background: 'rgb(9, 20, 30)', blur: 'none' },
        'Custom theme palette is preserved and blur opt-out wins over its stylesheet',
    );
    await page.getByRole('tab', { exact: true, name: 'Advanced' }).click();
    await application.evaluate(({ session }) => {
        globalThis.uiTestDownload = new Promise((resolve) => {
            session.defaultSession.once('will-download', (_event, item) => {
                item.once('done', (_event, state) => resolve({ path: item.getSavePath(), state }));
            });
        });
    });
    await page.getByRole('button', { exact: true, name: 'Export settings' }).click();
    const download = await application.evaluate(() => globalThis.uiTestDownload);
    assert.equal(download.state, 'completed', 'Native settings download completes');
    const exportPath = download.path;
    assert.ok(
        exportPath.startsWith(`${profile}${path.sep}`),
        'Export stays inside the isolated profile',
    );
    const exported = JSON.parse(await readFile(exportPath, 'utf8'));
    assert.equal(exported.general.uiBlurEnabled, false, 'Export includes the blur preference');
    assert.equal(exported.general.theme, 'library-test', 'Export keeps the custom theme ID');
    const legacy = structuredClone(exported);
    delete legacy.general.uiBlurEnabled;
    for (const payload of [
        legacy,
        { ...exported, general: { ...exported.general, uiBlurEnabled: true } },
    ]) {
        await page.getByRole('button', { exact: true, name: 'Import settings' }).click();
        const dialog = page.getByRole('dialog', { exact: true, name: 'Import Feishin settings' });
        await dialog.waitFor();
        await dialog.locator('input[type="file"]').setInputFiles({
            buffer: Buffer.from(JSON.stringify(payload)),
            mimeType: 'application/json',
            name: 'test-settings.json',
        });
        await dialog.getByRole('button', { exact: true, name: 'Import settings' }).click();
        await dialog
            .getByText('Settings have been imported successfully!', { exact: true })
            .waitFor();
        const imported = await page.evaluate(
            () => JSON.parse(localStorage.getItem('store_settings')).state.general,
        );
        assert.equal(
            imported.uiBlurEnabled,
            payload.general.uiBlurEnabled ?? false,
            'Legacy import keeps the existing preference; current import updates it',
        );
        assert.equal(imported.theme, 'library-test');
        assert.deepEqual(
            imported.homeItems,
            exported.general.homeItems,
            'Import preserves home section order',
        );
        assert.deepEqual(
            imported.sidebarItems,
            exported.general.sidebarItems,
            'Import preserves navigation settings',
        );
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
    }
    assert.match(
        await page.locator('#player-bar').evaluate((e) => getComputedStyle(e).backdropFilter),
        /blur\(/,
        'Explicitly imported blur setting takes effect',
    );
    const themePath = path.join(profile, 'Themes/library-test.json');
    const updatedTheme = JSON.parse(await readFile(themePath, 'utf8'));
    updatedTheme.colors.background = 'rgb(10, 21, 31)';
    await writeFile(themePath, JSON.stringify(updatedTheme));
    await page.waitForFunction(
        () =>
            getComputedStyle(document.documentElement)
                .getPropertyValue('--theme-colors-background')
                .trim() === 'rgb(10, 21, 31)',
    );
    await page.reload();
    await page.getByRole('tab', { exact: true, name: 'Advanced' }).waitFor();
    await page.waitForFunction(
        () =>
            getComputedStyle(document.documentElement)
                .getPropertyValue('--theme-colors-background')
                .trim() === 'rgb(10, 21, 31)',
    );
    assert.equal(
        await page.evaluate(
            () => JSON.parse(localStorage.getItem('store_settings')).state.general.uiBlurEnabled,
        ),
        true,
        'Imported blur setting persists across desktop reload',
    );
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(profile, 'custom-theme.png') });
    console.log(
        `PASS: isolated Electron profile, custom JSON theme/IPC/palette/live reload, blur opt-out, settings export/legacy/current import/persistence; evidence: ${profile}`,
    );
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    if (application) await application.close();
}
