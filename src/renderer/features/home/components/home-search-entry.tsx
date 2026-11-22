import { FormEvent, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate } from 'react-router';

import styles from './home-search-entry.module.css';

import { AppRoute } from '/@/renderer/router/routes';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Icon } from '/@/shared/components/icon/icon';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { LibraryItem } from '/@/shared/types/domain-types';

export function HomeSearchEntry(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = String(new FormData(event.currentTarget).get('query') || '').trim();
        if (!query) return;
        navigate({
            pathname: generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG }),
            search: new URLSearchParams({ query }).toString(),
        });
    };

    return (
        <form className={styles.form} onSubmit={onSubmit} role="search">
            <TextInput
                aria-label={t('page.home.searchTracks')}
                classNames={{ input: styles.input }}
                leftSection={<Icon icon="search" />}
                name="query"
                placeholder={t('page.home.searchTracks')}
                radius="xl"
                rightSection={
                    <ActionIcon
                        aria-label={t('common.search')}
                        icon="arrowRightS"
                        tooltip={{ label: t('common.search') }}
                        type="submit"
                        variant="subtle"
                    />
                }
                size="lg"
            />
        </form>
    );
}
