import isElectron from 'is-electron';
import { memo, useCallback, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { buildMpvAudioFilters } from './mpv-audio-filters';

import { WebAudioContext } from '/@/renderer/features/player/context/webaudio-context';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import {
    usePlaybackSettings,
    useSettingsStore,
    useSettingsStoreActions,
} from '/@/renderer/store/settings.store';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Slider } from '/@/shared/components/slider/slider';
import { Switch } from '/@/shared/components/switch/switch';
import { PlayerType } from '/@/shared/types/types';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;

export const SEMITONE_MIN = -12;
export const SEMITONE_MAX = 12;

// Shared with the quick pitch shift control in the playback bar settings popover
// (player-config.tsx) so both places apply pitch the same way.
export const useApplyPitch = () => {
    const settings = usePlaybackSettings();

    // Read from ref so we always get the current AudioContext state,
    // not the stale value captured when this callback was created.
    const webAudioContext = useContext(WebAudioContext);
    const webAudioContextRef = useRef(webAudioContext);
    useEffect(() => {
        webAudioContextRef.current = webAudioContext;
    }, [webAudioContext]);

    return useCallback(
        (pitch: { enabled: boolean; semitones: number }) => {
            // - MPV player -
            if (settings.type === PlayerType.LOCAL) {
                const { compressor, equalizer } = useSettingsStore.getState().playback;
                const filterStr = buildMpvAudioFilters(equalizer, compressor, pitch);
                mpvPlayer?.setProperties({ af: filterStr });
                return;
            }

            // - Web Audio player -
            const pitchShifter = webAudioContextRef.current.webAudio?.dsp?.pitchShifter;
            if (!pitchShifter) return;

            // Mutations to Web Audio API AudioParam values are intentional
            // side effects on the live audio graph, not React state mutations.
            // eslint-disable-next-line react-hooks/immutability
            pitchShifter.pitchSemitones.value = pitch.enabled ? pitch.semitones : 0;
        },
        [settings.type],
    );
};

export const PitchSettings = memo(() => {
    const { t } = useTranslation();
    const settings = usePlaybackSettings();
    const { setSettings } = useSettingsStoreActions();
    const applyPitch = useApplyPitch();

    const handleToggle = (enabled: boolean) => {
        const newPitch = { ...settings.pitch, enabled };
        setSettings({ playback: { pitch: newPitch } });
        applyPitch(newPitch);
    };

    const handleSemitonesChange = (semitones: number) => {
        const newPitch = { ...settings.pitch, semitones };
        setSettings({ playback: { pitch: newPitch } });
        applyPitch(newPitch);
    };

    const pitchOptions: SettingOption[] = [
        {
            control: (
                <Switch
                    defaultChecked={settings.pitch.enabled}
                    onChange={(e) => handleToggle(e.currentTarget.checked)}
                />
            ),
            description:
                settings.type === PlayerType.LOCAL
                    ? t('setting.pitchShift', { context: 'descriptionMpv' })
                    : t('setting.pitchShift', { context: 'descriptionWebAudio' }),
            title: t('setting.pitchShift'),
        },
        ...(settings.pitch.enabled
            ? [
                  {
                      control: (
                          <NumberInput
                              max={SEMITONE_MAX}
                              min={SEMITONE_MIN}
                              onChange={(value) => {
                                  if (typeof value === 'number') {
                                      handleSemitonesChange(value);
                                  }
                              }}
                              step={1}
                              value={settings.pitch.semitones}
                              w={80}
                          />
                      ),
                      description: t('setting.pitchShiftSemitones', { context: 'description' }),
                      title: t('setting.pitchShiftSemitones'),
                  },
                  {
                      control: (
                          <Slider
                              label={(v) => `${v > 0 ? '+' : ''}${v}`}
                              marks={[
                                  { label: '-12', value: -12 },
                                  { label: '0', value: 0 },
                                  { label: '+12', value: 12 },
                              ]}
                              max={SEMITONE_MAX}
                              min={SEMITONE_MIN}
                              onChange={handleSemitonesChange}
                              step={1}
                              value={settings.pitch.semitones}
                              w={260}
                          />
                      ),
                      description: '',
                      title: t('setting.pitchShiftSlider'),
                  },
              ]
            : []),
    ];

    return <SettingsSection options={pitchOptions} />;
});

PitchSettings.displayName = 'PitchSettings';
