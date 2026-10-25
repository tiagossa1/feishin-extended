import { ReactNode } from 'react';

import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useSettingSearchContext } from '/@/renderer/features/settings/context/search-context';
import { useAppStore, useAppStoreActions } from '/@/renderer/store/app.store';
import { Accordion } from '/@/shared/components/accordion/accordion';
import { Stack } from '/@/shared/components/stack/stack';
import { TextTitle } from '/@/shared/components/text-title/text-title';

export type SettingOption = {
    control: ReactNode;
    description: ReactNode | string;
    indent?: boolean;
    isHidden?: boolean;
    note?: string;
    title: string;
};

interface SettingsSectionProps {
    extra?: ReactNode;
    id: string;
    options: SettingOption[];
    title: ReactNode;
}

export const SettingsSection = ({ extra, id, options, title }: SettingsSectionProps) => {
    const keyword = useSettingSearchContext();
    const hasKeyword = keyword !== '';
    const expanded = useAppStore((state) => state.settingsSectionsExpanded[id] ?? false);
    const { setSettingsSectionExpanded } = useAppStoreActions();

    const values = options.filter(
        (o) => !o.isHidden && (!hasKeyword || o.title.toLocaleLowerCase().includes(keyword)),
    );
    const isSearchMatch = hasKeyword && (values.length > 0 || extra !== undefined);
    const isExpanded = isSearchMatch || expanded;

    return (
        <Accordion
            onChange={(value) => {
                if (!isSearchMatch) setSettingsSectionExpanded(id, value === id);
            }}
            value={isExpanded ? id : null}
        >
            <Accordion.Item value={id}>
                <Accordion.Control disabled={isSearchMatch}>
                    <TextTitle fw={600} order={4}>
                        {title}
                    </TextTitle>
                </Accordion.Control>
                <Accordion.Panel>
                    <Stack gap="xl" px="xl">
                        {values.map((option) => (
                            <SettingsOptions key={`option-${option.title}`} {...option} />
                        ))}
                        {extra}
                    </Stack>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
};
