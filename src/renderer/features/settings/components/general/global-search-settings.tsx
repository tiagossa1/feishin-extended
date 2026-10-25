import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { useGeneralSettings, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import { Switch } from '/@/shared/components/switch/switch';

export const GlobalSearchSettings = memo(() => {
    const { t } = useTranslation();
    const { globalSearch } = useGeneralSettings();
    const { setSettings } = useSettingsStoreActions();

    const options: SettingOption[] = (['tracks', 'albums', 'artists', 'commands'] as const).map(
        (key) => ({
            control: (
                <Switch
                    aria-label={t(`setting.globalSearch_${key}`)}
                    checked={globalSearch[key]}
                    onChange={(event) =>
                        setSettings({
                            general: {
                                globalSearch: {
                                    [key]: event.currentTarget.checked,
                                },
                            },
                        })
                    }
                />
            ),
            description: t(`setting.globalSearch_${key}`, { context: 'description' }),
            title: t(`setting.globalSearch_${key}`),
        }),
    );

    return (
        <SettingsSection
            id="general.globalSearch"
            options={options}
            title={t('page.setting.globalSearch')}
        />
    );
});
