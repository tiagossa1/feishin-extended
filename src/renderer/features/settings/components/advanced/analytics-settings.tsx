import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { Switch } from '/@/shared/components/switch/switch';

export const AnalyticsSettings = memo(() => {
    const { t } = useTranslation();

    const handleSetSendAnalytics = (send: boolean) => {
        if (send) {
            localStorage.setItem('umami.disabled', '0');
        } else {
            localStorage.setItem('umami.disabled', '1');
        }
    };

    const analyticsOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    aria-label={t('setting.analyticsEnable')}
                    defaultChecked={localStorage.getItem('umami.disabled') === '0'}
                    onChange={(e) => handleSetSendAnalytics(e.currentTarget.checked)}
                />
            ),
            description: t('setting.analyticsEnable_description'),
            title: t('setting.analyticsEnable'),
        },
    ];

    return <SettingsSection options={analyticsOptions} title={t('page.setting.analytics')} />;
});
