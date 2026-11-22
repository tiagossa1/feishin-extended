import electron from 'electron';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scratch = path.join(root, '.superpowers/sdd/2026-11-22-biblioteca-viva-ui-refresh');
const profile = process.env.UI_ELECTRON_PROFILE;
if (!profile || !path.resolve(profile).startsWith(`${scratch}${path.sep}`)) {
    throw new Error(
        "Desktop UI tests require a profile inside this plan's isolated scratch directory",
    );
}

const { app } = electron;
for (const name of ['userData', 'sessionData', 'logs', 'downloads', 'crashDumps', 'temp']) {
    const directory = name === 'userData' ? profile : path.join(profile, name);
    mkdirSync(directory, { recursive: true });
    app.setPath(name, directory);
}

process.env.DISABLE_AUTO_UPDATES = 'true';
process.env.DEBUG_PROD = 'false';
process.env.NODE_ENV = 'test';
await import(pathToFileURL(path.join(root, 'out/main/index.js')).href);
