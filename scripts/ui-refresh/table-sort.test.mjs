import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadTypescript } from './load-typescript.mjs';

test('table sorting reverses the active column and resets a new column to ascending', async () => {
    const { getNextTableSort } = await loadTypescript(
        new URL('../../src/renderer/components/item-list/helpers/table-sort.ts', import.meta.url),
    );
    assert.deepEqual(getNextTableSort({ sortBy: 'name', sortOrder: 'ASC' }, 'name'), {
        sortBy: 'name',
        sortOrder: 'DESC',
    });
    assert.deepEqual(getNextTableSort({ sortBy: 'name', sortOrder: 'DESC' }, 'name'), {
        sortBy: 'name',
        sortOrder: 'ASC',
    });
    assert.deepEqual(getNextTableSort({ sortBy: 'name', sortOrder: 'DESC' }, 'album'), {
        sortBy: 'album',
        sortOrder: 'ASC',
    });
    assert.deepEqual(getNextTableSort({ sortBy: 'duration', sortOrder: 'DESC' }, 'id'), {
        sortBy: 'id',
        sortOrder: 'ASC',
    });
});

test('song headers map only supported columns, including all title variants', async () => {
    const { getSongSortForColumn } = await loadTypescript(
        new URL('../../src/renderer/components/item-list/helpers/table-sort.ts', import.meta.url),
    );
    for (const [column, sort] of [
        ['name', 'name'],
        ['titleArtist', 'name'],
        ['titleCombined', 'name'],
        ['artists', 'artist'],
        ['album', 'album'],
        ['duration', 'duration'],
        ['rowIndex', 'id'],
    ]) {
        assert.equal(getSongSortForColumn(column), sort);
    }
    for (const column of ['imageUrl', '__layoutFill', 'unknown', 'toString']) {
        assert.equal(getSongSortForColumn(column), undefined);
    }
});
