import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadTypescript } from './load-typescript.mjs';

const helperUrl = new URL(
    '../../src/renderer/components/item-list/helpers/playlist-order.ts',
    import.meta.url,
);

test('playlist reordering moves exactly one occurrence and keeps source objects intact', async () => {
    const { reorderPlaylistItems } = await loadTypescript(helperUrl);
    const items = [
        { id: 'same', playlistItemId: '0' },
        { id: 'other', playlistItemId: '1' },
        { id: 'same', playlistItemId: '2' },
    ];
    const moved = reorderPlaylistItems(items, ['2'], '0', 'top');
    assert.deepEqual(moved, [items[2], items[0], items[1]]);
    assert.equal(moved[0], items[2]);
    assert.equal(moved[1], items[0]);
    assert.deepEqual(
        items.map((item) => item.playlistItemId),
        ['0', '1', '2'],
    );
});

test('multi-occurrence moves preserve playlist order instead of selection click order', async () => {
    const { reorderPlaylistItems } = await loadTypescript(helperUrl);
    const items = [
        { id: 'same', playlistItemId: '0' },
        { id: 'other', playlistItemId: '1' },
        { id: 'same', playlistItemId: '2' },
    ];
    assert.deepEqual(reorderPlaylistItems(items, ['2', '0'], '1', 'bottom'), [
        items[1],
        items[0],
        items[2],
    ]);
    assert.equal(reorderPlaylistItems(items, ['0'], '0', 'bottom'), items);
    assert.equal(reorderPlaylistItems(items, ['missing'], '0', 'top'), items);
    assert.equal(reorderPlaylistItems(items, ['0'], 'missing', 'top'), items);
    assert.equal(reorderPlaylistItems(items, ['0'], '1', null), items);
});

test('playlist occurrence IDs take precedence over song IDs, including index zero', async () => {
    const { getPlaylistItemId } = await loadTypescript(helperUrl);
    assert.equal(getPlaylistItemId({ id: 'song', playlistItemId: '0' }), '0');
    assert.equal(getPlaylistItemId({ id: 'song' }), 'song');
});
