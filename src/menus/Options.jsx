import "./Options.css";

import Neutralino from "@neutralinojs/lib";

import { useSettings } from "../utils/SettingsStore.jsx";

import Textbox from "../components/Textbox.jsx";
import Button from "../components/Button.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function OptionsMenu({ setMenu }) {
    const { settings, updateSetting, defaultSetting } = useSettings();

    async function dirPossible(path) {
        try {
            await Neutralino.filesystem.createDirectory(path);
            return true;
        } catch {
            return false;
        };
    };

    function incrementVolume() {
        if (typeof settings.volume !== 'number') return updateSetting('volume', 100);
        let val = settings.volume;
        val += 20;
        if (val > 100) val = 0;
        updateSetting('volume', val)
    };

    return (
        <>
            <div id="top-bar">
                <div></div>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="options">
                <Button onclick={() => updateSetting('fullscreen', !settings.fullscreen)}>
                    {settings.fullscreen == false ? 'Fullscreen: Disabled' : 'Fullscreen: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('menuMusic', !settings.menuMusic)}>
                    {settings.menuMusic == false ? 'Menu Music: Disabled' : 'Menu Music: Enabled'}
                </Button>
                <Button onclick={() => incrementVolume()}>
                    Volume: {settings.volume}%
                </Button>
                <Textbox
                    id="instance-path"
                    onchange={async (txt) => {
                        if (txt.trim() == "") return defaultSetting('instancesDirectory');

                        const possible = await dirPossible(txt);
                        if (!possible) return defaultSetting('instancesDirectory');
                        updateSetting('instancesDirectory', txt)
                    }}
                    value={settings.instancesDirectory}
                    placeholder="Instances directory..."
                    label="Instances Directory (Must Be Absolute)"
                    minlength={0}
                    maxlength={200}
                />
            </div>
        </>
    );
};