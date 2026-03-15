import { createContext } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";

import { defaultSettings } from "../data/defaultSettings.js";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({});

    async function defaultSetting(name) {
        const key = `settings-${name}`;

        let defaultSetting = defaultSettings[name];
        if (typeof defaultSetting === "function") defaultSetting = await defaultSetting();

        await Neutralino.storage.setData(
            key,
            JSON.stringify(defaultSetting)
        );

        setSettings(prev => ({
            ...prev,
            [name]: defaultSetting
        }));
    };

    async function updateSetting(name, value) {
        const key = `settings-${name}`;

        await Neutralino.storage.setData(key, JSON.stringify(value));

        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    async function loadSettings() {
        let keys = [];

        try { keys = await Neutralino.storage.getKeys(); }
        catch { keys = []; }

        const loaded = { ...defaultSettings };

        for (const name in defaultSettings) {
            const key = `settings-${name}`;

            if (keys.includes(key)) {
                const value = await Neutralino.storage.getData(key);
                loaded[name] = JSON.parse(value);
            } else {
                let defaultSetting = defaultSettings[name];

                if (typeof defaultSetting === "function") defaultSetting = await defaultSetting();
                loaded[name] = defaultSetting;

                await Neutralino.storage.setData(
                    key,
                    JSON.stringify(defaultSetting)
                );
            };
        };

        setSettings(loaded);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, loadSettings, defaultSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};

export function useSettings() {
    return useContext(SettingsContext);
};