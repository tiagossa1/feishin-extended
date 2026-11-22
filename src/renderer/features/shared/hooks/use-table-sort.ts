import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

import {
    getNextTableSort,
    getSongSortForColumn,
} from '/@/renderer/components/item-list/helpers/table-sort';
import { ItemTableSort } from '/@/renderer/components/item-list/types';
import { useListFilterPersistence } from '/@/renderer/features/shared/hooks/use-list-filter-persistence';
import { useSortByFilter } from '/@/renderer/features/shared/hooks/use-sort-by-filter';
import { useSortOrderFilter } from '/@/renderer/features/shared/hooks/use-sort-order-filter';
import { FILTER_KEYS } from '/@/renderer/features/shared/utils';
import { useCurrentServer, useCurrentServerId } from '/@/renderer/store';
import { setMultipleSearchParams } from '/@/renderer/utils/query-params';
import { runInUrlTransition } from '/@/renderer/utils/url-transition';
import { ServerType, SongListSort, SortOrder } from '/@/shared/types/domain-types';
import { ItemListKey, TableColumn } from '/@/shared/types/types';

const songColumns = [
    TableColumn.TITLE,
    TableColumn.TITLE_ARTIST,
    TableColumn.TITLE_COMBINED,
    TableColumn.ARTIST,
    TableColumn.ALBUM,
    TableColumn.DURATION,
];

export function useTableSort({
    defaultSortBy,
    disabled,
    listKey,
}: {
    defaultSortBy: SongListSort;
    disabled?: boolean;
    listKey: ItemListKey;
}): ItemTableSort {
    const serverId = useCurrentServerId();
    const serverType = useCurrentServer()?.type;
    const { sortBy } = useSortByFilter<SongListSort>(defaultSortBy, listKey);
    const { sortOrder } = useSortOrderFilter(SortOrder.ASC, listKey);
    const { setFilters } = useListFilterPersistence(serverId, listKey);
    const [, setSearchParams] = useSearchParams();
    const sortableColumnIds = useMemo(() => {
        if (listKey === ItemListKey.PLAYLIST_SONG) return [...songColumns, TableColumn.ROW_INDEX];
        if (serverType === ServerType.SUBSONIC) {
            return songColumns.filter(
                (column) => getSongSortForColumn(column) === SongListSort.NAME,
            );
        }
        return songColumns;
    }, [listKey, serverType]);

    const onSort = (columnId: TableColumn) => {
        if (disabled || !sortableColumnIds.includes(columnId)) return;
        const requested = getSongSortForColumn(columnId) as SongListSort | undefined;
        if (!requested) return;
        const next = getNextTableSort({ sortBy, sortOrder }, requested);
        const filters = {
            [FILTER_KEYS.SHARED.SORT_BY]: next.sortBy,
            [FILTER_KEYS.SHARED.SORT_ORDER]: SortOrder[next.sortOrder],
        };
        runInUrlTransition(() => {
            setSearchParams((prev) => setMultipleSearchParams(prev, filters), { replace: true });
            setFilters(filters);
        });
    };

    return {
        activeColumnId: sortableColumnIds.find((column) => getSongSortForColumn(column) === sortBy),
        direction: sortOrder,
        disabled,
        onSort,
        sortableColumnIds,
    };
}
