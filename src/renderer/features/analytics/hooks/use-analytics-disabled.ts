export const isAnalyticsDisabled = () => {
    // Off by default in this custom build; requires explicit opt-in
    // (localStorage 'umami.disabled' === '0') via the Analytics setting.
    const isSettingOptOut = localStorage.getItem('umami.disabled') !== '0';
    const isDevMode = process.env.NODE_ENV === 'development';
    const isEnvOptOut =
        window && (window.ANALYTICS_DISABLED === true || window.ANALYTICS_DISABLED === 'true');

    return isSettingOptOut || isDevMode || isEnvOptOut;
};
