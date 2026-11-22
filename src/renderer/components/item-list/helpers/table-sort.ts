export function getNextTableSort<T extends string>(
    current: { sortBy: T; sortOrder: 'ASC' | 'DESC' },
    requested: T,
): { sortBy: T; sortOrder: 'ASC' | 'DESC' } {
    return {
        sortBy: requested,
        sortOrder: current.sortBy === requested && current.sortOrder === 'ASC' ? 'DESC' : 'ASC',
    };
}

export function getSongSortForColumn(columnId: string): string | undefined {
    switch (columnId) {
        case 'album':
        case 'duration':
            return columnId;
        case 'artists':
            return 'artist';
        case 'name':
        case 'titleArtist':
        case 'titleCombined':
            return 'name';
        case 'rowIndex':
            return 'id';
        default:
            return undefined;
    }
}
