import { createContext } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";
import * as setttingsManager from "./settingsManager.js";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({});

    async function loadSettings() {
        const loaded = await setttingsManager.loadSettings();
        setSettings(loaded);
        return loaded;
    };

    async function updateSetting(name, value) {
        await setttingsManager.setSetting(name, value);
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    async function defaultSetting(name) {
        const res = await setttingsManager.defaultSetting(name);
        setSettings(prev => ({ ...prev, [name]: res }));
    };

    return (
        <SettingsContext.Provider value={{ settings, loadSettings, updateSetting, defaultSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};

export function useSettings() {
    return useContext(SettingsContext);
};