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

    async function testPath(path) {
        try {
            const stats = await Neutralino.filesystem.getStats(path);
            if (stats.isDirectory !== true) return false;
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
                    id="data-path"
                    onchange={async (txt) => {
                        if (txt.trim() == "") {
                            await defaultSetting('dataDirectory');
                            return Neutralino.app.restartProcess();
                        };

                        const possible = await dirPossible(txt);
                        if (!possible) {
                            await defaultSetting('dataDirectory');
                            return Neutralino.app.restartProcess();
                        };

                        await updateSetting('dataDirectory', txt);
                        Neutralino.app.restartProcess();
                    }}
                    value={settings.dataDirectory}
                    placeholder="Data directory..."
                    label="Data Directory (Must Be Absolute)"
                    minlength={0}
                    maxlength={200}
                />
                <Button id="data-select" onclick={async () => {
                    const res = await Neutralino.os.showFolderDialog("Select data path");
                    if (!res || res.length === 0) return;
                    const src = res[0].trim();
                    if (!(await testPath(src))) 
                        return showToast("Data path isn't a valid folder");
                    
                    const possible = await dirPossible(src);
                    if (!possible) {
                        await defaultSetting('dataDirectory');
                        return Neutralino.app.restartProcess();
                    };

                    await updateSetting('dataDirectory', src);
                    Neutralino.app.restartProcess();
                }}>
                    Select data path
                </Button>
            </div>
        </>
    );
};