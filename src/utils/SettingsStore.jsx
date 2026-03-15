import { createContext } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";

import { defaultSettings } from "../data/defaultSettings.js";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({});

    async function updateSetting(name, value) {
        const key = `settings-${name}`;

        await Neutralino.storage.setData(key, JSON.stringify(value));

        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        async function load() {
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

                    if (typeof defaultSetting === "function") defaultSetting = defaultSetting();
                    loaded[name] = defaultSetting;

                    await Neutralino.storage.setData(
                        key,
                        JSON.stringify(defaultSetting)
                    );
                };
            };

            setSettings(loaded);
        };

        load();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};

export function useSettings() {
    return useContext(SettingsContext);
};