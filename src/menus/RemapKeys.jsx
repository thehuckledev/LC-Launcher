import "./RemapKeys.css";

import { useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";

import { useSettings } from "../utils/SettingsStore.jsx";
import KeyRemapper from "../lib/keyRemapper.js";

import { showAlert } from "../components/Alert.jsx";
import Button from "../components/Button.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function RemapKeysMenu({ setMenu }) {
    const { settings, updateSetting } = useSettings();

    const [bindings, setBindings] = useState({});
    const [defaultBindings, setDefaultBindings] = useState({});
    const [bindingsLabels, setBindingsLabels] = useState({});
    const [bindingsCatagories, setBindingsCatagories] = useState([]);
    const [listeningAction, setListeningAction] = useState(null);

    useEffect(() => {
        async function loadKeybinds() {
            const defaultBindings = await KeyRemapper.getDefaultBindings();
            setDefaultBindings(defaultBindings);

            const currentBindings = await KeyRemapper.getBindings();
            setBindings(currentBindings);

            const bindingsLabels = await KeyRemapper.getBindingsLabels();
            setBindingsLabels(bindingsLabels);

            const bindingsCatagories = await KeyRemapper.getBindingsCatagories();
            setBindingsCatagories(bindingsCatagories);
        };

        loadKeybinds();
    }, []);

    useEffect(() => {
        window.mappingKey = !!listeningAction;
    }, [listeningAction]);

    useEffect(() => {
        updateSetting("keyBindings", bindings);
    }, [bindings]);

    useEffect(() => {
        if (!listeningAction) return;

        const handleKeyDown = async (e) => {
            e.preventDefault();
            e.stopPropagation();

            let pressedKey = e.key.toUpperCase();

            if (e.code === "Enter") pressedKey = "RETURN";
            else if (e.code === "ShiftLeft") pressedKey = "LEFTSHIFT";
            else if (e.code === "ShiftRight") pressedKey = "RIGHTSHIFT";
            else if (e.code.includes("Control")) pressedKey = "CONTROL";
            else if (e.code.startsWith("Arrow")) pressedKey = e.code.replace("Arrow", "").toUpperCase();

            const isValidKey = await KeyRemapper.isValidKey(pressedKey);
            if (!isValidKey) pressedKey = "NONE";

            const updatedBindings = { ...bindings, [listeningAction]: pressedKey };
            setBindings(updatedBindings);
            KeyRemapper.setBinding(listeningAction, pressedKey);

            setListeningAction(null);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [listeningAction, bindings]);

    const handleResetKeybind = (action) => {
        const defaultKey = defaultBindings[action];
        if (!defaultKey) return;

        const updatedBindings = { ...bindings, [action]: defaultKey };
        setBindings(updatedBindings);
        KeyRemapper.setBinding(action, defaultKey);
    };

    const handleResetDefaults = () => {
        setBindings(defaultBindings);
        KeyRemapper.setBindings(defaultBindings);
    };

    const isAllDefault =
        Object.keys(defaultBindings).length > 0 &&
        Object.keys(defaultBindings).every(
            (key) => bindings[key] === defaultBindings[key]
        );

    const keyCounts = Object.values(bindings).reduce((acc, key) => {
        if (key && key !== "NONE") acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <div id="top-bar">
                <h1>Key Mappings</h1>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('options')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="remap-keys">
                <div id="remap-keys-actions">
                    <Button onclick={() => updateSetting('remapKeys', !settings.remapKeys)}>
                        {settings.remapKeys == false ? 'Remap Keys: Disabled' : 'Remap Keys: Enabled'}
                    </Button>
                    <Button
                        id="reset-keys-btn"
                        onclick={handleResetDefaults}
                        disabled={isAllDefault || settings.remapKeys == false}
                        pushable={!isAllDefault && settings.remapKeys == true}
                    >
                        Reset to Defaults
                    </Button>
                </div>

                <div id="remap-keys-list">
                    {bindingsCatagories.map(({ category, actions }) => (
                        <div key={category} className="remap-keys-category">
                            <h2 className="remap-keys-category-header">{category}</h2>
                            {actions.map((action) => {
                                if (!(action in bindings)) return null;

                                const isListening = listeningAction === action;
                                const boundKey = bindings[action] || "NONE";
                                const label = bindingsLabels[action] || action;
                                const isDefault = boundKey === defaultBindings[action];
                                const isDuplicate = boundKey !== "NONE" && keyCounts[boundKey] > 1;

                                return (
                                    <div key={action} className="remap-keys-row">
                                        <span className="remap-keys-label">{label}</span>
                                        <Button
                                            type={isDuplicate ? "DESTRUCTIVE" : null}
                                            onclick={() => setListeningAction(isListening ? null : action)}
                                            disabled={!settings.remapKeys || isListening}
                                            pushable={settings.remapKeys && !isListening}
                                        >
                                            {isListening ? "> Press Key <" : boundKey}
                                        </Button>
                                        <Button
                                            id="keybind-reset-btn"
                                            onclick={() => handleResetKeybind(action)}
                                            disabled={!settings.remapKeys || isDefault || isListening}
                                            pushable={settings.remapKeys && !isDefault && !isListening}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};