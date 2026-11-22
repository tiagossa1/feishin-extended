type PlaylistItemIdentity = {
    id: string;
    playlistItemId?: null | string;
};

export function getPlaylistItemId(item: PlaylistItemIdentity): string {
    return item.playlistItemId || item.id;
}

export function reorderPlaylistItems<T extends PlaylistItemIdentity>(
    items: T[],
    sourceIds: readonly string[],
    targetId: string,
    edge: 'bottom' | 'top' | null,
): T[] {
    const sources = new Set(sourceIds);
    if (
        !edge ||
        sources.has(targetId) ||
        !items.some((item) => getPlaylistItemId(item) === targetId)
    )
        return items;

    const moved = items.filter((item) => sources.has(getPlaylistItemId(item)));
    if (moved.length === 0) return items;
    const remaining = items.filter((item) => !sources.has(getPlaylistItemId(item)));
    const index =
        remaining.findIndex((item) => getPlaylistItemId(item) === targetId) +
        (edge === 'bottom' ? 1 : 0);
    return [...remaining.slice(0, index), ...moved, ...remaining.slice(index)];
}
